export const FUSO_HORARIO = "America/Sao_Paulo";

const dataCompleta = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_HORARIO,
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_HORARIO,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const horario = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_HORARIO,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
const dataCalendario = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_HORARIO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function chaveDiaSaoPaulo(data: Date) {
  const partes = dataCalendario.formatToParts(data);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)!.value;
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

export function formatarDataHoraSaoPaulo(data: Date) {
  return {
    dataCompleta: dataCompleta.format(data),
    dataCurta: dataCurta.format(data),
    horario: horario.format(data),
  };
}
