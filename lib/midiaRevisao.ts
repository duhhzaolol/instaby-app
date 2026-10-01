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
  return valor
    ? new Date(valor).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
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
