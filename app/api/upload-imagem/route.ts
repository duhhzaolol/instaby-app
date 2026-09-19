import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Upload genérico de imagem (site público, portfólio, link na bio...) — diferente do
// /api/upload-logo, esse aqui não tenta remover fundo (não faz sentido pra fotografia).
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const arquivo = form.get("arquivo") as File | null;
  const pasta = (form.get("pasta") as string | null) || "site";

  if (!arquivo) {
    return NextResponse.json({ erro: "Nenhum arquivo enviado" }, { status: 400 });
  }

  if (arquivo.size > 8 * 1024 * 1024) {
    return NextResponse.json({ erro: "Arquivo muito grande (máximo 8MB)" }, { status: 400 });
  }

  // Só aceita imagem de verdade — sem isso, alguém logado poderia subir um
  // arquivo disfarçado (ex: um .html ou .svg com script embutido) e depois
  // linkar essa URL pra outras pessoas abrirem.
  if (!arquivo.type.startsWith("image/")) {
    return NextResponse.json({ erro: "Envie apenas arquivos de imagem" }, { status: 400 });
  }

  const pastaLimpa = pasta.replace(/[^a-zA-Z0-9-]/g, "") || "site";
  const nomeUnico = `${pastaLimpa}/${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;

  const blob = await put(nomeUnico, arquivo, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
