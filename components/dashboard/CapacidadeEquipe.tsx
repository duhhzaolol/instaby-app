"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { AvatarPessoa } from "@/components/ui/AvatarPessoa";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { TIPOS_AUSENCIA, TIPO_AUSENCIA_LABEL, type NivelCapacidade } from "@/lib/capacidade";

type Semana = {
  inicio: string;
  fim: string;
  capacidade: number;
  previsto: number;
  semEstimativa: number;
  nivel: NivelCapacidade;
};
type Conflito = { tarefaId: string; titulo: string; prazo: string };
type AusenciaData = {
  id: string;
  tipo: string;
  inicio: string;
  fim: string;
  diaInteiro: boolean;
  horasPorDia: number | null;
  descricao: string | null;
};
export type PessoaCapacidade = {
  id: string;
  nome: string;
  fotoUrl: string | null;
  cargaHorariaSemanal: number;
  semanas: Semana[];
  conflitos: Conflito[];
  ausencias: AusenciaData[];
};

const COR_NIVEL: Record<NivelCapacidade, string> = {
  ok: "#10B981",
  alerta: "#F59E0B",
  sobrecarga: "#EF4444",
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
}

function formatarNumero(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// Painel de Capacidade da equipe (Etapa 4 v158) — cada card é uma pessoa; quem
// pode editar (própria linha sempre, ou qualquer uma com gerenciarEquipe) vê o
// gerenciador de folgas/compromissos dentro do próprio card.
export function CapacidadeEquipe({
  pessoas,
  usuarioAtualId,
  podeGerenciarEquipe,
}: {
  pessoas: PessoaCapacidade[];
  usuarioAtualId: string;
  podeGerenciarEquipe: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {pessoas.map((pessoa, i) => (
        <PessoaCard
          key={pessoa.id}
          pessoa={pessoa}
          index={i}
          editavel={podeGerenciarEquipe || pessoa.id === usuarioAtualId}
        />
      ))}
    </div>
  );
}

function PessoaCard({ pessoa, index, editavel }: { pessoa: PessoaCapacidade; index: number; editavel: boolean }) {
  const router = useRouter();
  const [mostrarAusencias, setMostrarAusencias] = useState(false);
  const [novoTipo, setNovoTipo] = useState<string>(TIPOS_AUSENCIA[0]);
  const [novoInicio, setNovoInicio] = useState("");
  const [novoFim, setNovoFim] = useState("");
  const [novoDiaInteiro, setNovoDiaInteiro] = useState(true);
  const [novasHorasPorDia, setNovasHorasPorDia] = useState("4");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function adicionarAusencia(e: React.FormEvent) {
    e.preventDefault();
    if (!novoInicio || !novoFim) {
      setErro("Informe o período.");
      return;
    }
    setSalvando(true);
    setErro("");
    const res = await fetch("/api/ausencias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuarioId: pessoa.id,
        tipo: novoTipo,
        inicio: `${novoInicio}T00:00:00-03:00`,
        fim: `${novoFim}T23:59:59-03:00`,
        diaInteiro: novoDiaInteiro,
        horasPorDia: novoDiaInteiro ? undefined : Number(novasHorasPorDia),
        descricao: novaDescricao.trim() || null,
      }),
    });
    setSalvando(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setErro(d?.erro || "Não consegui salvar.");
      return;
    }
    setNovoInicio("");
    setNovoFim("");
    setNovaDescricao("");
    router.refresh();
  }

  async function removerAusencia(id: string) {
    if (!window.confirm("Remover essa folga/compromisso?")) return;
    const res = await fetch(`/api/ausencias/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Não consegui remover.");
      return;
    }
    router.refresh();
  }

  return (
    <Card index={index} className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AvatarPessoa nome={pessoa.nome} fotoUrl={pessoa.fotoUrl} tamanho={32} />
          <div>
            <p className="text-sm font-medium text-text">{pessoa.nome}</p>
            <p className="text-xs text-muted">{formatarNumero(pessoa.cargaHorariaSemanal)}h/semana de disponibilidade base</p>
          </div>
        </div>
        {editavel && (
          <button
            onClick={() => setMostrarAusencias((v) => !v)}
            className="text-xs text-muted underline decoration-dotted hover:text-text"
          >
            {mostrarAusencias ? "Fechar" : "Folgas/compromissos"}
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {pessoa.semanas.map((semana) => (
          <div key={semana.inicio} className="min-w-[132px] shrink-0 rounded-xl border border-border bg-base/60 p-2.5">
            <p className="mb-1 text-[10px] text-muted">
              {formatarData(semana.inicio)}–{formatarData(semana.fim)}
            </p>
            <p className="text-sm font-medium text-text">
              {formatarNumero(semana.previsto)}h <span className="text-muted">/ {formatarNumero(semana.capacidade)}h</span>
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-card">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    semana.capacidade > 0 ? (semana.previsto / semana.capacidade) * 100 : semana.previsto > 0 ? 100 : 0
                  )}%`,
                  backgroundColor: COR_NIVEL[semana.nivel],
                }}
              />
            </div>
            {semana.semEstimativa > 0 && (
              <p className="mt-1 text-[10px] text-muted">+{semana.semEstimativa} sem estimativa</p>
            )}
          </div>
        ))}
      </div>

      {pessoa.conflitos.length > 0 && (
        <div className="mt-3 flex flex-col gap-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-400">
            <AlertTriangle size={11} /> Prazo caindo num dia de ausência
          </p>
          {pessoa.conflitos.map((c) => (
            <p key={c.tarefaId} className="text-[11px] text-muted">
              {c.titulo} — {formatarData(c.prazo)}
            </p>
          ))}
        </div>
      )}

      {editavel && mostrarAusencias && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-2 flex flex-col gap-1.5">
            {pessoa.ausencias.length === 0 && <p className="text-xs text-muted">Nenhuma folga ou compromisso cadastrado.</p>}
            {pessoa.ausencias.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-card/60 px-2.5 py-1.5 text-xs">
                <span className="text-text">
                  {TIPO_AUSENCIA_LABEL[a.tipo] || a.tipo} · {formatarData(a.inicio)}
                  {a.inicio.slice(0, 10) !== a.fim.slice(0, 10) ? ` a ${formatarData(a.fim)}` : ""}
                  {!a.diaInteiro && a.horasPorDia ? ` · ${formatarNumero(a.horasPorDia)}h/dia` : ""}
                  {a.descricao ? ` · ${a.descricao}` : ""}
                </span>
                <button onClick={() => removerAusencia(a.id)} className="shrink-0 text-muted hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={adicionarAusencia} className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Tipo</Label>
                <Select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)}>
                  {TIPOS_AUSENCIA.map((t) => (
                    <option key={t} value={t}>
                      {TIPO_AUSENCIA_LABEL[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-1.5 pb-2 text-xs text-muted">
                  <input type="checkbox" checked={novoDiaInteiro} onChange={(e) => setNovoDiaInteiro(e.target.checked)} />
                  Dia inteiro
                </label>
                {!novoDiaInteiro && (
                  <div className="flex-1">
                    <Label>Horas/dia</Label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={novasHorasPorDia}
                      onChange={(e) => setNovasHorasPorDia(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Início</Label>
                <DatePicker value={novoInicio} onChange={setNovoInicio} />
              </div>
              <div>
                <Label>Fim</Label>
                <DatePicker value={novoFim} onChange={setNovoFim} />
              </div>
            </div>
            <Input placeholder="Descrição (opcional)" value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} />
            {erro && <p className="text-xs text-red-400">{erro}</p>}
            <Button type="submit" size="sm" variant="secondary" disabled={salvando} className="self-start">
              <Plus size={13} /> {salvando ? "Salvando..." : "Adicionar"}
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}
