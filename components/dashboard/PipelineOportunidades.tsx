"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, Trophy, XCircle } from "lucide-react";
import { ESTAGIOS_OPORTUNIDADE } from "@/lib/oportunidadeVisual";
import { DatePicker } from "@/components/ui/DatePicker";

export type OportunidadeData = {
  id: string;
  nome: string;
  contatoNome: string | null;
  contatoWhatsapp: string | null;
  origem: string | null;
  interesse: string | null;
  valorEstimado: number | null;
  status: string;
  proximaAcao: string | null;
  dataProximaAcao: string | null;
  observacoes: string | null;
  motivoPerda: string | null;
  clienteId: string | null;
};

export function PipelineOportunidades({ oportunidades }: { oportunidades: OportunidadeData[] }) {
  const router = useRouter();
  const [detalhe, setDetalhe] = useState<OportunidadeData | null>(null);
  const [salvando, setSalvando] = useState(false);

  const colunas = ESTAGIOS_OPORTUNIDADE.map((e) => ({
    ...e,
    itens: oportunidades.filter((o) => o.status === e.valor),
  }));

  async function salvarCampo(campo: string, valor: any) {
    if (!detalhe) return;
    setDetalhe({ ...detalhe, [campo]: valor } as OportunidadeData);
    await fetch(`/api/oportunidades/${detalhe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [campo]: valor }),
    });
    router.refresh();
  }

  async function ganhar() {
    if (!detalhe) return;
    if (!confirm(`Marcar "${detalhe.nome}" como ganha? Isso cria o cadastro de cliente pra ela.`)) return;
    setSalvando(true);
    const res = await fetch(`/api/oportunidades/${detalhe.id}/ganhar`, { method: "POST" });
    const dados = await res.json();
    setSalvando(false);
    setDetalhe(null);
    if (dados.clienteId) {
      router.push(`/dashboard/clientes/${dados.clienteId}`);
    } else {
      router.refresh();
    }
  }

  async function perder() {
    if (!detalhe) return;
    const motivo = prompt("Por que perdeu essa oportunidade? (opcional)");
    setSalvando(true);
    await fetch(`/api/oportunidades/${detalhe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "perdido", motivoPerda: motivo || null }),
    });
    setSalvando(false);
    setDetalhe(null);
    router.refresh();
  }

  async function excluir() {
    if (!detalhe) return;
    if (!confirm("Excluir essa oportunidade?")) return;
    await fetch(`/api/oportunidades/${detalhe.id}`, { method: "DELETE" });
    setDetalhe(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {colunas.map((col) => (
          <div key={col.valor} className="w-64 shrink-0">
            <div className="mb-2 flex items-center gap-1.5 px-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.cor }} />
              <p className="text-xs font-medium text-text">{col.label}</p>
              <span className="text-xs text-muted">({col.itens.length})</span>
            </div>
            <div className="flex flex-col gap-2">
              {col.itens.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setDetalhe(o)}
                  className="rounded-xl border border-border bg-card/60 p-3 text-left hover:bg-hover"
                >
                  <p className="mb-1 text-sm text-text">{o.nome}</p>
                  {o.valorEstimado ? (
                    <p className="text-[11px] text-muted">R$ {o.valorEstimado.toFixed(0)}</p>
                  ) : (
                    o.contatoNome && <p className="text-[11px] text-muted">{o.contatoNome}</p>
                  )}
                </button>
              ))}
              {col.itens.length === 0 && <p className="text-[11px] text-muted/60">Nada aqui</p>}
            </div>
          </div>
        ))}
      </div>

      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDetalhe(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-text">{detalhe.nome}</p>
              <button onClick={() => setDetalhe(null)} className="text-muted hover:text-text">
                <X size={16} />
              </button>
            </div>

            <label className="mb-1 block text-xs text-muted">Estágio</label>
            <select
              value={detalhe.status}
              onChange={(e) => salvarCampo("status", e.target.value)}
              className="mb-3 h-10 w-full rounded-xl border border-border bg-base px-3 text-sm text-text"
            >
              {ESTAGIOS_OPORTUNIDADE.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.label}
                </option>
              ))}
            </select>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <input
                defaultValue={detalhe.contatoNome || ""}
                onBlur={(e) => salvarCampo("contatoNome", e.target.value)}
                placeholder="Nome do contato"
                className="h-10 rounded-xl border border-border bg-base px-3 text-sm text-text"
              />
              <input
                defaultValue={detalhe.contatoWhatsapp || ""}
                onBlur={(e) => salvarCampo("contatoWhatsapp", e.target.value)}
                placeholder="WhatsApp"
                className="h-10 rounded-xl border border-border bg-base px-3 text-sm text-text"
              />
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <input
                defaultValue={detalhe.origem || ""}
                onBlur={(e) => salvarCampo("origem", e.target.value)}
                placeholder="Origem"
                className="h-10 rounded-xl border border-border bg-base px-3 text-sm text-text"
              />
              <input
                defaultValue={detalhe.valorEstimado || ""}
                onBlur={(e) => salvarCampo("valorEstimado", parseFloat(e.target.value) || null)}
                placeholder="Valor estimado"
                type="number"
                className="h-10 rounded-xl border border-border bg-base px-3 text-sm text-text"
              />
            </div>

            <textarea
              defaultValue={detalhe.interesse || ""}
              onBlur={(e) => salvarCampo("interesse", e.target.value)}
              placeholder="O que ela quer"
              rows={2}
              className="mb-3 w-full rounded-xl border border-border bg-base px-3 py-2 text-sm text-text"
            />

            <label className="mb-1 block text-xs text-muted">Próxima ação</label>
            <input
              defaultValue={detalhe.proximaAcao || ""}
              onBlur={(e) => salvarCampo("proximaAcao", e.target.value)}
              placeholder="ex: Ligar de novo"
              className="mb-3 h-10 w-full rounded-xl border border-border bg-base px-3 text-sm text-text"
            />
            <DatePicker
              value={detalhe.dataProximaAcao?.slice(0, 10) || ""}
              onChange={(v) => salvarCampo("dataProximaAcao", v || null)}
              placeholder="Quando"
              className="mb-4"
              limpavel
            />

            {detalhe.status !== "ganho" && detalhe.status !== "perdido" && (
              <div className="mb-3 flex gap-2">
                <button
                  onClick={ganhar}
                  disabled={salvando}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
                >
                  <Trophy size={13} /> Ganhou
                </button>
                <button
                  onClick={perder}
                  disabled={salvando}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500/10 text-xs font-medium text-red-400 hover:bg-red-500/20"
                >
                  <XCircle size={13} /> Perdeu
                </button>
              </div>
            )}

            {detalhe.clienteId && (
              <a
                href={`/dashboard/clientes/${detalhe.clienteId}`}
                className="mb-3 block text-center text-xs text-accent hover:underline"
              >
                Ver cliente →
              </a>
            )}

            <button onClick={excluir} className="flex w-full items-center justify-center gap-1.5 text-xs text-muted hover:text-red-400">
              <Trash2 size={11} /> Excluir oportunidade
            </button>
          </div>
        </div>
      )}
    </>
  );
}
