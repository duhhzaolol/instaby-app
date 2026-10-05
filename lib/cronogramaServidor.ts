import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chaveDiaSaoPaulo } from "@/lib/dataHora";
import { getUsuarioAtual, permissoesDe, podeVerCliente } from "@/lib/permissoes";

export const FORMATOS_CRONOGRAMA = ["Reel", "Carrossel", "Outro"] as const;
export type FormatoCronograma = (typeof FORMATOS_CRONOGRAMA)[number];
export type PautaEntrada = {
  tarefaId: string;
  titulo: string;
  formato: FormatoCronograma;
  dataPrevista: string;
  textoCliente: string;
};

export class ErroCronograma extends Error {
  constructor(public status: number, mensagem: string) { super(mensagem); }
}

export function novoTokenCronograma() { return randomBytes(32).toString("hex"); }
export function tokenCronogramaValido(token: string) { return /^[a-f0-9]{64}$/.test(token); }

export function validarMes(mes: unknown): string {
  if (typeof mes !== "string" || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(mes)) {
    throw new ErroCronograma(400, "Informe o mês no formato AAAA-MM.");
  }
  return mes;
}

export function limitesMes(mes: string) {
  validarMes(mes);
  const [ano, numeroMes] = mes.split("-").map(Number);
  // O calendário do app usa São Paulo. Evita incluir o dia anterior em UTC.
  const inicio = new Date(Date.UTC(ano, numeroMes - 1, 1, 3));
  const fim = new Date(Date.UTC(ano, numeroMes, 1, 3));
  return { gte: inicio, lt: fim };
}

function textoLimitado(valor: unknown, min: number, max: number, campo: string) {
  if (typeof valor !== "string") throw new ErroCronograma(400, `${campo} inválido.`);
  const texto = valor.trim();
  if (texto.length < min || texto.length > max) {
    throw new ErroCronograma(400, `${campo} deve ter de ${min} a ${max} caracteres.`);
  }
  return texto;
}

export function validarPautas(valor: unknown, mes: string): PautaEntrada[] {
  if (!Array.isArray(valor) || valor.length > 100) throw new ErroCronograma(400, "Selecione até 100 pautas.");
  const ids = new Set<string>();
  return valor.map((entrada) => {
    if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) throw new ErroCronograma(400, "Pauta inválida.");
    const tarefaId = textoLimitado(entrada.tarefaId, 1, 100, "Tarefa");
    if (ids.has(tarefaId)) throw new ErroCronograma(400, "Uma tarefa foi selecionada duas vezes.");
    ids.add(tarefaId);
    const titulo = textoLimitado(entrada.titulo, 1, 300, "Título");
    const textoCliente = textoLimitado(entrada.textoCliente, 0, 20000, "Texto para o cliente");
    if (!FORMATOS_CRONOGRAMA.includes(entrada.formato)) throw new ErroCronograma(400, "Formato inválido.");
    const dataPrevista = entrada.dataPrevista;
    if (typeof dataPrevista !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dataPrevista) || dataPrevista.slice(0, 7) !== mes) {
      throw new ErroCronograma(400, "A data prevista deve pertencer ao mês escolhido.");
    }
    const data = new Date(`${dataPrevista}T12:00:00Z`);
    if (!Number.isFinite(data.getTime()) || data.toISOString().slice(0, 10) !== dataPrevista) throw new ErroCronograma(400, "Data prevista inválida.");
    return { tarefaId, titulo, textoCliente, formato: entrada.formato, dataPrevista };
  });
}

export function validarComentario(valor: unknown, comAutor = true) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) throw new ErroCronograma(400, "Comentário inválido.");
  const entrada = valor as Record<string, unknown>;
  return {
    texto: textoLimitado(entrada.texto, 3, 2000, "Comentário"),
    ...(comAutor ? { autor: textoLimitado(entrada.autor, 2, 80, "Nome") } : {}),
  };
}

// Limita antes de juntar o corpo inteiro na memória, inclusive sem Content-Length.
export async function lerJsonLimitado(request: NextRequest, limite = 8192): Promise<Record<string, unknown>> {
  const tamanho = Number(request.headers.get("content-length") || 0);
  if (tamanho > limite) throw new ErroCronograma(413, "O pedido excede o tamanho permitido.");
  if (!request.body) throw new ErroCronograma(400, "Pedido inválido.");
  const leitor = request.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await leitor.read();
    if (done) break;
    total += value.byteLength;
    if (total > limite) {
      await leitor.cancel();
      throw new ErroCronograma(413, "O pedido excede o tamanho permitido.");
    }
    partes.push(value);
  }
  try {
    const bytes = new Uint8Array(total);
    let indice = 0;
    for (const parte of partes) { bytes.set(parte, indice); indice += parte.byteLength; }
    const valor = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!valor || typeof valor !== "object" || Array.isArray(valor)) throw new Error();
    return valor;
  } catch { throw new ErroCronograma(400, "Pedido inválido."); }
}

