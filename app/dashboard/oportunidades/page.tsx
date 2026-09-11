import { prisma } from "@/lib/prisma";
import { PipelineOportunidades, OportunidadeData } from "@/components/dashboard/PipelineOportunidades";
import { NovaOportunidadeForm } from "@/components/dashboard/NovaOportunidadeForm";

export default async function OportunidadesPage() {
  const oportunidades = await prisma.oportunidade.findMany({ orderBy: { createdAt: "desc" } });

  const abertas = oportunidades.filter((o) => o.status !== "ganho" && o.status !== "perdido");
  const valorEmAberto = abertas.reduce((s, o) => s + (o.valorEstimado ? Number(o.valorEstimado) : 0), 0);

  const dados: OportunidadeData[] = oportunidades.map((o) => ({
    id: o.id,
    nome: o.nome,
    contatoNome: o.contatoNome,
    contatoWhatsapp: o.contatoWhatsapp,
    origem: o.origem,
    interesse: o.interesse,
    valorEstimado: o.valorEstimado ? Number(o.valorEstimado) : null,
    status: o.status,
    proximaAcao: o.proximaAcao,
    dataProximaAcao: o.dataProximaAcao?.toISOString() || null,
    observacoes: o.observacoes,
    motivoPerda: o.motivoPerda,
    clienteId: o.clienteId,
  }));

  return (
    <div>
      <p className="mb-1 text-lg font-medium text-text">Oportunidades</p>
      <p className="mb-4 text-sm text-muted">
        Pipeline comercial — {abertas.length} em aberto
        {valorEmAberto > 0 && `, R$ ${valorEmAberto.toFixed(0)} estimados`}
      </p>

      <NovaOportunidadeForm />

      {oportunidades.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma oportunidade cadastrada ainda.</p>
      ) : (
        <PipelineOportunidades oportunidades={dados} />
      )}
    </div>
  );
}
