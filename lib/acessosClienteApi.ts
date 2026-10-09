import { NextRequest, NextResponse } from "next/server";
import type { AcessoCliente } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente, type Usuario } from "@/lib/permissoes";
import { acessosConfigurados, decifrarAcesso, expiracaoGrantAcessos, nomeCookieAcessos, type ConteudoAcessoCliente } from "@/lib/acessosClienteCrypto";

export class ErroAcessos extends Error {
  constructor(public mensagem: string, public status = 400, public retryAfter?: number) { super(mensagem); }
}

export function respostaAcessos(dados: unknown, status = 200): NextResponse {
  return NextResponse.json(dados, { status, headers: { "Cache-Control": "no-store, max-age=0", "Pragma": "no-cache", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" } });
}

export function erroAcessos(erro: unknown): NextResponse {
  const resposta = erro instanceof ErroAcessos
    ? respostaAcessos({ erro: erro.mensagem }, erro.status)
    : respostaAcessos({ erro: "Não foi possível concluir a operação. Tente novamente." }, 500);
  if (erro instanceof ErroAcessos && erro.retryAfter) resposta.headers.set("Retry-After", String(erro.retryAfter));
  return resposta;
}

export async function autorizarAcessos(clienteId: string): Promise<Usuario> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new ErroAcessos("Entre na sua conta para continuar.", 401);
  if (!usuario.master || !await podeVerCliente(usuario, clienteId)) throw new ErroAcessos("Esta área está disponível somente para o administrador principal.", 403);
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } });
  if (!cliente) throw new ErroAcessos("Cliente não encontrado.", 404);
  return usuario;
}

export function exigirOrigemAcessos(request: NextRequest): void {
  const origem = request.headers.get("origin");
  const local = request.nextUrl?.origin || new URL(request.url).origin;
  if (!origem || origem !== local || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ErroAcessos("Reabra esta página no aplicativo para continuar.", 403);
  }
}

export function estaDesbloqueado(request: NextRequest, usuario: Usuario, clienteId: string): boolean {
  return !!desbloqueadoAte(request, usuario, clienteId);
}

export function desbloqueadoAte(request: NextRequest, usuario: Usuario, clienteId: string): string | null {
  return expiracaoGrantAcessos(request.cookies.get(nomeCookieAcessos(clienteId))?.value, usuario.id, clienteId, usuario.senha);
}

export function exigirDesbloqueio(request: NextRequest, usuario: Usuario, clienteId: string): void {
  if (!acessosConfigurados()) throw new ErroAcessos("A área de acessos ainda não está configurada.", 503);
  if (!estaDesbloqueado(request, usuario, clienteId)) throw new ErroAcessos("Desbloqueie os acessos com sua senha para continuar.", 423);
}

// Limita o fluxo, inclusive em pedidos chunked sem Content-Length confiável.
export async function lerCorpoAcessos(request: NextRequest): Promise<Record<string, unknown>> {
  if ((request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json") throw new ErroAcessos("Envie os dados no formato correto.", 415);
  const tamanhoInformado = request.headers.get("content-length");
  if (tamanhoInformado && (!/^\d+$/.test(tamanhoInformado) || Number(tamanhoInformado) > 32768)) throw new ErroAcessos("Os dados excedem o tamanho permitido.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ErroAcessos("Preencha os dados para continuar.");
  const partes: Uint8Array[] = [];
  let tamanho = 0;
  try {
    while (true) {
      const parte = await reader.read();
      if (parte.done) break;
      tamanho += parte.value.byteLength;
      if (tamanho > 32768) { await reader.cancel(); throw new ErroAcessos("Os dados excedem o tamanho permitido.", 413); }
      partes.push(parte.value);
    }
    const corpo: unknown = JSON.parse(Buffer.concat(partes).toString("utf8"));
    if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) throw new ErroAcessos("Os dados enviados são inválidos.");
    return corpo as Record<string, unknown>;
  } catch (erro) {
    if (erro instanceof ErroAcessos) throw erro;
    throw new ErroAcessos("Os dados enviados são inválidos.");
  } finally { reader.releaseLock(); }
}

function texto(corpo: Record<string, unknown>, campo: string, maximo: number, padrao = "", preservarEspacos = false): string {
  const valor = corpo[campo];
  if (valor === undefined) return padrao;
  if (typeof valor !== "string" || valor.length > maximo || valor.includes("\0")) throw new ErroAcessos(`Confira o campo ${campo}.`);
  return preservarEspacos ? valor : valor.trim();
}

export function validarDadosAcesso(corpo: Record<string, unknown>, atual?: { plataforma: string; conteudo: ConteudoAcessoCliente }): { plataforma: string; conteudo: ConteudoAcessoCliente } {
  const permitidos = new Set(["plataforma", "url", "login", "senha", "responsavel", "observacoes", "removerSenha"]);
  if (Object.keys(corpo).some((k) => !permitidos.has(k))) throw new ErroAcessos("Os dados enviados são inválidos.");
  const plataforma = texto(corpo, "plataforma", 80, atual?.plataforma);
  if (!plataforma) throw new ErroAcessos("Informe a plataforma deste acesso.");
  const url = texto(corpo, "url", 2048, atual?.conteudo.url);
  if (url) {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password || /[\u0000-\u0020\u007f]/.test(url)) throw new Error();
    } catch { throw new ErroAcessos("Informe um endereço válido começando com https:// ou http://."); }
  }
  if (corpo.removerSenha !== undefined && typeof corpo.removerSenha !== "boolean") throw new ErroAcessos("Confirme a remoção da senha.");
  if (corpo.removerSenha === true && typeof corpo.senha === "string" && corpo.senha.length > 0) throw new ErroAcessos("Escolha entre atualizar ou remover a senha.");
  const novaSenha = texto(corpo, "senha", 4096, atual?.conteudo.senha, true);
  // Campo vazio numa edição conserva a senha. A remoção exige intenção separada.
  const senha = corpo.removerSenha === true ? "" : atual && corpo.senha === "" ? atual.conteudo.senha : novaSenha;
  return { plataforma, conteudo: { url, login: texto(corpo, "login", 320, atual?.conteudo.login, true), senha, responsavel: texto(corpo, "responsavel", 120, atual?.conteudo.responsavel), observacoes: texto(corpo, "observacoes", 2000, atual?.conteudo.observacoes, true) } };
}

