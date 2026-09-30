import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe } from "@/lib/permissoes";
import { TIPOS_AUSENCIA } from "@/lib/capacidade";

// "Cadastrar disponibilidade, folgas e compromissos da equipe" (Etapa 4 v158).
// Qualquer pessoa cadastra/vê a PRÓPRIA ausência; gerenciarEquipe também
// cadastra/vê a de qualquer outra pessoa (é quem monta a escala/planejamento da
// equipe) — mesmo espírito de app/api/equipe/[id]/route.ts.
export async function GET(request: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const podeVerEquipe = permissoesDe(usuario).gerenciarEquipe;

  const usuarioIdFiltro = request.nextUrl.searchParams.get("usuarioId");
  if (usuarioIdFiltro && usuarioIdFiltro !== usuario.id && !podeVerEquipe) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const ausencias = await prisma.ausencia.findMany({
    where: usuarioIdFiltro ? { usuarioId: usuarioIdFiltro } : podeVerEquipe ? undefined : { usuarioId: usuario.id },
    orderBy: { inicio: "desc" },
    take: 300,
  });
  return NextResponse.json(ausencias);
}

export async function POST(request: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const usuarioIdAlvo = body.usuarioId || usuario.id;
  if (usuarioIdAlvo !== usuario.id && !permissoesDe(usuario).gerenciarEquipe) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const tipo = body.tipo || "folga";
  if (!TIPOS_AUSENCIA.includes(tipo)) {
    return NextResponse.json({ erro: "Tipo de ausência inválido." }, { status: 400 });
  }
  if (!body.inicio || !body.fim) {
    return NextResponse.json({ erro: "Informe o período (início e fim)." }, { status: 400 });
  }
  const inicio = new Date(body.inicio);
  const fim = new Date(body.fim);
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime()) || fim < inicio) {
    return NextResponse.json({ erro: "Período inválido." }, { status: 400 });
  }
  const diaInteiro = body.diaInteiro !== false;
  if (!diaInteiro && !(Number(body.horasPorDia) > 0)) {
    return NextResponse.json({ erro: "Informe quantas horas por dia esse compromisso parcial ocupa." }, { status: 400 });
  }

  const alvo = await prisma.usuario.findUnique({ where: { id: usuarioIdAlvo } });
  if (!alvo || !alvo.ativo) {
    return NextResponse.json({ erro: "Essa pessoa não existe ou não está mais ativa." }, { status: 400 });
  }

  const ausencia = await prisma.ausencia.create({
    data: {
      usuarioId: usuarioIdAlvo,
      tipo,
      inicio,
      fim,
      diaInteiro,
      horasPorDia: diaInteiro ? null : Number(body.horasPorDia),
      descricao: body.descricao || null,
    },
  });

  return NextResponse.json(ausencia, { status: 201 });
}
