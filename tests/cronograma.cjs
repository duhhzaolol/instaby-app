const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
let usuario = { nome: 'Equipe', master: true };
let podeVer = true;
let publico = null;
let pauta = null;
let recentes = 0;
let gravados = [];
let tasks = [{ id: 't1', publicacaoSugeridaEm: new Date('2026-10-06T15:00:00Z') }];
let ocultou = 0;
let upserts = [];
const salvo = { id: 'c1', token: 'a'.repeat(64), ativo: true, mes: '2026-10', pautas: [] };
class KnownError extends Error {}
const prisma = {
  cliente: { findUnique: async () => ({ id: 'cliente1' }) },
  cronogramaCliente: {
    findUnique: async () => publico,
    upsert: async () => ({ id: 'c1' }),
    findUniqueOrThrow: async () => salvo,
    updateMany: async ({ data }) => { assert.equal(data.ativo, false); assert.match(data.token, /^[a-f0-9]{64}$/); return { count: 1 }; },
  },
  tarefa: { findMany: async () => tasks },
  pautaCronograma: {
    findFirst: async ({ where }) => {
      if (where.cronograma.token) {
        assert.equal(where.visivel, true);
        assert.equal(where.cronograma.ativo, true);
        assert.equal(where.cronograma.token, 'a'.repeat(64));
      }
      return pauta && pauta.id === where.id ? pauta : null;
    },
    updateMany: async ({ data }) => { assert.equal(data.visivel, false); ocultou++; return { count: 1 }; },
    upsert: async (dados) => { upserts.push(dados); return dados.create; },
  },
  comentarioPauta: {
    count: async () => recentes,
    create: async ({ data }) => { gravados.push(data); return { ...data, id: 'comment1', createdAt: new Date('2026-10-05T12:00:00Z') }; },
  },
  $transaction: async (executar) => executar(prisma),
};
let helpers;
function carregar(arquivo) {
  const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', arquivo), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const module = { exports: {} };
  const requireMock = (nome) => {
    if (nome === 'crypto') return require('node:crypto');
    if (nome === '@prisma/client') return { Prisma: { PrismaClientKnownRequestError: KnownError, TransactionIsolationLevel: { Serializable: 'Serializable' } } };
    if (nome === 'next/server') return { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } };
    if (nome === '@/lib/prisma') return { prisma };
    if (nome === '@/lib/dataHora') return { chaveDiaSaoPaulo: (d) => d.toISOString().slice(0, 10) };
    if (nome === '@/lib/permissoes') return { getUsuarioAtual: async () => usuario, permissoesDe: () => ({ acessoClienteCompleto: true }), podeVerCliente: async () => podeVer };
    if (nome === '@/lib/cronogramaServidor') return helpers;
    throw new Error(nome);
  };
  vm.runInNewContext(output.outputText, { require: requireMock, module, exports: module.exports, console, Uint8Array, TextDecoder, Date });
  return module.exports;
}
helpers = carregar('lib/cronogramaServidor.ts');
const interno = carregar('app/api/clientes/[id]/cronograma/route.ts');
const externo = carregar('app/api/cronograma/[token]/pautas/[pautaId]/comentarios/route.ts');
const request = (body) => ({ headers: new Headers(), body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(JSON.stringify(body))); c.close(); } }), nextUrl: new URL('https://instaby.test/api?mes=2026-10') });
const context = { params: { id: 'cliente1' } };
const entrada = { tarefaId: 't1', titulo: 'Uma pauta', formato: 'Reel', dataPrevista: '2026-10-06', textoCliente: 'Roteiro aprovado para apresentar' };
(async () => {
  assert.equal(helpers.validarMes('2026-10'), '2026-10');
  for (const mes of ['2026-00', '2026-13', null, '2026-1', 'outubro']) assert.throws(() => helpers.validarMes(mes));
  for (const data of ['2026-10-32', '2026-09-30', '2026-10-06T12:00:00Z']) assert.throws(() => helpers.validarPautas([{ ...entrada, dataPrevista: data }], '2026-10'));
  assert.throws(() => helpers.validarPautas([entrada, entrada], '2026-10'));
  assert.throws(() => helpers.validarComentario({ autor: 'Cliente', texto: 'x' }));
  usuario = null;
  assert.equal((await interno.PUT(request({ mes: '2026-10', pautas: [entrada] }), context)).status, 401);
  usuario = { nome: 'Equipe', master: true }; podeVer = false;
  assert.equal((await interno.GET(request({}), context)).status, 403);
  podeVer = true; tasks = [];
  assert.equal((await interno.PUT(request({ mes: '2026-10', pautas: [entrada] }), context)).status, 400);
  assert.equal(ocultou, 0);
  tasks = [{ id: 't1', publicacaoSugeridaEm: new Date('2026-10-08T15:00:00Z') }];
  assert.equal((await interno.PUT(request({ mes: '2026-10', pautas: [entrada] }), context)).status, 409);
  assert.equal(ocultou, 0);
  tasks = [{ id: 't1', publicacaoSugeridaEm: new Date('2026-10-06T15:00:00Z') }];
  assert.equal((await interno.PUT(request({ mes: '2026-10', pautas: [entrada] }), context)).status, 200);
  assert.equal(ocultou, 1); assert.equal(upserts[0].create.visivel, true);
  assert.equal(upserts[0].create.textoCliente, entrada.textoCliente);
  assert.equal((await interno.DELETE(request({}), context)).status, 200);
  const publicContext = { params: { token: 'a'.repeat(64), pautaId: 'p1' } };
  assert.equal((await externo.POST(request({ autor: 'Lauro', texto: 'Pode alterar essa fala?' }), publicContext)).status, 404);
  pauta = { id: 'p1', tarefaId: 't1', tarefa: { clienteId: 'outro' }, cronograma: { clienteId: 'cliente1' } };
  assert.equal((await externo.POST(request({ autor: 'Lauro', texto: 'Pode alterar essa fala?' }), publicContext)).status, 404);
  pauta.tarefa.clienteId = 'cliente1'; recentes = 20;
  assert.equal((await externo.POST(request({ autor: 'Lauro', texto: 'Pode alterar essa fala?' }), publicContext)).status, 429);
  recentes = 0;
  const comentario = await externo.POST(request({ autor: 'Lauro', texto: 'Pode alterar essa fala?', origem: 'agencia' }), publicContext);
  assert.equal(comentario.status, 201); assert.equal(comentario.body.origem, 'cliente'); assert.equal(gravados.length, 1);
  publico = { ativo: true, clienteId: 'cliente1', mes: '2026-10', cliente: { nome: 'Lauro' }, segredoInterno: 'privado', pautas: [{ id: 'p1', tarefaId: 't1', tarefa: { clienteId: 'cliente1' }, titulo: 'Uma pauta', formato: 'Reel', dataPrevista: '2026-10-06', textoCliente: 'Fala pública', comentarios: [], descricaoInterna: 'privada' }, { id: 'p2', tarefaId: 't2', tarefa: { clienteId: 'outro' }, comentarios: [] }] };
  const pagina = await helpers.buscarCronogramaPublico('a'.repeat(64));
  assert.equal(pagina.pautas.length, 1);
  assert.deepEqual(Object.keys(pagina.pautas[0]).sort(), ['comentarios', 'dataPrevista', 'formato', 'id', 'textoCliente', 'titulo'].sort());
  assert.equal(await helpers.buscarCronogramaPublico('invalido'), null);
  publico.ativo = false; assert.equal(await helpers.buscarCronogramaPublico('a'.repeat(64)), null);
  console.log('Backend: validação, autorização, seleção, revogação, comentários e campos públicos conferidos.');
})().catch((erro) => { console.error(erro); process.exitCode = 1; });
