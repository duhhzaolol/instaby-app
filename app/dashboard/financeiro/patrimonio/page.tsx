import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import PatrimonioClient from "@/components/dashboard/PatrimonioClient";

export default async function PatrimonioPage() {
  const bens = await prisma.patrimonio.findMany({
    orderBy: { data: "desc" },
    include: { despesaOrigem: { select: { descricao: true } } },
  });

  const dados = bens.map((b) => ({
    id: b.id,
    nome: b.nome,
    categoria: b.categoria,
    valorAquisicao: Number(b.valorAquisicao),
    valorAtual: Number(b.valorAtual),
    data: b.data.toISOString(),
    status: b.status,
    origem: b.despesaOrigem?.descricao || null,
  }));

  const totalAtual = dados.filter((b) => b.status === "em_uso").reduce((s, b) => s + b.valorAtual, 0);
  const totalAquisicao = dados.reduce((s, b) => s + b.valorAquisicao, 0);

  return (
    <div>
      <Link href="/dashboard/financeiro" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Financeiro
      </Link>

      <div className="mb-6">
        <p className="flex items-center gap-1.5 text-lg font-medium text-text">
          Patrimônio
          <AjudaContextual
            titulo="Patrimônio"
            texto="Bens e equipamentos da empresa — câmeras, computadores, móveis etc. Um item nasce aqui automaticamente quando você marca 'Adicionar ao patrimônio' ao lançar uma despesa como Investimento/Ativo, ou você pode cadastrar um item manualmente. Não afeta a DRE nem o Fluxo de Caixa — é só um controle de ativos."
            exemplo="Ex.: comprou uma câmera de R$ 7.000 — ela vira um item aqui, e você pode atualizar o valor estimado com o tempo (depreciação) ou marcar como vendida."
          />
        </p>
        <p className="text-xs text-muted">Bens e equipamentos da empresa, com valor de aquisição e valor atual estimado.</p>
      </div>

      <PatrimonioClient bens={dados} totalAtual={totalAtual} totalAquisicao={totalAquisicao} />
    </div>
  );
}
