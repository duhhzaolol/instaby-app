import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";

const TIPOS_VALIDOS = ["aporte", "devolucao", "ajuste"];

// Registra um aporte, devolução ou ajuste — nunca editado/apagado
// depois (é o extrato). "valor" é sempre a magnitude positiva; o tipo decide se soma
// ou subtrai do saldo (ver calcularSaldoCliente em lib/trafego.ts).
// Transportes antigos permanecem no histórico; o saldo atual já continua entre meses.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;
  if (!(await podeVerCliente(usuario, params.id))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  if (body.tipo === "saldo_transportado") {
    return NextResponse.json({ erro: "O saldo já continua entre os meses. Registre apenas um novo crédito confirmado ou ajuste o saldo inicial." }, { status: 400 });
  }
  if (!TIPOS_VALIDOS.includes(body.tipo)) {
    return NextResponse.json({ erro: "Tipo de movimentação inválido" }, { status: 400 });
  }
  const valor = Number(body.valor);
  if (!valor || isNaN(valor) || valor <= 0) {
    return NextResponse.json({ erro: "Informe um valor maior que zero" }, { status: 400 });
  }

  // Cria o registro de verba desse cliente na primeira movimentação, se ainda não
  // existir — "a verba disponibilizada precisa ser cadastrada separadamente" (spec),
  // mas não exige uma etapa a mais só pra abrir o controle.
  const verba = await prisma.verbaTrafego.upsert({
    where: { clienteId: params.id },
    update: {},
    create: { clienteId: params.id, saldoInicial: 0 },
  });

  const movimentacao = await prisma.movimentacaoVerba.create({
    data: {
      verbaId: verba.id,
      tipo: body.tipo,
      valor,
      descricao: body.descricao || null,
      dataMovimento: body.dataMovimento ? new Date(body.dataMovimento) : new Date(),
      criadoPorId: usuario.id,
    },
  });

  return NextResponse.json(movimentacao, { status: 201 });
}
