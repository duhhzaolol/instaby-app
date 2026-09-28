import { Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatarDuracao } from "@/lib/formatarDuracao";

export type PessoaAgora = {
  id: string;
  nome: string;
  cargo: string;
  cor: "accent" | "pessoa-trafego" | "pessoa-editor";
  atividadeAtual: { atividade: string; clienteNome: string | null } | null;
  horasSemana: number;
};

// Cores por pessoa escritas por extenso de propósito — mesma pegadinha do Tailwind
// documentada na Sidebar (CLASSES_AVATAR): nunca montar `bg-${cor}/20` em runtime.
const CLASSES_AVATAR = {
  accent: "bg-accent/20 text-accent",
  "pessoa-trafego": "bg-pessoa-trafego/20 text-pessoa-trafego",
  "pessoa-editor": "bg-pessoa-editor/20 text-pessoa-editor",
} as const;

function iniciaisDe(nome: string) {
  return nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// "Equipe agora" — Início do dono (redesign v144, Parte 2). O que cada pessoa
// ativa está fazendo neste momento (a partir do cronômetro/RegistroTempo aberto,
// que já sabe quem lançou desde a v138) e quantas horas já lançou essa semana.
// Nenhum campo novo no banco — só uma leitura diferente do que já existe.
export function EquipeAgora({ pessoas, index = 0 }: { pessoas: PessoaAgora[]; index?: number }) {
  if (pessoas.length === 0) return null;

  return (
    <Card hoverable={false} index={index} className="mb-6 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
        <Users size={14} className="text-accent" /> Equipe agora
      </p>
      <div className="flex flex-col gap-2.5">
        {pessoas.map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${CLASSES_AVATAR[p.cor]}`}
            >
              {iniciaisDe(p.nome)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text">{p.nome}</p>
              <p className="truncate text-xs text-muted">
                {p.atividadeAtual ? (
                  <>
                    <span className="text-emerald-400">●</span> {p.atividadeAtual.atividade}
                    {p.atividadeAtual.clienteNome && ` — ${p.atividadeAtual.clienteNome}`}
                  </>
                ) : (
                  "Livre agora"
                )}
              </p>
            </div>
            <p className="fonte-valores shrink-0 text-xs text-muted">
              {p.horasSemana > 0 ? `${formatarDuracao(p.horasSemana)} essa semana` : "sem horas essa semana"}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
