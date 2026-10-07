import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { PDFDocument } from "pdf-lib";
import { exigirPermissaoApi } from "@/lib/permissoes";

export async function POST(request: NextRequest) {
  const { erro } = await exigirPermissaoApi("gerenciarConfiguracoes");
  if (erro) return erro;

  try {
    const form = await request.formData();
    const arquivo = form.get("arquivo");
    if (!arquivo || typeof arquivo === "string" || arquivo.size === 0) {
      return NextResponse.json({ erro: "Escolha um arquivo PNG ou JPEG para o logo." }, { status: 400 });
    }
    if (arquivo.size > 2 * 1024 * 1024) {
      return NextResponse.json({ erro: "O logo deve ter até 2 MB. Escolha uma imagem menor." }, { status: 400 });
    }
    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    const png = bytes.length >= 33 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)
      && [73, 72, 68, 82].every((byte, i) => bytes[i + 12] === byte);
    const jpeg = bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;
    if (!((arquivo.type === "image/png" && png) || (arquivo.type === "image/jpeg" && jpeg))) {
      return NextResponse.json({ erro: "Envie uma imagem PNG ou JPEG válida." }, { status: 400 });
    }
    try {
      const dimensoesValidas = (largura: number, altura: number) =>
        largura > 0 && altura > 0 && largura <= 8000 && altura <= 8000 && largura * altura <= 16_000_000;
      // Limita o PNG antes da decodificação para evitar imagens de dimensões excessivas.
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      if (png && !dimensoesValidas(view.getUint32(16), view.getUint32(20))) throw new Error();
      const documento = await PDFDocument.create();
      const imagem = png ? await documento.embedPng(bytes) : await documento.embedJpg(bytes);
      if (!dimensoesValidas(imagem.width, imagem.height)) throw new Error();
    } catch {
      return NextResponse.json({ erro: "O logo está inválido ou tem dimensões muito grandes. Exporte novamente em PNG ou JPEG (até 16 megapixels)." }, { status: 400 });
    }
    const blob = await put(`logos-agencia/${randomUUID()}.${png ? "png" : "jpg"}`, arquivo, {
      access: "public",
      addRandomSuffix: false,
      contentType: png ? "image/png" : "image/jpeg",
    });
    return NextResponse.json({ url: blob.url });
  } catch {
    return NextResponse.json({ erro: "Não foi possível enviar o logo. Tente novamente." }, { status: 500 });
  }
}
