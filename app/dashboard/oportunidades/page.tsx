import { Handshake, Target, Trophy, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { PipelineOportunidades, OportunidadeData } from "@/components/dashboard/PipelineOportunidades";
import { NovaOportunidadeForm } from "@/components/dashboard/NovaOportunidadeForm";

export default async function OportunidadesPage() {
  const oportunidades = await prisma.oportunidade.findMany({ orderBy: { createdAt: "desc" } });

  const abertas = oportunidades.filter((o) => o.status !== "ganho" && o.status !== "perdido");
  const ganhas = oportunidades.filter((o) => o.status === "ganho");
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
      <div className="mb-6">
        <p className="text-lg font-medium text-text">Oportunidades</p>
        <p className="text-sm text-muted">
          Pipeline comercial — {abertas.length} em aberto
          {valorEmAberto > 0 && `, R$ ${valorEmAberto.toFixed(0)} estimados`}
        </p>
      </div>

      {oportunidades.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <StatTile
            icone={<Target size={12} style={{ color: "#3B82F6" }} />}
            label="Em aberto"
            valor={abertas.length}
            index={0}
          />
          <StatTile
            icone={<Wallet size={12} style={{ color: "#E63946" }} />}
            label="Valor estimado em aberto"
            valor={`R$ ${valorEmAberto.toLocaleString("pt-BR")}`}
            index={1}
          />
          <StatTile
            icone={<Trophy size={12} style={{ color: "#22C55E" }} />}
            label="Ganhas"
            valor={ganhas.length}
            index={2}
          />
        </div>
      )}

      <NovaOportunidadeForm />

      {oportunidades.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Nenhuma oportunidade cadastrada ainda"
          description="Use 'Nova oportunidade' acima pra começar a organizar seu funil de vendas."
        />
      ) : (
        <PipelineOportunidades oportunidades={dados} />
      )}
    </div>
  );
}
