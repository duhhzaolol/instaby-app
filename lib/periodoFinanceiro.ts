export function faixaPeriodo(
  periodo: string,
  personalizado?: { desde?: string; ate?: string }
) {
  const hoje = new Date();
  const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  if (periodo === "mes_anterior") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59);
    return { desde: inicio, ate: fim, meses: 1 };
  }
  if (periodo === "3m") {
    return { desde: new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1), ate: hoje, meses: 3 };
  }
  if (periodo === "6m") {
    return { desde: new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1), ate: hoje, meses: 6 };
  }
  if (periodo === "ano_atual") {
    return { desde: new Date(hoje.getFullYear(), 0, 1), ate: hoje, meses: hoje.getMonth() + 1 };
  }
  if (periodo === "ano_anterior") {
    const inicio = new Date(hoje.getFullYear() - 1, 0, 1);
    const fim = new Date(hoje.getFullYear() - 1, 11, 31, 23, 59, 59);
    return { desde: inicio, ate: fim, meses: 12 };
  }
  if (periodo === "personalizado" && personalizado?.desde && personalizado?.ate) {
    const desde = new Date(personalizado.desde + "T00:00:00");
    const ate = new Date(personalizado.ate + "T23:59:59");
    const meses = Math.max(
      1,
      (ate.getFullYear() - desde.getFullYear()) * 12 + (ate.getMonth() - desde.getMonth()) + 1
    );
    return { desde, ate, meses };
  }
  return { desde: inicioMesAtual, ate: hoje, meses: 1 };
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
