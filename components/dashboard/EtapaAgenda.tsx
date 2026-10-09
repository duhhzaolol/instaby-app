import type { EventoAgenda } from "@/components/dashboard/AgendaGrid";

export function EtapaAgenda({
  etapa,
  compacto = false,
}: {
  etapa?: EventoAgenda["etapa"];
  compacto?: boolean;
}) {
  if (!etapa) return null;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 font-medium ${compacto ? "text-[9px]" : "text-[11px]"}`}
      style={{ backgroundColor: `${etapa.cor}1A`, color: etapa.cor }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: etapa.cor }}
      />
      <span className="break-words">{etapa.label}</span>
    </span>
  );
}

export function rotuloDataAgenda(tipo?: EventoAgenda["tipoData"]) {
  if (tipo === "postagem") return "Postagem planejada";
  if (tipo === "publicado") return "Publicado";
  return "Prazo de produção";
}

export function horarioEventoAgenda(e: EventoAgenda) {
  if (e.horaInicio)
    return e.horaFim ? `${e.horaInicio} – ${e.horaFim}` : e.horaInicio;
  return e.hora === "00:00" ? null : e.hora || null;
}

export function dataHoraAgenda(valor?: string | null, preservarDiaCivil = true): string | null {
  if (!valor) return null;
  const data = new Date(valor);
  if (!Number.isFinite(data.getTime())) return null;
  const iso = data.toISOString();
  if (preservarDiaCivil && iso.endsWith("T00:00:00.000Z")) {
    return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
  }
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data);
  const parte = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value || "";
  const dia = `${parte("day")}/${parte("month")}/${parte("year")}`;
  const hora = `${parte("hour")}:${parte("minute")}`;
  return hora === "00:00" ? dia : `${dia} às ${hora}`;
}
