import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const arquivo = form.get("arquivo") as File | null;

  if (!arquivo) {
    return NextResponse.json({ erro: "Nenhum arquivo enviado" }, { status: 400 });
  }

  if (arquivo.size > 5 * 1024 * 1024) {
    return NextResponse.json({ erro: "Arquivo muito grande (máximo 5MB)" }, { status: 400 });
  }

  const nomeUnico = `logos/${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;

  const blob = await put(nomeUnico, arquivo, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
