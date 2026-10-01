import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import { validarRetornoTrafego } from "@/lib/retornoTrafego";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;
  if (!(await podeVerCliente(usuario, params.id)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  const mes = request.nextUrl.searchParams.get("mes") || "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes))
    return NextResponse.json({ erro: "Mês inválido" }, { status: 400 });
  const retorno = await prisma.retornoMensalTrafego.findUnique({
    where: { clienteId_mes: { clienteId: params.id, mes } },
  });
  return NextResponse.json(
    retorno
      ? {
          mes,
          apuradoAte: retorno.apuradoAte.toISOString().slice(0, 10),
          itens: retorno.itens,
          observacoes: retorno.observacoes,
        }
      : null,
  );
}
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;
  if (!(await podeVerCliente(usuario, params.id)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  let dados;
  try {
    dados = validarRetornoTrafego(await request.json());
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Dados inválidos" },
      { status: 400 },
    );
  }
  const data = {
    apuradoAte: new Date(dados.apuradoAte),
    itens: dados.itens,
    observacoes: dados.observacoes,
    atualizadoPorId: usuario.id,
  };
  await prisma.retornoMensalTrafego.upsert({
    where: { clienteId_mes: { clienteId: params.id, mes: dados.mes } },
    update: data,
    create: { clienteId: params.id, mes: dados.mes, ...data },
  });
  return NextResponse.json(dados);
}
