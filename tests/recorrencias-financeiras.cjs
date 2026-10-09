const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const repo = path.resolve(__dirname, '..');
const req = require('module').createRequire(repo + '/package.json');
const ts = req('typescript');
const cache = new Map();
let rows = [], creates = 0, locks = [], tail = Promise.resolve(), queries = 0, fail = false;
const clone = value => structuredClone(value);
const prisma = {
  despesa: { findMany: async () => { queries++; if (fail) throw new Error('Falha simulada'); return rows.filter(d => d.recorrente && d.status !== 'cancelado').map(d => ({ id: d.id })); } },
  $transaction: async fn => {
    const previous = tail;
    let release;
    tail = new Promise(resolve => release = resolve);
    await previous;
    const tx = {
      $executeRaw: async (sql, key) => { locks.push(key); },
      despesa: {
        findUnique: async ({where}) => clone(rows.find(d => d.id === where.id) || null),
        findMany: async ({where}) => clone(rows.filter(d => d.id === where.OR[0].id || d.origemRecorrenteId === where.OR[1].origemRecorrenteId)),
        create: async ({data}) => { creates++; const row = { id: `gerada-${creates}`, pagamentos: [], ...clone(data) }; rows.push(row); return clone(row); },
      },
    };
    try { return await fn(tx); } finally { release(); }
  },
};
const mocks = {
  '@/lib/prisma': {prisma},
  '@/lib/templatesTarefas': {montarCicloDeTarefas: () => []},
  '@/lib/dataHora': {chaveDiaSaoPaulo: d => new Intl.DateTimeFormat('sv-SE', {timeZone: 'America/Sao_Paulo'}).format(d)},
};
function load(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const mod = {exports: {}};
  const output = ts.transpileModule(fs.readFileSync(path.join(repo,rel),'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS,target: ts.ScriptTarget.ES2020}}).outputText;
  new Function('require','module','exports',output)(id => id in mocks ? mocks[id] : id.startsWith('@/') ? load(id.slice(2)+'.ts') : req(id),mod,mod.exports);
  cache.set(rel,mod.exports);
  return mod.exports;
}
const {preverDespesasRecorrentes,proximoMesFinanceiro} = load('lib/previsaoDespesasRecorrentes.ts');
const {garantirDespesasRecorrentesDoMes} = load('lib/garantirRecorrentes.ts');
const fixed = new Date('2026-10-09T13:00:00Z');
const model = overrides => ({id:'aluguel',descricao:'Aluguel',valor:900,data:new Date('2026-09-01T00:00:00Z'),vencimento:new Date('2026-09-05T00:00:00Z'),status:'pago',tipo:'flexivel',categoriaFinanceira:'despesa_fixa',categoria:'Aluguel',recorrente:true,origemRecorrenteId:null,pagamentos:[],...overrides});
const occurrence = overrides => model({id:'outubro',data:new Date('2026-10-01T03:00:00Z'),vencimento:new Date('2026-10-05T03:00:00Z'),status:'pendente',recorrente:false,origemRecorrenteId:'aluguel',...overrides});
let passed = 0;
async function test(name,fn) {
  rows = [model()]; creates = 0; locks = []; queries=0; fail=false;
  await fn(); passed++; console.log('PASS '+name);
}
(async () => {
  await test('Pagou o modelo antigo: mês atual nasce pendente com categoria operacional normalizada', async () => {
    await garantirDespesasRecorrentesDoMes(fixed);
    assert.equal(creates,1);
    assert.equal(rows[1].status,'pendente'); assert.equal(rows[1].tipo,'fixa'); assert.equal(rows[1].categoriaFinanceira,'despesa_fixa');
    assert.equal(rows[1].origemRecorrenteId,'aluguel'); assert.equal(rows[1].vencimento.toISOString(),'2026-10-05T03:00:00.000Z');
    assert.equal(rows[0].status,'pago'); assert.equal(rows[0].valor,900);
  });
  await test('Dez chamadas simultâneas criam uma só ocorrência protegida pela trava do modelo', async () => {
    await Promise.all(Array.from({length:10},() => garantirDespesasRecorrentesDoMes(fixed)));
    assert.equal(creates,1); assert.equal(rows.length,2); assert.equal(queries,1); assert.equal(locks.length,1); assert(locks.every(k => k === 'despesa-recorrente:aluguel'));
  });
  await test('Após concluir, novo modelo aparece imediatamente; falha libera próxima tentativa', async () => {
    await garantirDespesasRecorrentesDoMes(fixed);
    rows.push(model({id:'internet',descricao:'Internet'}));
    await garantirDespesasRecorrentesDoMes(fixed); assert.equal(creates,2); assert.equal(queries,2);
    fail=true; await assert.rejects(()=>garantirDespesasRecorrentesDoMes(fixed),/Falha simulada/);
    fail=false; await garantirDespesasRecorrentesDoMes(fixed); assert.equal(queries,4); assert.equal(creates,2);
  });
  await test('Ocorrência paga, parcial ou cancelada não é recriada nem alterada', async () => {
    for (const status of ['pago','pendente','cancelado']) {
      const atual = occurrence({status,pagamentos:status === 'pendente' ? [{valor:200}] : []}); rows = [model(),atual];
      const original = JSON.stringify(rows); await garantirDespesasRecorrentesDoMes(fixed);
      assert.equal(creates,0); assert.equal(JSON.stringify(rows),original);
    }
  });
  await test('Modelo pago ou pendente no próprio mês já é ocorrência; não gera outra', async () => {
    rows = [model({data:new Date('2026-10-01T00:00:00Z')})]; await garantirDespesasRecorrentesDoMes(fixed); assert.equal(creates,0);
  });
  await test('Recorrência cancelada, não recorrente ou com início futuro não gera', async () => {
    for (const changes of [{status:'cancelado'},{recorrente:false},{data:new Date('2026-11-01T03:00:00Z')}]) {
      rows=[model(changes)]; await garantirDespesasRecorrentesDoMes(fixed); assert.equal(creates,0);
    }
  });
  await test('Primeiro dia UTC ainda usa competência anterior de Brasília', async () => {
    rows=[model({data:new Date('2026-08-01T00:00:00Z')})]; await garantirDespesasRecorrentesDoMes(new Date('2026-10-01T01:00:00Z'));
    assert.equal(rows[1].data.toISOString(),'2026-09-01T03:00:00.000Z');
  });
  await test('Vencimento 31 vira último dia real de fevereiro e respeita ano bissexto', async () => {
    for (const [ano,day] of [[2027,28],[2028,29]]) {
      rows=[model({data:new Date('2026-12-01T00:00:00Z'),vencimento:new Date('2026-12-31T00:00:00Z')})];
      await garantirDespesasRecorrentesDoMes(new Date(`${ano}-02-03T12:00:00Z`));
      assert.equal(rows[1].vencimento.toISOString(),`${ano}-02-${day}T03:00:00.000Z`);
    }
  });
  await test('Próximo mês cobre virada de ano usando o dia de Brasília', () => {
    assert.equal(proximoMesFinanceiro(fixed),'2026-11');
    assert.equal(proximoMesFinanceiro(new Date('2027-01-01T01:00:00Z')),'2027-01');
    assert.equal(proximoMesFinanceiro(new Date('2027-01-01T04:00:00Z')),'2027-02');
  });
  await test('Previsão não insere futuro nem muda dados; valor, categoria e vencimento vêm da recorrência', () => {
    const before=JSON.stringify(rows), predictions=preverDespesasRecorrentes(rows,'2026-11',fixed);
    assert.equal(predictions.length,1); assert.equal(predictions[0].valor,900); assert.equal(predictions[0].saldo,900);
    assert.equal(predictions[0].situacao,'previsao'); assert.equal(predictions[0].lancamentoId,null); assert.equal(predictions[0].categoriaFinanceira,'despesa_fixa');
    assert.equal(predictions[0].vencimento.toISOString(),'2026-11-05T03:00:00.000Z'); assert.equal(JSON.stringify(rows),before); assert.equal(creates,0);
  });
  await test('Ocorrência já lançada substitui previsão por origem, inclusive valor e baixa parcial', () => {
    rows.push(occurrence({id:'novembro',data:new Date('2026-11-01T00:00:00Z'),valor:1000,pagamentos:[{valor:250.10}]}));
    const predictions=preverDespesasRecorrentes(rows,'2026-11',fixed);
    assert.equal(predictions.length,1); assert.equal(predictions[0].lancamentoId,'novembro'); assert.equal(predictions[0].valor,1000); assert.equal(predictions[0].saldo,749.90); assert.equal(predictions[0].situacao,'lancada');
  });
  await test('Previsão respeita ocorrência paga sem parcelas legadas e cancelada; saldo zero', () => {
    for (const status of ['pago','cancelado']) {
      rows=[model(),occurrence({id:'novembro',data:new Date('2026-11-01T03:00:00Z'),status})];
      const [p]=preverDespesasRecorrentes(rows,'2026-11',fixed); assert.equal(p.saldo,0); assert.equal(p.situacao,status === 'pago' ? 'paga' : 'cancelada');
    }
  });
  await test('Legado tipo fixa sem categoria fica operacional, categoria explícita prevalece', () => {
    rows=[model({categoriaFinanceira:null,tipo:'fixa'}),model({id:'papel',descricao:'Papel',categoriaFinanceira:'despesa_variavel',tipo:'fixa'})];
    const p=preverDespesasRecorrentes(rows,'2026-11',fixed); assert.equal(p.find(x=>x.modeloId==='aluguel').categoriaFinanceira,'despesa_fixa'); assert.equal(p.find(x=>x.modeloId==='papel').categoriaFinanceira,'despesa_variavel');
  });
  await test('Previsão exclui recorrência cancelada, eventual e futura; não junta contas pelo nome', () => {
    rows=[model(),model({id:'outra',recorrente:false}),model({id:'cancelada',status:'cancelado'}),model({id:'futura',data:new Date('2026-12-01T03:00:00Z')}),model({id:'outro-modelo'})];
    assert.equal(preverDespesasRecorrentes(rows,'2026-11',fixed).length,2);
  });
  await test('Previsão 31 também usa último dia real, entradas inválidas não mostram contas', () => {
    rows=[model({vencimento:new Date('2026-09-30T00:00:00Z')})];
    assert.equal(preverDespesasRecorrentes(rows,'2027-02',fixed)[0].vencimento.toISOString(),'2027-02-28T03:00:00.000Z');
    assert.deepEqual(preverDespesasRecorrentes(rows,'2026-13',fixed),[]);
  });
  console.log(`RESULT ${passed} verificações sem banco real.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
