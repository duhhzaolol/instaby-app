// Datas de relatório representam dias do calendário, salvos à meia-noite UTC.
// Aplicar o fuso local a elas faria 01/09 aparecer como 31/08.
export function formatarDataRelatorio(data: string | Date, opcoes?: Intl.DateTimeFormatOptions) {
  return new Date(data).toLocaleDateString("pt-BR", { ...opcoes, timeZone: "UTC" });
}
