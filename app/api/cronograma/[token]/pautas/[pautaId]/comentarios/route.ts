import { NextRequest, NextResponse } from "next/server";
import {
  ErroCronograma, lerJsonLimitado, responderErroCronograma, serializarComentario,
  tokenCronogramaValido, transacaoCronograma, validarComentario,
} from "@/lib/cronogramaServidor";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { token: string; pautaId: string } }) {
  try {
    if (!tokenCronogramaValido(params.token) || params.pautaId.length > 100) throw new ErroCronograma(404, "Cronograma indisponível.");
    const { autor, texto } = validarComentario(await lerJsonLimitado(request));
    const comentario = await transacaoCronograma(async (tx) => {
      const pauta = await tx.pautaCronograma.findFirst({
        where: { id: params.pautaId, visivel: true, cronograma: { token: params.token, ativo: true } },
        select: { id: true, tarefaId: true, tarefa: { select: { clienteId: true } }, cronograma: { select: { clienteId: true } } },
      });
      if (!pauta || (pauta.tarefaId && pauta.tarefa?.clienteId !== pauta.cronograma.clienteId)) throw new ErroCronograma(404, "Pauta indisponível neste cronograma.");
      const recentes = await tx.comentarioPauta.count({ where: { pautaId: pauta.id, origem: "cliente", createdAt: { gte: new Date(Date.now() - 60_000) } } });
      if (recentes >= 20) throw new ErroCronograma(429, "Aguarde um minuto antes de enviar outro comentário.");
      return tx.comentarioPauta.create({ data: { pautaId: pauta.id, autor: autor!, texto, origem: "cliente" } });
    });
    return NextResponse.json(serializarComentario(comentario), { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (erro) { return responderErroCronograma(erro); }
}
