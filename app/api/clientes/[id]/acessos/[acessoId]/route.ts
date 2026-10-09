import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { cifrarAcesso, decifrarAcesso } from "@/lib/acessosClienteCrypto";
import { acessoDoCliente, autorizarAcessos, ErroAcessos, erroAcessos, exigirDesbloqueio, exigirOrigemAcessos, lerCorpoAcessos, respostaAcessos, resumoAcesso, validarDadosAcesso } from "@/lib/acessosClienteApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Contexto = { params: { id: string; acessoId: string } };

export async function PATCH(request: NextRequest, { params }: Contexto) {
  try {
    const usuario = await autorizarAcessos(params.id);
    exigirOrigemAcessos(request);
    exigirDesbloqueio(request, usuario, params.id);
    const anterior = await acessoDoCliente(params.id, params.acessoId);
    const dados = validarDadosAcesso(await lerCorpoAcessos(request), { plataforma: anterior.plataforma, conteudo: decifrarAcesso(anterior.conteudoCifrado, params.id, anterior.id) });
    const conteudoCifrado = cifrarAcesso(dados.conteudo, params.id, anterior.id);
    const registro = await prisma.$transaction(async (tx) => {
      // Compare o estado lido: uma edição paralela não pode apagar a senha nova
      // de outra pessoa ao preservar a senha que viu antes.
      const atualizado = await tx.acessoCliente.updateMany({ where: { id: anterior.id, clienteId: params.id, conteudoCifrado: anterior.conteudoCifrado, plataforma: anterior.plataforma }, data: { plataforma: dados.plataforma, conteudoCifrado } });
      if (atualizado.count !== 1) throw new ErroAcessos("Este acesso foi alterado. Atualize a lista antes de editar novamente.", 409);
      const salvo = await tx.acessoCliente.findFirst({ where: { id: anterior.id, clienteId: params.id } });
      if (!salvo) throw new ErroAcessos("Acesso não encontrado.", 404);
      await tx.eventoAcessoCliente.create({ data: { autorId: usuario.id, clienteId: params.id, acessoId: anterior.id, acao: "editado" } });
      return salvo;
    });
    return respostaAcessos({ acesso: resumoAcesso(registro) });
  } catch (erro) { return erroAcessos(erro); }
}

export async function DELETE(request: NextRequest, { params }: Contexto) {
  try {
    const usuario = await autorizarAcessos(params.id);
    exigirOrigemAcessos(request);
    exigirDesbloqueio(request, usuario, params.id);
    await prisma.$transaction(async (tx) => {
      const excluido = await tx.acessoCliente.deleteMany({ where: { id: params.acessoId, clienteId: params.id } });
      if (excluido.count !== 1) throw new ErroAcessos("Acesso não encontrado.", 404);
      await tx.eventoAcessoCliente.create({ data: { autorId: usuario.id, clienteId: params.id, acessoId: params.acessoId, acao: "excluido" } });
    });
    return respostaAcessos({ ok: true });
  } catch (erro) { return erroAcessos(erro); }
}
