import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { acessosConfigurados, criarGrantAcessos, DURACAO_DESBLOQUEIO_SEGUNDOS, expiracaoGrantAcessos, nomeCookieAcessos } from "@/lib/acessosClienteCrypto";
import { autorizarAcessos, ErroAcessos, erroAcessos, exigirOrigemAcessos, lerCorpoAcessos, liberarTentativaDesbloqueio, reservarTentativaDesbloqueio, respostaAcessos, type ReservaTentativaDesbloqueio } from "@/lib/acessosClienteApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const opcoesCookie = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/api/clientes" };

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const usuario = await autorizarAcessos(params.id);
    exigirOrigemAcessos(request);
    if (!acessosConfigurados()) throw new ErroAcessos("A área de acessos ainda não está configurada.", 503);
    const corpo = await lerCorpoAcessos(request);
    if (Object.keys(corpo).some((k) => k !== "senhaAtual") || typeof corpo.senhaAtual !== "string" || !corpo.senhaAtual || corpo.senhaAtual.length > 4096 || corpo.senhaAtual.includes("\0")) {
      throw new ErroAcessos("Informe sua senha atual para desbloquear.");
    }
    let reserva: ReservaTentativaDesbloqueio;
    try { reserva = await reservarTentativaDesbloqueio(usuario.id); }
    catch (erro) {
      if (erro instanceof ErroAcessos && erro.status === 429) await prisma.eventoAcessoCliente.create({ data: { autorId: usuario.id, clienteId: params.id, acao: "limite_tentativas" } });
      throw erro;
    }
    const senhaValida = await bcrypt.compare(corpo.senhaAtual, usuario.senha);
    if (!senhaValida) {
      await prisma.eventoAcessoCliente.create({ data: { autorId: usuario.id, clienteId: params.id, acao: "senha_incorreta" } });
      throw new ErroAcessos("Senha incorreta. Confira sua senha atual.", 401);
    }
    // Uma conta desativada/rebaixada ou com senha alterada enquanto o bcrypt
    // rodava não recebe um desbloqueio novo.
    const atual = await autorizarAcessos(params.id);
    if (atual.id !== usuario.id || atual.senha !== usuario.senha) throw new ErroAcessos("Sua conta foi alterada. Entre novamente para continuar.", 401);
    await liberarTentativaDesbloqueio(reserva);
    await prisma.eventoAcessoCliente.create({ data: { autorId: usuario.id, clienteId: params.id, acao: "desbloqueado" } });
    const token = criarGrantAcessos(usuario.id, params.id, usuario.senha);
    const resposta = respostaAcessos({ desbloqueado: true, desbloqueadoAte: expiracaoGrantAcessos(token, usuario.id, params.id, usuario.senha) });
    resposta.cookies.set(nomeCookieAcessos(params.id), token, { ...opcoesCookie, maxAge: DURACAO_DESBLOQUEIO_SEGUNDOS });
    return resposta;
  } catch (erro) { return erroAcessos(erro); }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const usuario = await autorizarAcessos(params.id);
    exigirOrigemAcessos(request);
    const resposta = respostaAcessos({ desbloqueado: false, desbloqueadoAte: null });
    resposta.cookies.set(nomeCookieAcessos(params.id), "", { ...opcoesCookie, maxAge: 0, expires: new Date(0) });
    // Uma falha na trilha nunca deve impedir o navegador de fechar o cofre.
    try { await prisma.eventoAcessoCliente.create({ data: { autorId: usuario.id, clienteId: params.id, acao: "bloqueado" } }); } catch { /* O cookie continua sendo removido. */ }
    return resposta;
  } catch (erro) { return erroAcessos(erro); }
}
