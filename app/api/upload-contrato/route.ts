import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const arquivo = form.get("arquivo") as File | null;

  if (!arquivo) {
    return NextResponse.json({ erro: "Nenhum arquivo enviado" }, { status: 400 });
  }

  if (arquivo.size > 10 * 1024 * 1024) {
    return NextResponse.json({ erro: "Arquivo muito grande (máximo 10MB)" }, { status: 400 });
  }

  // Contrato pode ser PDF, imagem (foto do papel assinado) ou Word — mas nada
  // executável ou que o navegador tente rodar como página (html/svg com script).
  const TIPOS_PERMITIDOS = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!TIPOS_PERMITIDOS.includes(arquivo.type) && !arquivo.type.startsWith("image/")) {
    return NextResponse.json({ erro: "Envie um PDF, Word ou imagem" }, { status: 400 });
  }

  const nomeUnico = `contratos/${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;

  const blob = await put(nomeUnico, arquivo, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