export function resumoAcesso(registro: Pick<AcessoCliente, "id" | "plataforma" | "conteudoCifrado" | "clienteId" | "updatedAt">) {
  const conteudo = decifrarAcesso(registro.conteudoCifrado, registro.clienteId, registro.id);
  return { id: registro.id, plataforma: registro.plataforma, url: conteudo.url, login: conteudo.login, responsavel: conteudo.responsavel, observacoes: conteudo.observacoes, temSenha: conteudo.senha.length > 0, updatedAt: registro.updatedAt };
}

export async function acessoDoCliente(clienteId: string, acessoId: string) {
  const registro = await prisma.acessoCliente.findFirst({ where: { id: acessoId, clienteId } });
  if (!registro) throw new ErroAcessos("Acesso não encontrado.", 404);
  return registro;
}

const JANELA_TENTATIVAS_MS = 15 * 60 * 1000;

export type ReservaTentativaDesbloqueio = {
  usuarioId: string;
  janelaInicio: Date;
  liberada: boolean;
};

// Reserva ANTES de comparar a senha. Um acerto libera somente a sua reserva,
// sem zerar erros anteriores ou as reservas de outras requisições concorrentes.
export async function reservarTentativaDesbloqueio(usuarioId: string, agora = new Date()): Promise<ReservaTentativaDesbloqueio> {
  await prisma.controleDesbloqueioAcessos.upsert({ where: { usuarioId }, create: { usuarioId, janelaInicio: agora }, update: {} });
  for (let rodada = 0; rodada < 12; rodada += 1) {
    const estado = await prisma.controleDesbloqueioAcessos.findUnique({ where: { usuarioId } });
    if (!estado) throw new ErroAcessos("Não foi possível desbloquear agora. Tente novamente.", 503);
    const renovada = agora.getTime() - estado.janelaInicio.getTime() >= JANELA_TENTATIVAS_MS;
    if (!renovada && estado.tentativas >= 5) {
      const segundos = Math.max(1, Math.ceil((estado.janelaInicio.getTime() + JANELA_TENTATIVAS_MS - agora.getTime()) / 1000));
      throw new ErroAcessos("Limite de tentativas atingido. Aguarde 15 minutos para tentar novamente.", 429, segundos);
    }
    const atualizado = await prisma.controleDesbloqueioAcessos.updateMany({ where: { usuarioId, revisao: estado.revisao }, data: { tentativas: renovada ? 1 : estado.tentativas + 1, janelaInicio: renovada ? agora : estado.janelaInicio, revisao: { increment: 1 } } });
    if (atualizado.count === 1) return { usuarioId, janelaInicio: renovada ? agora : estado.janelaInicio, liberada: false };
  }
  throw new ErroAcessos("Muitas solicitações simultâneas. Tente novamente em instantes.", 429, 5);
}

export async function liberarTentativaDesbloqueio(reserva: ReservaTentativaDesbloqueio, agora = new Date()): Promise<void> {
  // Esta reserva só existe no servidor, dentro do pedido que comparou a senha.
  // Marque antes do await para nem uma chamada duplicada descontar duas vezes.
  if (reserva.liberada) return;
  reserva.liberada = true;
  await prisma.controleDesbloqueioAcessos.updateMany({
    where: {
      usuarioId: reserva.usuarioId,
      janelaInicio: { equals: reserva.janelaInicio, gt: new Date(agora.getTime() - JANELA_TENTATIVAS_MS) },
      tentativas: { gt: 0 },
    },
    data: { tentativas: { decrement: 1 }, revisao: { increment: 1 } },
  });
}
