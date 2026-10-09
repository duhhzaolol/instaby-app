const fs = require('node:fs');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const repo = path.resolve(__dirname, '..');
const ts = require(path.join(repo, 'node_modules/typescript'));
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(repo, request.slice(2)) : request, parent, ...args);
};
require.extensions['.ts'] = function (module, filename) {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  module._compile(output, filename);
};
const { calcularDre, somarDre } = require(path.join(repo, 'components/dashboard/dre/calculoDre.ts'));
const d = (date) => new Date(`${date}T00:00:00-03:00`);
const pg = (valor, data) => ({ valor, data: d(data) });
const cobrancas = [
  { id: 'sky', valor: 1000, status: 'pago', dataCompetencia: d('2026-10-01'), createdAt: d('2026-09-30'), pagamentos: [pg(300, '2026-10-09'), pg(700, '2026-10-25')] },
  { id: 'toral', valor: 500, status: 'pendente', vencimento: d('2026-10-25'), createdAt: d('2026-09-30'), pagamentos: [] },
  { id: 'recebido-mes-anterior', valor: 200, status: 'pago', dataCompetencia: d('2026-09-01'), createdAt: d('2026-09-01'), pagamentos: [pg(200, '2026-10-02')] },
  { id: 'cancelada-com-baixa', valor: 400, status: 'cancelado', dataCompetencia: d('2026-10-01'), createdAt: d('2026-10-01'), pagamentos: [pg(50, '2026-10-05')] },
  { id: 'legada', valor: 75, status: 'pago', createdAt: d('2026-10-01'), dataRecebimento: new Date('2026-10-09T00:00:00Z'), pagamentos: [] },
  { id: 'instante-noturno', valor: 100, status: 'pago', createdAt: d('2026-10-01'), pagamentos: [{ valor: 100, data: new Date('2026-10-10T00:00:00Z') }] },
];
const despesas = [
  { id: 'aluguel', descricao: 'Aluguel', valor: 1200, tipo: 'flexivel', categoriaFinanceira: 'despesa_fixa', categoria: 'Escritório', status: 'pago', data: d('2026-10-01'), pagamentos: [pg(600, '2026-10-08'), pg(600, '2026-11-02')] },
  { id: 'internet', descricao: 'Internet', valor: 100, tipo: 'fixa', categoriaFinanceira: null, status: 'pendente', data: d('2026-10-10'), pagamentos: [] },
  { id: 'papel', descricao: 'Papel', valor: 50, tipo: 'flexivel', categoriaFinanceira: null, status: 'pago', data: d('2026-10-09'), pagamentos: [] },
  { id: 'camera', descricao: 'Câmera', valor: 300, tipo: 'flexivel', categoriaFinanceira: 'investimento', status: 'pago', data: d('2026-09-10'), pagamentos: [pg(300, '2026-10-03')] },
  { id: 'transferencia', descricao: 'Retirada', valor: 100, tipo: 'flexivel', categoriaFinanceira: 'transferencia', status: 'cancelado', data: d('2026-10-06'), pagamentos: [pg(30, '2026-10-06')] },
];
const durante = calcularDre({ cobrancas, despesas, desde: d('2026-10-01'), ateCaixa: new Date('2026-10-10T02:59:59.999Z'), ateCompetencia: new Date('2026-11-01T02:59:59.999Z'), agora: new Date('2026-10-10T02:00:00Z') });
assert.equal(durante.caixa.recebido, 725);
assert.equal(durante.caixa.pago, 980);
assert.equal(durante.caixa.variacao, -255);
assert.equal(durante.competencia.receitaBruta, 1675);
assert.equal(durante.competencia.receitaEmAberto, 1200);
assert.equal(durante.competencia.despesaEmAberto, 700);
assert.equal(durante.competencia.despesasFixas, 1300);
assert.equal(durante.competencia.despesasVariaveis, 50);
assert.equal(durante.competencia.lucroLiquido, 325);
assert.equal(durante.competencia.transferencias, 0);
assert.equal(durante.caixa.pagamentosPorCategoria.find(p => p.categoria === 'transferencia').valor, 30);
const fechado = calcularDre({ cobrancas, despesas, desde: d('2026-10-01'), ateCaixa: new Date('2026-11-01T02:59:59.999Z'), ateCompetencia: new Date('2026-11-01T02:59:59.999Z'), agora: d('2026-11-03') });
assert.equal(fechado.caixa.recebido, 1425);
assert.equal(fechado.caixa.pago, 980);
assert.equal(fechado.competencia.receitaEmAberto, 500);
assert.equal(fechado.competencia.despesaEmAberto, 700);
assert.equal(fechado.competencia.lucroLiquido, 325);
const setembro = calcularDre({ cobrancas, despesas, desde: d('2026-09-01'), ateCaixa: new Date('2026-10-01T02:59:59.999Z'), ateCompetencia: new Date('2026-10-01T02:59:59.999Z'), agora: d('2026-11-03') });
assert.equal(setembro.caixa.recebido, 0);
assert.equal(setembro.caixa.pago, 0);
assert.equal(setembro.competencia.receitaBruta, 200);
assert.equal(setembro.competencia.receitaEmAberto, 200);
assert.equal(setembro.competencia.investimentos, 300);
assert.equal(setembro.competencia.lucroLiquido, 200);
assert.equal(somarDre([0.1, 0.2, -0.3]), 0);
console.log('DRE: parciais, meses distintos, vencimentos futuros, baixas canceladas, datas BRT, categorias legadas e centavos passaram.');

