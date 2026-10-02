import { dataFinanceiraValida, diaFinanceiro, inicioDiaFinanceiro } from "@/lib/datasFinanceiro";

const diaBR = (dia: string) => new Date(`${dia}T00:00:00-03:00`);
const antesDoDia = (dia: string) => new Date(diaBR(dia).getTime() - 1);
const mesRelativo = (ano: number, mesZero: number) => new Date(Date.UTC(ano, mesZero, 1)).toISOString().slice(0, 10);

export function faixaPeriodo(
  periodo: string,
  personalizado?: { desde?: string; ate?: string },
  hoje = new Date(),
) {
  const diaHoje = diaFinanceiro(hoje, false);
  const [ano, mes, dia] = diaHoje.split("-").map(Number);
  const amanha = new Date(Date.UTC(ano, mes - 1, dia + 1)).toISOString().slice(0, 10);
  const ateHoje = antesDoDia(amanha);
  const inicioMesAtual = diaBR(mesRelativo(ano, mes - 1));
  if (periodo === "mes_anterior") return { desde: diaBR(mesRelativo(ano, mes - 2)), ate: antesDoDia(mesRelativo(ano, mes - 1)), meses: 1 };
  if (periodo === "3m") return { desde: diaBR(mesRelativo(ano, mes - 3)), ate: ateHoje, meses: 3 };
  if (periodo === "6m") return { desde: diaBR(mesRelativo(ano, mes - 6)), ate: ateHoje, meses: 6 };
  if (periodo === "ano_atual") return { desde: diaBR(`${ano}-01-01`), ate: ateHoje, meses: mes };
  if (periodo === "ano_anterior") return { desde: diaBR(`${ano - 1}-01-01`), ate: antesDoDia(`${ano}-01-01`), meses: 12 };
  if (periodo === "personalizado" && personalizado?.desde && personalizado?.ate) {
    const { desde: de, ate: fim } = personalizado;
    if (/^\d{4}-\d{2}-\d{2}$/.test(de) && /^\d{4}-\d{2}-\d{2}$/.test(fim) && dataFinanceiraValida(de) && dataFinanceiraValida(fim) && de <= fim) {
      const [a, m, d] = fim.split("-").map(Number);
      const depois = new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
      const [aDe, mDe] = de.split("-").map(Number);
      return { desde: diaBR(de), ate: antesDoDia(depois), meses: Math.max(1, (a - aDe) * 12 + m - mDe + 1) };
    }
  }
  // Uma faixa inválida volta ao mês atual em vez de esconder tudo ou lançar erro.
  return { desde: inicioMesAtual, ate: ateHoje, meses: 1 };
}
export const PERIODOS_FINANCEIRO = [
  { valor: "mes_atual", label: "Este mês" },
  { valor: "mes_anterior", label: "Mês anterior" },
  { valor: "3m", label: "Últimos 3 meses" },
  { valor: "6m", label: "Últimos 6 meses" },
  { valor: "ano_atual", label: "Este ano" },
  { valor: "ano_anterior", label: "Ano anterior" },
  { valor: "personalizado", label: "Personalizado" },
];

// A mesma fonte de competência é usada nas listas, DRE e resultado do mês.
// Isso organiza a apresentação; não altera a data salva nem a data de pagamento.
export function dataCompetenciaDaCobranca(c: {
  dataCompetencia?: Date | string | null;
  vencimento?: Date | string | null;
  createdAt: Date | string;
}): Date {
  if (c.dataCompetencia) return inicioDiaFinanceiro(c.dataCompetencia);
  if (c.vencimento) return inicioDiaFinanceiro(c.vencimento);
  return new Date(c.createdAt);
}
