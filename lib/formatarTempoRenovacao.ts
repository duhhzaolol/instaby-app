export function formatarTempoRenovacao(dias: number): string {
  if (dias < 0) return `vencido há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"}`;
  if (dias < 30) return `${dias} dia${dias === 1 ? "" : "s"}`;
  const meses = Math.round(dias / 30);
  return `${meses} ${meses === 1 ? "mês" : "meses"}`;
}
