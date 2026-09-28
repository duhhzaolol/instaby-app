"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListTodo, Clock, Film, Inbox, Play, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { visualDaCategoriaTarefa } from "@/lib/categoriaTarefaVisual";
import { urgenciaPrazo } from "@/lib/urgenciaPrazo";
import { formatarDuracao } from "@/lib/formatarDuracao";
import { ChecklistTarefa, type ChecklistItemData } from "@/components/dashboard/ChecklistTarefa";

export type TarefaEditor = {
  id: string;
  titulo: string;
  categoria: string | null;
  prazo: string | null;
  clienteId: string | null;
  clienteNome: string | null;
  clienteCor: string | null;
  checklist?: ChecklistItemData[];
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

// Cartão do "Fazendo agora" — com checklist e o botão de concluir. Marcar como
// feito aqui é só o status (sem o fluxo de registrar horas, que já existe no
// cronômetro/Horas) — mantém esse cartão simples de bater o olho.
function CartaoFazendoAgora({ tarefa }: { tarefa: TarefaEditor }) {
  const router = useRouter();
  const [concluindo, setConcluindo] = useState(false);
  const { icone: Icon, cor } = visualDaCategoriaTarefa(tarefa.categoria);

  async function marcarFeito() {
    setConcluindo(true);
    const res = await fetch(`/api/tarefas/${tarefa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "feito" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.erro || "Não consegui marcar como feito.");
      setConcluindo(false);
      return;
    }
    router.refresh();
  }

  return (
    <Card hoverable={false} className="p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${cor}1A`, color: cor }}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text">{tarefa.titulo}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            {tarefa.clienteNome && <span>{tarefa.clienteNome}</span>}
            <PrazoTexto prazo={tarefa.prazo} />
          </p>
        </div>
        <button
          onClick={marcarFeito}
          disabled={concluindo}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
        >
          <CheckCircle2 size={13} /> {concluindo ? "Salvando..." : "Marcar como feito"}
        </button>
      </div>
      <div className="border-t border-border pt-3">
        <ChecklistTarefa tarefaId={tarefa.id} itens={tarefa.checklist || []} />
      </div>
    </Card>
  );
}

function LinhaFila({ tarefa, acao }: { tarefa: TarefaEditor; acao: { label: string; onClick: () => void; carregando: boolean } }) {
  const { icone: Icon, cor } = visualDaCategoriaTarefa(tarefa.categoria);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-base/40 px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${cor}1A`, color: cor }}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-text">{tarefa.titulo}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          {tarefa.clienteNome && <span>{tarefa.clienteNome}</span>}
          <PrazoTexto prazo={tarefa.prazo} />
        </p>
      </div>
      <button
        onClick={acao.onClick}
        disabled={acao.carregando}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:border-accent/40 hover:text-text disabled:opacity-40"
      >
        {acao.label === "Iniciar" && <Play size={11} />}
        {acao.carregando ? "..." : acao.label}
      </button>
    </div>
  );
}

function SecaoFila({
  titulo,
  icone: Icon,
  tarefas,
  rotuloAcao,
  onAcao,
  vazio,
}: {
  titulo: string;
  icone: any;
  tarefas: TarefaEditor[];
  rotuloAcao: string;
  onAcao: (id: string) => Promise<void>;
  vazio: string;
}) {
  const [emAcao, setEmAcao] = useState<string | null>(null);

  async function executar(id: string) {
    setEmAcao(id);
    await onAcao(id);
    setEmAcao(null);
  }

  return (
    <div className="mb-6">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
        <Icon size={14} className="text-accent" /> {titulo}
      </p>
      {tarefas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 py-6 text-center text-xs text-muted">{vazio}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tarefas.map((t) => (
            <LinhaFila
              key={t.id}
              tarefa={t}
              acao={{ label: rotuloAcao, onClick: () => executar(t.id), carregando: emAcao === t.id }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function InicioEditor({
  usuarioId,
  fazendoAgora,
  minhaFila,
  disponiveis,
  proximasCaptacoes,
  horasSemana,
}: {
  usuarioId: string;
  fazendoAgora: TarefaEditor[];
  minhaFila: TarefaEditor[];
  disponiveis: TarefaEditor[];
  proximasCaptacoes: TarefaEditor[];
  horasSemana: number;
}) {
  const router = useRouter();

  async function iniciar(tarefa: TarefaEditor) {
    await fetch("/api/registros-tempo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId: tarefa.clienteId || null,
        atividade: tarefa.titulo,
        inicio: new Date().toISOString(),
      }),
    });
    await fetch(`/api/tarefas/${tarefa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "em_andamento" }),
    });
    router.refresh();
  }

  async function pegarParaMim(id: string) {
    const res = await fetch(`/api/tarefas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responsavelId: usuarioId }),
    });
    if (!res.ok) {
      alert("Não consegui pegar essa tarefa.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile icone={<Clock size={12} className="text-accent" />} label="Horas essa semana" valor={formatarDuracao(horasSemana)} />
        <StatTile icone={<ListTodo size={12} className="text-accent" />} label="Na sua fila" valor={minhaFila.length} />
      </div>

      <div className="mb-6">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
          <Play size={14} className="text-accent" /> Fazendo agora
        </p>
        {fazendoAgora.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 py-6 text-center text-xs text-muted">
            Nada em andamento agora — pega uma tarefa da sua fila aqui embaixo pra começar.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {fazendoAgora.map((t) => (
              <CartaoFazendoAgora key={t.id} tarefa={t} />
            ))}
          </div>
        )}
      </div>

      <SecaoFila
        titulo="Minha fila"
        icone={ListTodo}
        tarefas={minhaFila}
        rotuloAcao="Iniciar"
        onAcao={async (id) => {
          const tarefa = minhaFila.find((t) => t.id === id);
          if (tarefa) await iniciar(tarefa);
        }}
        vazio="Sua fila está vazia — pega uma tarefa disponível aqui embaixo."
      />

      <SecaoFila
        titulo="Disponíveis pra pegar"
        icone={Inbox}
        tarefas={disponiveis}
        rotuloAcao="Pegar pra mim"
        onAcao={pegarParaMim}
        vazio="Nada sem dono no momento."
      />

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
