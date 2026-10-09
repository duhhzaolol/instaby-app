import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { decifrarAcesso } from "@/lib/acessosClienteCrypto";
import { acessoDoCliente, autorizarAcessos, erroAcessos, exigirDesbloqueio, exigirOrigemAcessos, respostaAcessos } from "@/lib/acessosClienteApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string; acessoId: string } }) {
  try {
    const usuario = await autorizarAcessos(params.id);
    exigirOrigemAcessos(request);
    exigirDesbloqueio(request, usuario, params.id);
    const registro = await acessoDoCliente(params.id, params.acessoId);
    const conteudo = decifrarAcesso(registro.conteudoCifrado, params.id, registro.id);
    await prisma.eventoAcessoCliente.create({ data: { autorId: usuario.id, clienteId: params.id, acessoId: registro.id, acao: "revelado" } });
    return respostaAcessos({ senha: conteudo.senha });
  } catch (erro) { return erroAcessos(erro); }
}
