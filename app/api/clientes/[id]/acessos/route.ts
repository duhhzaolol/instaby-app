import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { acessosConfigurados, cifrarAcesso } from "@/lib/acessosClienteCrypto";
import { autorizarAcessos, desbloqueadoAte, erroAcessos, exigirDesbloqueio, exigirOrigemAcessos, lerCorpoAcessos, respostaAcessos, resumoAcesso, validarDadosAcesso } from "@/lib/acessosClienteApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const usuario = await autorizarAcessos(params.id);
    const configurado = acessosConfigurados();
    const expiracao = configurado ? desbloqueadoAte(request, usuario, params.id) : null;
    if (!expiracao) return respostaAcessos({ acessos: [], desbloqueado: false, desbloqueadoAte: null, configurado });
    const registros = await prisma.acessoCliente.findMany({ where: { clienteId: params.id }, orderBy: [{ plataforma: "asc" }, { id: "asc" }] });
    return respostaAcessos({ acessos: registros.map(resumoAcesso), desbloqueado: true, desbloqueadoAte: expiracao, configurado: true });
  } catch (erro) { return erroAcessos(erro); }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const usuario = await autorizarAcessos(params.id);
    exigirOrigemAcessos(request);
    exigirDesbloqueio(request, usuario, params.id);
    const dados = validarDadosAcesso(await lerCorpoAcessos(request));
    const id = randomUUID();
    const cifrado = cifrarAcesso(dados.conteudo, params.id, id);
    const registro = await prisma.$transaction(async (tx) => {
      const criado = await tx.acessoCliente.create({ data: { id, clienteId: params.id, plataforma: dados.plataforma, conteudoCifrado: cifrado } });
      await tx.eventoAcessoCliente.create({ data: { autorId: usuario.id, clienteId: params.id, acessoId: id, acao: "criado" } });
      return criado;
    });
    return respostaAcessos({ acesso: resumoAcesso(registro) }, 201);
  } catch (erro) { return erroAcessos(erro); }
}
