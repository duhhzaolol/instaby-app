import { dataIsoValida, dataIsoParaDate } from "@/lib/midiaRevisao";

export function dataFinanceiraValida(valor: unknown): boolean {
  return valor == null || valor === "" || dataIsoValida(valor);
}

export function dataFinanceira(valor: unknown): Date | null {
  if (valor instanceof Date) return Number.isFinite(valor.getTime()) ? valor : null;
  return dataIsoValida(valor) ? dataIsoParaDate(valor) : null;
}

export function diaFinanceiro(valor: Date | string, legado = true): string {
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const data = valor instanceof Date ? valor : new Date(valor);
  if (!Number.isFinite(data.getTime())) return "";
  // Datas civis antigas eram gravadas à meia-noite UTC. Mantemos esse dia em
  // vencimento/competência; instantes reais usam legado=false e o fuso de Brasília.
  if (legado && data.toISOString().endsWith("T00:00:00.000Z")) return data.toISOString().slice(0, 10);
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(data);
  const p = (tipo: string) => partes.find(v => v.type === tipo)?.value || "";
  return `${p("year")}-${p("month")}-${p("day")}`;
}

export function inicioDiaFinanceiro(valor: Date | string): Date {
  return new Date(`${diaFinanceiro(valor)}T00:00:00-03:00`);
}

export function hojeFinanceiro(): Date {
  return new Date(`${diaFinanceiro(new Date(), false)}T00:00:00-03:00`);
}

export function mesFinanceiro(valor: Date | string): string {
  return diaFinanceiro(valor).slice(0, 7);
}

export function limitesMesFinanceiro(mes: string): { inicio: Date; fim: Date } {
  const [ano, numeroMes] = mes.split("-").map(Number);
  const proximo = new Date(Date.UTC(ano, numeroMes, 1)).toISOString().slice(0, 10);
  return { inicio: new Date(`${mes}-01T00:00:00-03:00`), fim: new Date(`${proximo}T00:00:00-03:00`) };
}

export function formatarDataFinanceira(valor: Date | string | null | undefined): string {
  if (!valor) return "";
  const dia = diaFinanceiro(valor);
  return dia ? dia.split("-").reverse().join("/") : "";
}

export function centavosFinanceiros(valor: unknown, positivo = false): number | null {
  if (typeof valor !== "number" && typeof valor !== "string") return null;
  if (typeof valor === "string" && !/^\d+(?:\.\d{1,2})?$/.test(valor.trim())) return null;
  const numero = Number(valor);
  const centavos = Math.round(numero * 100);
  return Number.isFinite(numero) && numero >= 0 && (!positivo || numero > 0) &&
    Number.isSafeInteger(centavos) && Math.abs(numero * 100 - centavos) < 0.000001
    ? centavos : null;
}

export const STATUS_FINANCEIROS = ["pendente", "pago", "atrasado", "cancelado"];
