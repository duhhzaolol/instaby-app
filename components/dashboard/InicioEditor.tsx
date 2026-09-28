"use client";

import { Clock, ListTodo, Film } from "lucide-react";
import { StatTile } from "@/components/ui/StatTile";
import { visualDaCategoriaTarefa } from "@/lib/categoriaTarefaVisual";
import { urgenciaPrazo } from "@/lib/urgenciaPrazo";
import { formatarDuracao } from "@/lib/formatarDuracao";
import QuadroTarefasPessoal, { type TarefaPessoal } from "@/components/dashboard/QuadroTarefasPessoal";

export type TarefaEditor = {
  id: string;
  titulo: string;
  categoria: string | null;
  prazo: string | null;
  clienteId: string | null;
  clienteNome: string | null;
  clienteCor: string | null;
};

function PrazoTexto({ prazo }: { prazo: string | null }) {
  if (!prazo) return <span>Sem prazo</span>;
  const urgencia = urgenciaPrazo(prazo);
  return (
    <span style={urgencia ? { color: urgencia.cor } : undefined}>
      {new Date(prazo).toLocaleDateString("pt-BR")}
    </span>
  );
}

// Início do Editor (redesign v144, Parte 3) — "Fazendo agora" + "Minha fila" +
// "Disponíveis" viraram um único quadro Kanban de 3 colunas (A fazer/Fazendo/
// Pronto), no mesmo estilo visual usado no resto do app — regra combinada:
// todo Kanban do sistema é sempre esse estilo. "A fazer" mistura o que ainda
// não tem dono (qualquer editor pode pegar) com o que já é dessa pessoa.
export default function InicioEditor({
  usuarioId,
  tarefasQuadro,
  proximasCaptacoes,
  horasSemana,
}: {
  usuarioId: string;
  tarefasQuadro: TarefaPessoal[];
  proximasCaptacoes: TarefaEditor[];
  horasSemana: number;
}) {
  const naFila = tarefasQuadro.filter((t) => t.status === "a_fazer" && t.responsavelId === usuarioId).length;

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile icone={<Clock size={12} className="text-accent" />} label="Horas essa semana" valor={formatarDuracao(horasSemana)} />
        <StatTile icone={<ListTodo size={12} className="text-accent" />} label="Na sua fila" valor={naFila} />
      </div>

      <div className="mb-6">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
          <ListTodo size={14} className="text-accent" /> Suas tarefas
          <span className="font-normal text-muted">— arraste um cartão ou use os botões</span>
        </p>
        <QuadroTarefasPessoal usuarioId={usuarioId} tarefas={tarefasQuadro} />
      </div>

      {proximasCaptacoes.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
            <Film size={14} className="text-accent" /> Próximas captações
          </p>
          <div className="flex flex-col gap-2">
            {proximasCaptacoes.map((t) => {
              const { icone: Icon, cor } = visualDaCategoriaTarefa(t.categoria);
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-base/40 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${cor}1A`, color: cor }}>
                    <Icon size={14} />
                  </div>
                  <p className="text-sm text-text">
                    {t.titulo}
                    {t.clienteNome && <span className="text-muted"> — {t.clienteNome}</span>}
                  </p>
                  <span className="ml-auto text-xs text-muted">
                    <PrazoTexto prazo={t.prazo} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
