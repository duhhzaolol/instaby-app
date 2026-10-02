// O caixa acompanha as baixas reais. Status e competência da obrigação não
// substituem a data em que cada parcela entrou ou saiu.
type DataFinanceira = Date | string | null | undefined;
type ValorFinanceiro = number | string | { toString(): string };
type ClienteMovimento = { nome: string; cor?: string | null } | null;
type ParcelaFinanceira = { id?: string; valor: ValorFinanceiro; data: DataFinanceira };
export type CobrancaFinanceira = {
  id: string; valor: ValorFinanceiro; status: string; createdAt: DataFinanceira;
  dataRecebimento?: DataFinanceira; categoria?: string | null;
  clienteId?: string | null; cliente?: ClienteMovimento; pagamentos?: ParcelaFinanceira[];
};
export type DespesaFinanceira = {
  id: string; valor: ValorFinanceiro; status: string; data: DataFinanceira;
  dataPagamento?: DataFinanceira; descricao: string; categoriaFinanceira?: string | null;
  tipo?: string; clienteId?: string | null; cliente?: ClienteMovimento; pagamentos?: ParcelaFinanceira[];
};
export type MovimentoFinanceiro = {
  id: string; origemId: string; data: Date; valor: number; tipo: 'entrada' | 'saida';
  clienteId?: string | null; clienteNome?: string | null; clienteCor?: string | null;
  descricao: string; categoriaFinanceira?: string | null; tipoDespesa?: string;
};
function dataReal(valor: DataFinanceira): Date | null {
  if (!valor) return null;
  // Strings sem horário são dias escolhidos no formulário, em Brasília.
  const data = typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)
    ? new Date(`${valor}T00:00:00-03:00`) : new Date(valor);
  return Number.isFinite(data.getTime()) ? data : null;
}
function dataCivilLegada(valor: DataFinanceira): Date | null {
  const data = dataReal(valor);
  if (!data) return null;
  return data.toISOString().endsWith('T00:00:00.000Z')
    ? new Date(`${data.toISOString().slice(0, 10)}T00:00:00-03:00`) : data;
}
function movimentos(item: CobrancaFinanceira | DespesaFinanceira, tipo: MovimentoFinanceiro['tipo']): MovimentoFinanceiro[] {
  const cobranca = tipo === 'entrada' ? item as CobrancaFinanceira : null;
  const despesa = tipo === 'saida' ? item as DespesaFinanceira : null;
  const base = {
    origemId: item.id, tipo, clienteId: item.clienteId,
    clienteNome: item.cliente?.nome || null, clienteCor: item.cliente?.cor || null,
    descricao: cobranca?.categoria || despesa?.descricao || 'Recebimento',
    ...(despesa && { categoriaFinanceira: despesa.categoriaFinanceira, tipoDespesa: despesa.tipo }),
  };
  if (item.pagamentos?.length) {
    // Cancelar a obrigação não estorna uma baixa real anterior.
    return item.pagamentos.flatMap((p, index) => {
      const data = dataReal(p.data), valor = Number(p.valor);
      return data && Number.isFinite(valor) && valor > 0
        ? [{ ...base, id: `${tipo}:${item.id}:${p.id || index}`, data, valor }] : [];
    });
  }
  // Legado pago sem parcelas: nunca soma valor integral junto com parcelas.
  if (item.status !== 'pago') return [];
  const data = cobranca
    ? (cobranca.dataRecebimento ? dataCivilLegada(cobranca.dataRecebimento) : dataReal(cobranca.createdAt))
    : dataCivilLegada(despesa!.dataPagamento || despesa!.data);
  const valor = Number(item.valor);
  return data && Number.isFinite(valor) && valor > 0 ? [{ ...base, id: `${tipo}:${item.id}:legado`, data, valor }] : [];
}
export function movimentosDeCobranca(item: CobrancaFinanceira) { return movimentos(item, 'entrada'); }
export function movimentosDeDespesa(item: DespesaFinanceira) { return movimentos(item, 'saida'); }
export function movimentosFinanceiros(cobrancas: CobrancaFinanceira[], despesas: DespesaFinanceira[]) {
  return [...cobrancas.flatMap(movimentosDeCobranca), ...despesas.flatMap(movimentosDeDespesa)]
    .sort((a, b) => a.data.getTime() - b.data.getTime());
}
export function saldoEmPeriodo(movimentos: MovimentoFinanceiro[], desde: Date, ate: Date) {
  let saldoInicial = 0, totalEntradas = 0, totalSaidas = 0;
  for (const m of movimentos) {
    if (m.data < desde) saldoInicial += m.tipo === 'entrada' ? Math.round(m.valor * 100) : -Math.round(m.valor * 100);
    else if (m.data <= ate) {
      if (m.tipo === 'entrada') totalEntradas += Math.round(m.valor * 100); else totalSaidas += Math.round(m.valor * 100);
    }
  }
  return { saldoInicial: saldoInicial / 100, totalEntradas: totalEntradas / 100, totalSaidas: totalSaidas / 100, saldoFinal: (saldoInicial + totalEntradas - totalSaidas) / 100 };
}
