import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";

export async function GET() {
  const { erro } = await exigirPermissaoApi("verComercial");
  if (erro) return erro;

  const servicos = await prisma.servico.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });
  return NextResponse.json(servicos);
}

export async function POST(request: NextRequest) {
  const { erro } = await exigirPermissaoApi("verComercial");
  if (erro) return erro;

  const body = await request.json();

  if (!body.nome || typeof body.valorUnitario !== "number" || isNaN(body.valorUnitario)) {
    return NextResponse.json({ erro: "Nome e um valor numérico válido são obrigatórios" }, { status: 400 });
  }

  try {
    const servico = await prisma.servico.create({
      data: {
        nome: body.nome,
        descricao: body.descricao || "",
        categoria: body.categoria || "Outros",
        unidade: body.unidade || "mês",
        valorUnitario: body.valorUnitario,
        clausulaContrato: body.clausulaContrato || null,
      },
    });

    return NextResponse.json(servico, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Não deu pra criar esse serviço." }, { status: 400 });
  }
}
