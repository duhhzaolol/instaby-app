import { NextRequest, NextResponse } from "next/server";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import { computarSnapshotRelatorio } from "@/lib/trafego";

// Só calcula e devolve — nunca grava uma versão (isso é papel só da rota principal,
// POST /api/relatorios-trafego). Existe pra tela de Relatórios deixar escolher
// cliente, período e campanhas e ver o resultado quantas vezes quiser antes de decidir
// gerar (e assim preservar) uma versão de verdade — gerar toda hora que alguém troca
// um filtro criaria versões descartáveis, o oposto do que "preservar versões" pede.
export async function POST(request: NextRequest) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const body = await request.json();
  const { clienteId, periodoInicio, periodoFim, campanhaIds } = body;
  if (!clienteId || !periodoInicio || !periodoFim || !Array.isArray(campanhaIds) || campanhaIds.length === 0) {
    return NextResponse.json({ erro: "Cliente, período e ao menos uma campanha são obrigatórios" }, { status: 400 });
  }
  if (!(await podeVerCliente(usuario, clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const resultado = await computarSnapshotRelatorio(clienteId, campanhaIds, new Date(periodoInicio), new Date(periodoFim));
  return NextResponse.json(resultado);
}
