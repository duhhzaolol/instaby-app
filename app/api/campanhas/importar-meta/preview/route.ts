import { NextRequest, NextResponse } from "next/server";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import { montarPrevia } from "@/lib/importacaoMeta";
import { calcularSaldoCliente } from "@/lib/trafego";

// Nunca grava nada — só mostra cliente, conta, período, campanhas encontradas,
// conflitos e impacto no saldo antes de confirmar (spec §1). A mesma lógica de
// conciliação/incremento é reprocessada de novo em /confirmar, com autoridade final.
export async function POST(request: NextRequest) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const body = await request.json();
  const clienteId: string | undefined = body.clienteId;
  const nomeArquivo: string | undefined = body.nomeArquivo;
  const conteudoBase64: string | undefined = body.conteudoBase64;
  const resolucoesManuais: Record<number, string> = body.resolucoesManuais || {};

  if (!clienteId || !nomeArquivo || !conteudoBase64) {
    return NextResponse.json({ erro: "Cliente e arquivo são obrigatórios" }, { status: 400 });
  }
  if (!(await podeVerCliente(usuario, clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const resultado = await montarPrevia(clienteId, nomeArquivo, conteudoBase64, resolucoesManuais);
  if ("erro" in resultado) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 });
  }

  const saldo = await calcularSaldoCliente(clienteId);
  const incrementoResolvidas = resultado.previa.linhas
    .filter((l) => l.resolucao !== "pendente")
    .reduce((s, l) => s + l.gastoIncremental, 0);

  return NextResponse.json({
    previa: resultado.previa,
    saldoAtual: saldo,
    saldoProjetado: saldo.temVerbaCadastrada ? saldo.saldoRestante - incrementoResolvidas : null,
  });
}
