import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const DURACAO_DESBLOQUEIO_SEGUNDOS = 10 * 60;

export class ChaveAcessosIndisponivel extends Error {
  constructor() { super("A área de acessos ainda não está configurada."); }
}

export type ConteudoAcessoCliente = {
  url: string;
  login: string;
  senha: string;
  responsavel: string;
  observacoes: string;
};

// Chave própria, exatamente 32 bytes em base64. Não reutilizar a chave da sessão.
export function chaveAcessos(): Buffer {
  const valor = process.env.ACESSOS_ENCRYPTION_KEY;
  if (!valor || !/^[A-Za-z0-9+/]{43}=$/.test(valor)) throw new ChaveAcessosIndisponivel();
  const chave = Buffer.from(valor, "base64");
  if (chave.length !== 32 || chave.toString("base64") !== valor) throw new ChaveAcessosIndisponivel();
  return chave;
}

export function acessosConfigurados(): boolean {
  try { chaveAcessos(); return true; } catch { return false; }
}

function aad(clienteId: string, acessoId: string): Buffer {
  return Buffer.from(JSON.stringify(["instaby/acessos/v1", clienteId, acessoId]), "utf8");
}

export function cifrarAcesso(conteudo: ConteudoAcessoCliente, clienteId: string, acessoId: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chaveAcessos(), nonce);
  cipher.setAAD(aad(clienteId, acessoId));
  const dados = Buffer.concat([cipher.update(JSON.stringify(conteudo), "utf8"), cipher.final()]);
  return ["v1", nonce.toString("base64url"), cipher.getAuthTag().toString("base64url"), dados.toString("base64url")].join(".");
}

export function decifrarAcesso(valor: string, clienteId: string, acessoId: string): ConteudoAcessoCliente {
  const partes = valor.split(".");
  if (partes.length !== 4 || partes[0] !== "v1" || partes.some((p) => !/^[A-Za-z0-9_-]+$/.test(p)) || valor.length > 50000) {
    throw new Error("Conteúdo de acesso inválido.");
  }
  const nonce = Buffer.from(partes[1], "base64url");
  const tag = Buffer.from(partes[2], "base64url");
  if (nonce.length !== 12 || tag.length !== 16) throw new Error("Conteúdo de acesso inválido.");
  const cipher = createDecipheriv("aes-256-gcm", chaveAcessos(), nonce);
  cipher.setAAD(aad(clienteId, acessoId));
  cipher.setAuthTag(tag);
  const conteudo: unknown = JSON.parse(Buffer.concat([cipher.update(Buffer.from(partes[3], "base64url")), cipher.final()]).toString("utf8"));
  if (!conteudo || typeof conteudo !== "object" || Array.isArray(conteudo)) throw new Error("Conteúdo de acesso inválido.");
  const registro = conteudo as Record<string, unknown>;
  if (["url", "login", "senha", "responsavel", "observacoes"].some((campo) => typeof registro[campo] !== "string")) {
    throw new Error("Conteúdo de acesso inválido.");
  }
  return { url: registro.url as string, login: registro.login as string, senha: registro.senha as string, responsavel: registro.responsavel as string, observacoes: registro.observacoes as string };
}

function chaveGrant(): Buffer {
  return createHmac("sha256", chaveAcessos()).update("instaby/acessos/grant/v1").digest();
}

function assinaturaGrant(valor: string): Buffer {
  return createHmac("sha256", chaveGrant()).update(valor).digest();
}

function vinculoSenha(senhaConta: string): string {
  return createHmac("sha256", chaveGrant()).update(senhaConta).digest("base64url");
}

export function nomeCookieAcessos(clienteId: string): string {
  return `instaby-acessos-${createHash("sha256").update(clienteId).digest("hex").slice(0, 20)}`;
}

export function criarGrantAcessos(usuarioId: string, clienteId: string, senhaConta: string, agora = Date.now()): string {
  const inicio = Math.floor(agora / 1000);
  const valor = Buffer.from(JSON.stringify({ v: 1, u: usuarioId, c: clienteId, a: vinculoSenha(senhaConta), iat: inicio, exp: inicio + DURACAO_DESBLOQUEIO_SEGUNDOS }), "utf8").toString("base64url");
  return `${valor}.${assinaturaGrant(valor).toString("base64url")}`;
}

export function validarGrantAcessos(token: string | undefined, usuarioId: string, clienteId: string, senhaConta: string, agora = Date.now()): boolean {
  if (!token || token.length > 2048) return false;
  try {
    const partes = token.split(".");
    if (partes.length !== 2 || partes.some((p) => !/^[A-Za-z0-9_-]+$/.test(p))) return false;
    const assinatura = Buffer.from(partes[1], "base64url");
    const esperada = assinaturaGrant(partes[0]);
    if (assinatura.length !== esperada.length || !timingSafeEqual(assinatura, esperada)) return false;
    const conteudo = JSON.parse(Buffer.from(partes[0], "base64url").toString("utf8"));
    const momento = Math.floor(agora / 1000);
    return conteudo.v === 1 && conteudo.u === usuarioId && conteudo.c === clienteId && conteudo.a === vinculoSenha(senhaConta)
      && Number.isSafeInteger(conteudo.iat) && Number.isSafeInteger(conteudo.exp)
      && conteudo.iat <= momento && conteudo.exp > momento && conteudo.exp - conteudo.iat === DURACAO_DESBLOQUEIO_SEGUNDOS;
  } catch { return false; }
}

export function expiracaoGrantAcessos(token: string | undefined, usuarioId: string, clienteId: string, senhaConta: string, agora = Date.now()): string | null {
  if (!validarGrantAcessos(token, usuarioId, clienteId, senhaConta, agora)) return null;
  const conteudo = JSON.parse(Buffer.from(token!.split(".")[0], "base64url").toString("utf8"));
  return new Date(conteudo.exp * 1000).toISOString();
}