export async function autorizarCronogramaCliente(clienteId: string) {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new ErroCronograma(401, "Não autenticado.");
  if (!permissoesDe(usuario).acessoClienteCompleto || !(await podeVerCliente(usuario, clienteId))) {
    throw new ErroCronograma(403, "Não autorizado.");
  }
  if (!(await prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } }))) throw new ErroCronograma(404, "Cliente não encontrado.");
  return usuario;
}

export function responderErroCronograma(erro: unknown) {
  if (erro instanceof ErroCronograma) return NextResponse.json({ erro: erro.message }, { status: erro.status });
  // Não registra corpo do pedido, token ou dados da conexão.
  console.error("Não foi possível concluir a operação do cronograma.");
  return NextResponse.json({ erro: "Não foi possível concluir a operação. Tente novamente." }, { status: 500 });
}

export const incluirPautas = {
  pautas: {
    orderBy: [{ dataPrevista: "asc" }, { createdAt: "asc" }],
    include: { comentarios: { orderBy: { createdAt: "asc" } } },
  },
} satisfies Prisma.CronogramaClienteInclude;

type CronogramaCompleto = Prisma.CronogramaClienteGetPayload<{ include: typeof incluirPautas }>;
type Comentario = Pick<Prisma.ComentarioPautaGetPayload<Record<string, never>>, "id" | "autor" | "texto" | "origem" | "createdAt">;
export function serializarComentario(comentario: Comentario) {
  return { id: comentario.id, autor: comentario.autor, texto: comentario.texto, origem: comentario.origem as "cliente" | "agencia", createdAt: comentario.createdAt.toISOString() };
}

export function serializarCronograma(cronograma: CronogramaCompleto | null) {
  if (!cronograma) return null;
  return {
    id: cronograma.id, token: cronograma.token, ativo: cronograma.ativo, mes: cronograma.mes,
    pautas: cronograma.pautas.map((pauta) => ({
      id: pauta.id, tarefaId: pauta.tarefaId, titulo: pauta.titulo,
      formato: pauta.formato as FormatoCronograma, dataPrevista: pauta.dataPrevista,
      textoCliente: pauta.textoCliente, visivel: pauta.visivel,
      comentarios: pauta.comentarios.map(serializarComentario),
    })),
  };
}

export async function buscarTarefasCronograma(clienteId: string, mes: string) {
  const tarefas = await prisma.tarefa.findMany({
    where: { clienteId, publicacaoSugeridaEm: limitesMes(mes) },
    select: { id: true, titulo: true, categoria: true, descricao: true, publicacaoSugeridaEm: true },
    orderBy: [{ publicacaoSugeridaEm: "asc" }, { createdAt: "asc" }],
  });
  return tarefas.map((tarefa) => ({ id: tarefa.id, titulo: tarefa.titulo, categoria: tarefa.categoria, descricao: tarefa.descricao, dataPrevista: chaveDiaSaoPaulo(tarefa.publicacaoSugeridaEm!) }));
}

// A lista de campos é explícita. Nem a tarefa, nem notas internas entram no link.
export async function buscarCronogramaPublico(token: string) {
  if (!tokenCronogramaValido(token)) return null;
  const cronograma = await prisma.cronogramaCliente.findUnique({
    where: { token },
    select: {
      ativo: true, clienteId: true, mes: true, cliente: { select: { nome: true } },
      pautas: {
        where: { visivel: true }, orderBy: [{ dataPrevista: "asc" }, { createdAt: "asc" }],
        select: {
          id: true, titulo: true, formato: true, dataPrevista: true, textoCliente: true,
          tarefaId: true, tarefa: { select: { clienteId: true } },
          comentarios: { orderBy: { createdAt: "asc" }, select: { id: true, autor: true, texto: true, origem: true, createdAt: true } },
        },
      },
    },
  });
  if (!cronograma?.ativo) return null;
  return {
    clienteNome: cronograma.cliente.nome,
    mes: cronograma.mes,
    pautas: cronograma.pautas
      .filter((pauta) => !pauta.tarefaId || pauta.tarefa?.clienteId === cronograma.clienteId)
      .map((pauta) => ({
        id: pauta.id, titulo: pauta.titulo, formato: pauta.formato as FormatoCronograma,
        dataPrevista: pauta.dataPrevista, textoCliente: pauta.textoCliente,
        comentarios: pauta.comentarios.map(serializarComentario),
      })),
  };
}

// Evita que uma atualização de seleção ou revogação concorra com um comentário.
// Repetir só a transação não repete leitura do corpo nem gera comentários extras.
export async function transacaoCronograma<T>(executar: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let tentativa = 0; ; tentativa++) {
    try {
      return await prisma.$transaction(executar, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (erro) {
      if (tentativa < 2 && erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2034") continue;
      throw erro;
    }
  }
}
