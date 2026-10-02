import { diaFinanceiro } from "@/lib/datasFinanceiro";

export type StatusFinanceiroEfetivo = "pendente" | "parcial" | "pago" | "atrasado" | "cancelado";

export function calcularStatusEfetivo({
  status,
  valor,
  totalPago,
  vencimento,
}: {
  status: string; // status salvo (pendente | pago | cancelado — "atrasado" salvo manualmente de versões antigas também é respeitado)
  valor: number;
  totalPago: number;
  vencimento: Date | null;
}, hoje = new Date()): StatusFinanceiroEfetivo {
  if (status === "cancelado") return "cancelado";
  if (status === "pago" && totalPago <= 0) return "pago"; // marcado como pago sem baixa parcial lançada (jeito antigo)

  const saldo = Math.max(0, valor - totalPago);
  if (saldo <= 0) return "pago";

  const diaVencimento = vencimento ? diaFinanceiro(vencimento) : "";
  const vencido = !!diaVencimento && diaVencimento < diaFinanceiro(hoje, false);
  if (vencido) return "atrasado";
  if (totalPago > 0) return "parcial";
  return "pendente";
}

export const LABEL_STATUS_EFETIVO: Record<StatusFinanceiroEfetivo, string> = {
  pendente: "Pendente",
  parcial: "Parcial",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export const COR_STATUS_EFETIVO: Record<StatusFinanceiroEfetivo, string> = {
  pendente: "#9CA3AF",
  parcial: "#3B82F6",
  pago: "#22C55E",
  atrasado: "#EF4444",
  cancelado: "#6B7280",
};
