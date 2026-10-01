import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS_COM_REVISAO } from "@/lib/categoriaTarefaVisual";
import {
  faixaVideo,
  idArquivoDrive,
  TAMANHO_TRECHO_VIDEO,
  videoParaRevisao,
} from "@/lib/midiaRevisao";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// O mesmo link público da revisão dá acesso somente ao arquivo daquela versão.
// Nenhum endereço remoto é recebido na requisição e nenhum token vai ao cliente.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versaoId: string } },
) {
  const versao = await prisma.versaoConteudo.findUnique({
    where: { id: params.versaoId },
    include: { tarefa: { select: { clienteId: true, categoria: true } } },
  });
  if (
    !versao ||
    versao.tarefaId !== params.id ||
    !versao.tarefa.clienteId ||
    !CATEGORIAS_COM_REVISAO.includes(versao.tarefa.categoria as any) ||
    !versao.linkVideo ||
    !idArquivoDrive(versao.linkVideo)
  ) {
    return NextResponse.json(
      { erro: "Vídeo não encontrado." },
      { status: 404 },
    );
  }
  const range = faixaVideo(request.headers.get("range"));
  if (!range) return new NextResponse(null, { status: 416 });

  try {
    // Não repassa cookies, credenciais ou Referer do navegador ao Drive.
    const origem = await fetch(videoParaRevisao(versao.linkVideo), {
      headers: { Range: range },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const tipo = origem.headers.get("content-type") || "";
    const faixa = origem.headers.get("content-range") || "";
    const m = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(faixa);
    if (origem.status === 416) {
      await origem.body?.cancel();
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": faixa },
      });
    }
    if (
      origem.status !== 206 ||
      !m ||
      !/^(video\/|application\/octet-stream)/i.test(tipo) ||
      Number(m[2]) - Number(m[1]) + 1 > TAMANHO_TRECHO_VIDEO
    ) {
      await origem.body?.cancel();
      return NextResponse.json(
        {
          erro: "Não foi possível reproduzir este arquivo pelo link do Drive.",
        },
        { status: 502 },
      );
    }
    const reader = origem.body?.getReader();
    if (!reader) throw new Error("Sem mídia");
    const partes: Uint8Array[] = [];
    let tamanho = 0;
    while (true) {
      const parte = await reader.read();
      if (parte.done) break;
      tamanho += parte.value.byteLength;
      if (tamanho > TAMANHO_TRECHO_VIDEO) {
        await reader.cancel();
        throw new Error("Trecho maior que o permitido");
      }
      partes.push(parte.value);
    }
    if (tamanho !== Number(m[2]) - Number(m[1]) + 1)
      throw new Error("Trecho incompleto");
    return new NextResponse(Buffer.concat(partes), {
      status: 206,
      headers: {
        "Content-Type": tipo,
        "Content-Range": faixa,
        "Content-Length": String(tamanho),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { erro: "Não foi possível carregar o vídeo. Tente novamente." },
      { status: 502 },
    );
  }
}
