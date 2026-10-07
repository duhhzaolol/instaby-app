export const CAMPOS_DADOS_AGENCIA = [
  "nomeAgencia", "whatsappAgencia", "siteAgencia", "linkBioInstagram", "logoAgenciaUrl",
] as const;

export type CampoDadosAgencia = typeof CAMPOS_DADOS_AGENCIA[number];
export type ConfiguracaoDadosAgencia = Partial<Record<CampoDadosAgencia, string | null>>;

export class ErroDadosAgencia extends Error {
  constructor(public campo: CampoDadosAgencia, mensagem: string) {
    super(mensagem);
    this.name = "ErroDadosAgencia";
  }
}

function textoOpcional(valor: unknown, campo: CampoDadosAgencia, limite: number): string | null {
  if (valor === null || valor === "") return null;
  if (typeof valor !== "string") throw new ErroDadosAgencia(campo, "Preencha este campo com um texto válido.");
  const texto = valor.trim();
  if (texto.length > limite) throw new ErroDadosAgencia(campo, `Use no máximo ${limite} caracteres neste campo.`);
  return texto || null;
}

export function normalizarWhatsappAgencia(valor: unknown): string | null {
  const texto = textoOpcional(valor, "whatsappAgencia", 40);
  if (!texto) return null;
  if (!/^\+?[\d\s().-]+$/.test(texto)) {
    throw new ErroDadosAgencia("whatsappAgencia", "Informe o celular com DDD, por exemplo (19) 99999-9999.");
  }
  let numero = texto.replace(/\D/g, "");
  if (texto.startsWith("+") && (!numero.startsWith("55") || ![12, 13].includes(numero.length))) {
    throw new ErroDadosAgencia("whatsappAgencia", "Use um número brasileiro com o código +55 e o DDD.");
  }
  if (numero.length === 10 || numero.length === 11) numero = `55${numero}`;
  if (!/^55[1-9]\d[2-9]\d{7,8}$/.test(numero)) {
    throw new ErroDadosAgencia("whatsappAgencia", "Informe um número brasileiro com DDD e 10 ou 11 dígitos; o 55 é opcional.");
  }
  return numero;
}

export function normalizarSiteAgencia(valor: unknown): string | null {
  const texto = textoOpcional(valor, "siteAgencia", 2048);
  if (!texto) return null;
  try {
    if (/\s/.test(texto)) throw new Error();
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(texto) ? texto : `https://${texto}`);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || !url.hostname.includes(".")) throw new Error();
    url.protocol = "https:";
    if (url.href.length > 2048) throw new Error();
    return url.href;
  } catch {
    throw new ErroDadosAgencia("siteAgencia", "Informe um site válido, por exemplo https://suaagencia.com.br.");
  }
}

export function normalizarInstagramAgencia(valor: unknown): string | null {
  const texto = textoOpcional(valor, "linkBioInstagram", 2048);
  if (!texto) return null;
  let perfil = texto.replace(/^@/, "");
  if (texto.includes("/") || /^https?:/i.test(texto) || /^(www\.|m\.)?instagram\.com/i.test(texto)) {
    try {
      const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
      if (!["https:", "http:"].includes(url.protocol) || !["instagram.com", "www.instagram.com", "m.instagram.com"].includes(url.hostname.toLowerCase()) || url.username || url.password || url.port) throw new Error();
      const partes = url.pathname.split("/").filter(Boolean);
      if (partes.length !== 1) throw new Error();
      perfil = partes[0];
    } catch {
      throw new ErroDadosAgencia("linkBioInstagram", "Informe o @perfil ou o endereço do perfil no Instagram.");
    }
  }
  if (!/^[a-z\d_](?:[a-z\d._]{0,28}[a-z\d_])?$/i.test(perfil) || perfil.includes("..") || ["p", "reel", "reels", "stories", "explore", "accounts", "direct"].includes(perfil.toLowerCase())) {
    throw new ErroDadosAgencia("linkBioInstagram", "Informe um perfil do Instagram válido, com até 30 caracteres.");
  }
  return `https://www.instagram.com/${perfil.toLowerCase()}/`;
}

export function normalizarLogoAgencia(valor: unknown): string | null {
  const texto = textoOpcional(valor, "logoAgenciaUrl", 2048);
  if (!texto || texto === "/logo.png") return null;
  try {
    const url = new URL(texto);
    if (url.protocol !== "https:" || !/^[a-z\d-]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname) || url.username || url.password || url.port || url.search || url.hash || !/^\/logos-agencia\/[a-f\d-]{36}\.(png|jpg)$/.test(url.pathname)) throw new Error();
    return url.href;
  } catch {
    throw new ErroDadosAgencia("logoAgenciaUrl", "Escolha um arquivo PNG ou JPEG pelo botão de enviar logo.");
  }
}

export function normalizarDadosAgencia(body: Record<string, unknown>): ConfiguracaoDadosAgencia {
  const dados: ConfiguracaoDadosAgencia = {};
  if (body.nomeAgencia !== undefined) dados.nomeAgencia = textoOpcional(body.nomeAgencia, "nomeAgencia", 120);
  if (body.whatsappAgencia !== undefined) dados.whatsappAgencia = normalizarWhatsappAgencia(body.whatsappAgencia);
  if (body.siteAgencia !== undefined) dados.siteAgencia = normalizarSiteAgencia(body.siteAgencia);
  if (body.linkBioInstagram !== undefined) dados.linkBioInstagram = normalizarInstagramAgencia(body.linkBioInstagram);
  if (body.logoAgenciaUrl !== undefined) dados.logoAgenciaUrl = normalizarLogoAgencia(body.logoAgenciaUrl);
  return dados;
}

/** Dados públicos reutilizáveis em propostas, PDFs e páginas da agência. */
export function obterDadosAgencia(config?: ConfiguracaoDadosAgencia | null) {
  function normalizado(normalizar: (valor: unknown) => string | null, valor: unknown) {
    try { return normalizar(valor) || ""; } catch { return ""; }
  }
  return {
    nome: config?.nomeAgencia?.trim() || "Instaby",
    site: normalizado(normalizarSiteAgencia, config?.siteAgencia ?? null),
    instagram: normalizado(normalizarInstagramAgencia, config?.linkBioInstagram ?? null),
    whatsapp: normalizado(normalizarWhatsappAgencia, config?.whatsappAgencia ?? null),
    logoUrl: normalizado(normalizarLogoAgencia, config?.logoAgenciaUrl ?? null) || "/logo.png",
  };
}