const { tipoDaDespesa, categoriaFinanceiraDaDespesa } = require(path.join(repo, 'lib/classificacaoDespesa.ts'));
const { resumirCustosFinanceiros } = require(path.join(repo, 'lib/resumoCustosFinanceiros.ts'));
const { preverDespesasRecorrentes, proximoMesFinanceiro } = require(path.join(repo, 'lib/previsaoDespesasRecorrentes.ts'));
assert.equal(tipoDaDespesa({ tipo: 'flexivel', categoriaFinanceira: 'despesa_fixa' }), 'fixa');
assert.equal(tipoDaDespesa({ tipo: 'fixa', categoriaFinanceira: 'despesa_variavel' }), 'flexivel');
assert.equal(categoriaFinanceiraDaDespesa({ tipo: 'fixa', categoriaFinanceira: null }), 'despesa_fixa');
const outubro = { desde: d('2026-10-01'), ate: new Date('2026-11-01T02:59:59.999Z') };
const custos = resumirCustosFinanceiros(despesas, outubro.desde, outubro.ate, new Date('2026-10-10T02:00:00Z'));
assert.deepEqual(custos.operacionais.itens.map(item => item.id), ['aluguel', 'internet']);
assert.equal(custos.operacionais.total, 1300);
assert.equal(custos.operacionais.pago, 600);
assert.equal(custos.operacionais.emAberto, 700);
assert.equal(custos.flexiveis.total, 50);
assert.equal(custos.flexiveis.pago, 50);
assert.equal(custos.flexiveis.emAberto, 0);
const custosFechados = resumirCustosFinanceiros(despesas, outubro.desde, outubro.ate, d('2026-11-03'));
assert.equal(custosFechados.operacionais.pago, 1200);
assert.equal(custosFechados.operacionais.emAberto, 100);
assert.equal(resumirCustosFinanceiros([], outubro.desde, outubro.ate).operacionais.total, 0);
const modelo = { id: 'modelo', descricao: 'Aluguel', valor: 900, data: d('2026-09-01'), vencimento: d('2026-09-30'), status: 'pago', recorrente: true, origemRecorrenteId: null, tipo: 'flexivel', categoriaFinanceira: 'despesa_fixa', pagamentos: [] };
const previsao = preverDespesasRecorrentes([modelo], '2027-02');
assert.equal(previsao.length, 1);
assert.equal(previsao[0].saldo, 900);
assert.equal(previsao[0].vencimento.toISOString(), '2027-02-28T03:00:00.000Z');
assert.equal(previsao[0].situacao, 'previsao');
assert.equal(previsao[0].categoriaFinanceira, 'despesa_fixa');
assert.equal(proximoMesFinanceiro(new Date('2026-12-31T23:00:00-03:00')), '2027-01');
const existente = { ...modelo, id: 'novembro', recorrente: false, origemRecorrenteId: 'modelo', data: d('2026-11-01'), vencimento: d('2026-11-30'), status: 'pendente', pagamentos: [pg(250, '2026-11-02')] };
assert.equal(preverDespesasRecorrentes([modelo, existente], '2026-11')[0].saldo, 650);
assert.equal(preverDespesasRecorrentes([modelo, { ...existente, status: 'pago' }], '2026-11')[0].saldo, 650);
assert.equal(preverDespesasRecorrentes([modelo, { ...existente, status: 'pago', pagamentos: [pg(900, '2026-11-02')] }], '2026-11')[0].saldo, 0);
assert.equal(preverDespesasRecorrentes([modelo, { ...existente, status: 'cancelado' }], '2026-11')[0].situacao, 'cancelada');
assert.equal(preverDespesasRecorrentes([{ ...modelo, status: 'cancelado' }], '2026-11').length, 0);
console.log('Resumo e previsão: classificação legada, fim do mês, pagamentos parciais, cancelamentos, ativos, virada de ano e fevereiro passaram.');
