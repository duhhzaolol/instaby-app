export type VendaTrafego = {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number | null;
  valorTotal: number;
  custos: number | null;
};
export type RetornoTrafegoView = {
  mes: string;
  apuradoAte: string;
  itens: VendaTrafego[];
  observacoes: string | null;
};
const centavos = (valor: number) =>
  Math.round((valor + Number.EPSILON) * 100) / 100;
export function validarRetornoTrafego(body: any): RetornoTrafegoView {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(body?.mes || ""))
    throw new Error("Informe um mês válido.");
  if (
    typeof body.apuradoAte !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.apuradoAte) ||
    !body.apuradoAte.startsWith(body.mes) ||
    !Number.isFinite(new Date(body.apuradoAte).getTime()) ||
    new Date(body.apuradoAte).toISOString().slice(0, 10) !== body.apuradoAte
  )
    throw new Error("A data da apuração deve estar dentro do mês.");
  if (!Array.isArray(body.itens) || body.itens.length > 100)
    throw new Error("Informe até 100 tipos de venda.");
  const dinheiro = (v: any) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e10;
  const itens = body.itens.map((item: any, indice: number) => {
    if (
      !item ||
      typeof item.descricao !== "string" ||
      !item.descricao.trim() ||
      item.descricao.length > 500
    )
      throw new Error(`Descreva a venda ${indice + 1}.`);
    if (
      !Number.isSafeInteger(item.quantidade) ||
      item.quantidade <= 0 ||
      item.quantidade > 1e7
    )
      throw new Error(`Informe a quantidade da venda ${indice + 1}.`);
    if (item.valorUnitario != null && !dinheiro(item.valorUnitario))
      throw new Error("Preço unitário inválido.");
    if (item.valorUnitario == null && !dinheiro(item.valorTotal))
      throw new Error("Total de vendas inválido.");
    if (item.custos != null && !dinheiro(item.custos))
      throw new Error("Custo inválido.");
    const valorUnitario =
      item.valorUnitario == null ? null : centavos(item.valorUnitario);
    const valorTotal =
      valorUnitario == null
        ? centavos(item.valorTotal)
        : centavos(item.quantidade * valorUnitario);
    if (!dinheiro(valorTotal)) throw new Error("Total de vendas inválido.");
    return {
      id: typeof item.id === "string" ? item.id.slice(0, 100) : String(indice),
      descricao: item.descricao.trim(),
      quantidade: item.quantidade,
      valorUnitario,
      valorTotal,
      custos: item.custos == null ? null : centavos(item.custos),
    };
  });
  return {
    mes: body.mes,
    apuradoAte: body.apuradoAte,
    itens,
    observacoes:
      typeof body.observacoes === "string"
        ? body.observacoes.slice(0, 5000) || null
        : null,
  };
}
export function calcularRetornoTrafego(
  itens: VendaTrafego[],
  investimento: number,
) {
  const quantidade = itens.reduce((t, v) => t + v.quantidade, 0);
  const receita = centavos(itens.reduce((t, v) => t + v.valorTotal, 0));
  const custosInformados =
    itens.length > 0 && itens.every((v) => v.custos != null);
  const custos = custosInformados
    ? centavos(itens.reduce((t, v) => t + (v.custos || 0), 0))
    : null;
  const lucroEstimado =
    custos == null ? null : centavos(receita - custos - investimento);
  return {
    quantidade,
    receita,
    ticketMedio: quantidade ? receita / quantidade : null,
    roas: investimento > 0 ? receita / investimento : null,
    receitaMenosMidia: centavos(receita - investimento),
    custos,
    lucroEstimado,
    margemEstimada:
      lucroEstimado != null && receita > 0
        ? (lucroEstimado / receita) * 100
        : null,
  };
}
