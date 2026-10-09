type ClassificacaoDespesa = { categoriaFinanceira?: string | null; tipo?: string | null };

/** A classificação escolhida prevalece sobre o campo antigo de tipo. */
export function categoriaFinanceiraDaDespesa(despesa: ClassificacaoDespesa): string {
  return despesa.categoriaFinanceira || (despesa.tipo === "fixa" ? "despesa_fixa" : "despesa_variavel");
}

export function tipoDaDespesa(despesa: ClassificacaoDespesa): "fixa" | "flexivel" {
  return categoriaFinanceiraDaDespesa(despesa) === "despesa_fixa" ? "fixa" : "flexivel";
}

export function despesaDaOperacao(despesa: ClassificacaoDespesa): boolean {
  return ["custo", "despesa_fixa", "despesa_variavel", "despesa_financeira", "imposto"].includes(categoriaFinanceiraDaDespesa(despesa));
}
