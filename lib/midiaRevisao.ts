// Links do Drive apontam para a página do arquivo. O elemento <video> precisa
// dos bytes da mídia, com suporte a Range para pausar e procurar um instante.
export function idArquivoDrive(link: string): string | null {
  try {
    const url = new URL(link);
    if (
      ![
        "drive.google.com",
        "docs.google.com",
        "drive.usercontent.google.com",
      ].includes(url.hostname)
    )
      return null;
    const id =
      /\/file\/d\/([\w-]+)/.exec(url.pathname)?.[1] ||
      url.searchParams.get("id");
    return id && /^[\w-]{10,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function videoParaRevisao(link: string): string {
  const id = idArquivoDrive(link);
  return id
    ? `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`
    : link;
}

// Mantém cada resposta abaixo do limite da hospedagem. O navegador pede os
// próximos trechos quando precisa deles, inclusive ao buscar outro instante.
export const TAMANHO_TRECHO_VIDEO = 2 * 1024 * 1024;
export function faixaVideo(range: string | null): string | null {
  if (!range) return `bytes=0-${TAMANHO_TRECHO_VIDEO - 1}`;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!m || (!m[1] && !m[2])) return null;
  if (!m[1]) {
    const tamanho = Number(m[2]);
    return Number.isSafeInteger(tamanho) && tamanho > 0
      ? `bytes=-${Math.min(tamanho, TAMANHO_TRECHO_VIDEO)}`
      : null;
  }
  const inicio = Number(m[1]);
  const fim = m[2] ? Number(m[2]) : inicio + TAMANHO_TRECHO_VIDEO - 1;
  if (
    !Number.isSafeInteger(inicio) ||
    !Number.isSafeInteger(fim) ||
    fim < inicio
  )
    return null;
  return `bytes=${inicio}-${Math.min(fim, inicio + TAMANHO_TRECHO_VIDEO - 1)}`;
}

export function formatarTempoVideo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function segundosDoTempo(texto: string): number | null {
  const m = /^(\d{1,5}):([0-5]\d)$/.exec(texto.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function nomeClientePeloLink() {
  return "Cliente (pelo link de revisão)";
}

export function dataHoraPublicacao(valor: string | null): string {
  if (!valor || !Number.isFinite(new Date(valor).getTime())) return "";
  // Meia-noite de Brasília é a convenção usada para um dia sem horário.
  // Não sugerimos ao cliente que a postagem deve acontecer à meia-noite.
  const hora = publicacaoParaInput(valor).slice(11, 16);
  return new Date(valor).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(hora !== "00:00" && { hour: "2-digit", minute: "2-digit" }),
  });
}

// Aceita datas ISO com ou sem horário; rejeita números, datas normalizadas
// pelo JavaScript (como 31/02) e horários sem fuso. Todos os formulários novos
// enviam -03:00; a data simples mantém compatibilidade com o atalho existente.
export function dataIsoValida(valor: unknown): valor is string {
  if (typeof valor !== "string") return false;
  const partes = /^(\d{4}-\d{2}-\d{2})(?:T([0-2]\d):([0-5]\d)(?::([0-5]\d)(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))?$/.exec(valor);
  if (!partes || (partes[2] && Number(partes[2]) > 23)) return false;
  const dia = new Date(`${partes[1]}T00:00:00Z`);
  return Number.isFinite(dia.getTime()) &&
    dia.toISOString().slice(0, 10) === partes[1] &&
    Number.isFinite(new Date(valor).getTime());
}

export function dataIsoParaDate(valor: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ? `${valor}T00:00:00-03:00`
    : valor);
}

export function publicacaoParaInput(valor: string | null): string {
  if (!valor) return "";
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(valor));
  const p = (tipo: string) => partes.find((v) => v.type === tipo)?.value || "";
  return `${p("year")}-${p("month")}-${p("day")}T${p("hour")}:${p("minute")}`;
}
