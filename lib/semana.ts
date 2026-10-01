// Cálculo de semana compartilhado entre o navegador e o servidor.
export function inicioDaSemana(data: Date): Date {
  const d = new Date(data);
  const dia = d.getDay(); // 0 = domingo
  const diff = dia === 0 ? -6 : 1 - dia; // volta pra segunda-feira
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
