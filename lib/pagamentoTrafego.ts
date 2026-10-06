export const FORMAS_PAGAMENTO_TRAFEGO = [
  { value: "cartao_credito", label: "Cartão de crédito" },
  { value: "pix", label: "Pix" },
  { value: "boleto", label: "Boleto" },
] as const;

export type FormaPagamentoTrafego = (typeof FORMAS_PAGAMENTO_TRAFEGO)[number]["value"];

export function formaPagamentoTrafegoValida(valor: unknown): valor is FormaPagamentoTrafego {
  return FORMAS_PAGAMENTO_TRAFEGO.some((forma) => forma.value === valor);
}

export function labelFormaPagamentoTrafego(valor: string | null | undefined) {
  return FORMAS_PAGAMENTO_TRAFEGO.find((forma) => forma.value === valor)?.label || "Não informada";
}

// A configuração não registra pagamentos. Cartão acompanha cobrança direta;
// Pix/boleto usam o controle de créditos antecipados. Null preserva o controle legado.
export function controlaSaldoTrafego(forma: string | null | undefined) {
  return forma !== "cartao_credito";
}
