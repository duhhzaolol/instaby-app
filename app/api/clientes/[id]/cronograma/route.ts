import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chaveDiaSaoPaulo } from "@/lib/dataHora";
import {
  autorizarCronogramaCliente, buscarTarefasCronograma, ErroCronograma,
  incluirPautas, lerJsonLimitado, limitesMes, novoTokenCronograma,
  responderErroCronograma, serializarComentario, serializarCronograma,
  transacaoCronograma, validarComentario, validarMes, validarPautas,
} from "@/lib/cronogramaServidor";

export const dynamic = "force-dynamic";
type Contexto = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Contexto) {
  try {
    await autorizarCronogramaCliente(params.id);
    const mes = validarMes(request.nextUrl.searchParams.get("mes"));
    const [cronograma, tarefas] = await Promise.all([
      prisma.cronogramaCliente.findUnique({ where: { clienteId_mes: { clienteId: params.id, mes } }, include: incluirPautas }),
      buscarTarefasCronograma(params.id, mes),
    ]);
    return NextResponse.json({ cronograma: serializarCronograma(cronograma), tarefas }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (erro) { return responderErroCronograma(erro); }
}

export async function PUT(request: NextRequest, { params }: Contexto) {
  try {
    await autorizarCronogramaCliente(params.id);
    const corpo = await lerJsonLimitado(request, 2_100_000);
    const mes = validarMes(corpo.mes);
    const pautas = validarPautas(corpo.pautas, mes);
    const cronograma = await transacaoCronograma(async (tx) => {
      // A tarefa precisa pertencer ao cliente e ao mês, mesmo se a requisição
      // tiver sido montada manualmente. Nenhum campo da tarefa é atualizado.
      const tarefas = await tx.tarefa.findMany({
        where: { id: { in: pautas.map((pauta) => pauta.tarefaId) }, clienteId: params.id, publicacaoSugeridaEm: limitesMes(mes) },
        select: { id: true, publicacaoSugeridaEm: true },
      });
      if (tarefas.length !== pautas.length) throw new ErroCronograma(400, "Selecione somente pautas deste cliente com postagem prevista no mês.");
      if (pautas.some((pauta) => {
        const tarefa = tarefas.find((t) => t.id === pauta.tarefaId);
        return !tarefa?.publicacaoSugeridaEm || chaveDiaSaoPaulo(tarefa.publicacaoSugeridaEm) !== pauta.dataPrevista;
      })) throw new ErroCronograma(409, "Uma data de postagem mudou na Agenda. Reabra o cronograma para conferir as datas antes de compartilhar.");
      const salvo = await tx.cronogramaCliente.upsert({
        where: { clienteId_mes: { clienteId: params.id, mes } },
        create: { clienteId: params.id, mes, token: novoTokenCronograma(), ativo: true },
        update: { ativo: true },
        select: { id: true },
      });
      // Esconder preserva os comentários e os snapshots anteriores.
      await tx.pautaCronograma.updateMany({ where: { cronogramaId: salvo.id }, data: { visivel: false } });
      for (const pauta of pautas) {
        await tx.pautaCronograma.upsert({
          where: { cronogramaId_tarefaId: { cronogramaId: salvo.id, tarefaId: pauta.tarefaId } },
          create: { cronogramaId: salvo.id, ...pauta, visivel: true },
          update: { titulo: pauta.titulo, formato: pauta.formato, dataPrevista: pauta.dataPrevista, textoCliente: pauta.textoCliente, visivel: true },
        });
      }
      return tx.cronogramaCliente.findUniqueOrThrow({ where: { id: salvo.id }, include: incluirPautas });
    });
    return NextResponse.json(serializarCronograma(cronograma));
  } catch (erro) { return responderErroCronograma(erro); }
}

export async function DELETE(request: NextRequest, { params }: Contexto) {
  try {
    await autorizarCronogramaCliente(params.id);
    const mes = validarMes(request.nextUrl.searchParams.get("mes"));
    await transacaoCronograma(async (tx) => {
      // O endereço antigo deixa de funcionar inclusive após reativar o mês.
      await tx.cronogramaCliente.updateMany({
        where: { clienteId: params.id, mes },
        data: { ativo: false, token: novoTokenCronograma() },
      });
    });
    return NextResponse.json({ desativado: true });
  } catch (erro) { return responderErroCronograma(erro); }
}

export async function POST(request: NextRequest, { params }: Contexto) {
  try {
    const usuario = await autorizarCronogramaCliente(params.id);
    const corpo = await lerJsonLimitado(request);
    const mes = validarMes(corpo.mes);
    const { texto } = validarComentario(corpo, false);
    if (typeof corpo.pautaId !== "string" || corpo.pautaId.length > 100) throw new ErroCronograma(400, "Pauta inválida.");
    const pautaId = corpo.pautaId;
    const comentario = await transacaoCronograma(async (tx) => {
      const pauta = await tx.pautaCronograma.findFirst({
        where: { id: pautaId, cronograma: { clienteId: params.id, mes } },
        select: { id: true, tarefaId: true, tarefa: { select: { clienteId: true } } },
      });
      if (!pauta || (pauta.tarefaId && pauta.tarefa?.clienteId !== params.id)) throw new ErroCronograma(404, "Pauta não encontrada.");
      return tx.comentarioPauta.create({ data: { pautaId: pauta.id, texto, autor: usuario.nome.slice(0, 80), origem: "agencia" } });
    });
    return NextResponse.json(serializarComentario(comentario), { status: 201 });
  } catch (erro) { return responderErroCronograma(erro); }
}
