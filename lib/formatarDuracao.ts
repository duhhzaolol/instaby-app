export function formatarDuracao(horasDecimais: number): string {
  const totalMinutos = Math.round(horasDecimais * 60);
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}
