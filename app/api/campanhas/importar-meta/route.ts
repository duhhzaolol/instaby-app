import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";

type LinhaImportada = {
  nome: string;
  status: string;
  inicio: string;
  fim: string;
  resultados: number | null;
  indicadorResultado: string | null;
  valorGasto: number;
  impressoes: number | null;
  alcance: number | null;
};

export async function POST(request: NextRequest) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const body = await request.json();
  const clienteId: string | undefined = body.clienteId;
  const linhas: LinhaImportada[] = Array.isArray(body.linhas) ? body.linhas : [];

  if (!clienteId) {
    return NextResponse.json({ erro: "Selecione o cliente desse arquivo" }, { status: 400 });
  }
  if (!(await podeVerCliente(usuario, clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }
  if (linhas.length === 0) {
    return NextResponse.json({ erro: "Nenhuma linha reconhecida nesse arquivo" }, { status: 400 });
  }

  const campanhasExistentes = await prisma.campanha.findMany({
    where: { clienteId },
    select: { id: true, nome: true },
  });
  const porNome = new Map(campanhasExistentes.map((c) => [c.nome.trim().toLowerCase(), c.id]));

  let campanhasCriadas = 0;
  let resultadosImportados = 0;

  for (const linha of linhas) {
    const chave = linha.nome.trim().toLowerCase();
    let campanhaId = porNome.get(chave);

    if (!campanhaId) {
      const nova = await prisma.campanha.create({
        data: {
          clienteId,
          nome: linha.nome,
          plataforma: "meta_ads",
          status: linha.status === "ativa" ? "ativa" : "pausada",
          dataInicio: new Date(linha.inicio),
          observacoes: "Criada automaticamente por importação do Meta Ads.",
        },
      });
      campanhaId = nova.id;
      porNome.set(chave, campanhaId);
      campanhasCriadas++;
    }

    await prisma.resultadoCampanha.upsert({
      where: {
        campanhaId_inicio_fim: {
          campanhaId,
          inicio: new Date(linha.inicio),
          fim: new Date(linha.fim),
        },
      },
      update: {
        verbaInvestida: linha.valorGasto,
        impressoes: linha.impressoes,
        alcance: linha.alcance,
        resultados: linha.resultados,
        indicadorResultado: linha.indicadorResultado,
        origem: "meta_import",
      },
      create: {
        campanhaId,
        inicio: new Date(linha.inicio),
        fim: new Date(linha.fim),
        verbaInvestida: linha.valorGasto,
        impressoes: linha.impressoes,
        alcance: linha.alcance,
        resultados: linha.resultados,
        indicadorResultado: linha.indicadorResultado,
        origem: "meta_import",
      },
    });
    resultadosImportados++;
  }

  return NextResponse.json({ campanhasCriadas, resultadosImportados });
}
