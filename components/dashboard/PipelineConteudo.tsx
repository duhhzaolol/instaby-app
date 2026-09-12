"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, ExternalLink } from "lucide-react";
import { FORMATOS_CONTEUDO, STATUS_CONTEUDO, visualDoFormato } from "@/lib/conteudoVisual";
import { DatePicker } from "@/components/ui/DatePicker";

export type ConteudoResumo = {
  id: string;
  titulo: string;
  formato: string | null;
  status: string;
  clienteNome: string | null;
  clienteCor: string | null;
  dataPublicacao: string | null;
  tarefasAbertas: number;
  tarefasTotal: number;
};

export type ConteudoDetalhe = ConteudoResumo & {
  clienteId: string | null;
  campanha: string | null;
  objetivo: string | null;
  pilar: string | null;
  redes: string[];
  tipoVeiculacao: string;
  briefing: string | null;
  roteiro: string | null;
  legenda: string | null;
  cta: string | null;
  referencias: string | null;
  linkArquivos: string | null;
  dataCaptacao: string | null;
  prazoEdicao: string | null;
  prazoAprovacao: string | null;
  urlPublicada: string | null;
  tarefas: { id: string; titulo: string; status: string }[];
  tokenAprovacao: string | null;
};

function formatarData(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function PipelineConteudo({ colunas }: { colunas: { status: string; label: string; cor: string; itens: ConteudoResumo[] }[] }) {
  const router = useRouter();
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    fetch("/api/templates-tarefas")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => {});
  }, []);
  const [detalhe, setDetalhe] = useState<ConteudoDetalhe | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function abrir(id: string) {
    setDetalheId(id);
    setCarregando(true);
    const todos = await fetch(`/api/conteudos`).then((r) => r.json());
    const item = todos.find((c: any) => c.id === id);
    if (item) {
      setDetalhe({
        id: item.id,
        titulo: item.titulo,
        formato: item.formato,
        status: item.status,
        clienteId: item.clienteId,
        clienteNome: item.cliente?.nome || null,
        clienteCor: item.cliente?.cor || null,
        dataPublicacao: item.dataPublicacao,
        campanha: item.campanha,
        objetivo: item.objetivo,
        pilar: item.pilar,
        redes: item.redes || [],
        tipoVeiculacao: item.tipoVeiculacao,
        briefing: item.briefing,
        roteiro: item.roteiro,
        legenda: item.legenda,
        cta: item.cta,
        referencias: item.referencias,
        linkArquivos: item.linkArquivos,
        dataCaptacao: item.dataCaptacao,
        prazoEdicao: item.prazoEdicao,
        prazoAprovacao: item.prazoAprovacao,
        urlPublicada: item.urlPublicada,
        tarefas: item.tarefas || [],
        tokenAprovacao: item.tokenAprovacao || null,
        tarefasAbertas: (item.tarefas || []).filter((t: any) => t.status !== "feito").length,
        tarefasTotal: (item.tarefas || []).length,
      });
    }
    setCarregando(false);
  }

  function fechar() {
    setDetalheId(null);
    setDetalhe(null);
  }

  async function salvarCampo(campo: string, valor: any) {
    if (!detalhe) return;
    setDetalhe({ ...detalhe, [campo]: valor } as ConteudoDetalhe);
    await fetch(`/api/conteudos/${detalhe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [campo]: valor }),
    });
    router.refresh();
  }

  async function enviarAprovacao() {
    if (!detalhe) return;
    const res = await fetch(`/api/conteudos/${detalhe.id}/enviar-aprovacao`, { method: "POST" });
    const atualizado = await res.json();
    setDetalhe({ ...detalhe, status: "aguardando_aprovacao", tokenAprovacao: atualizado.tokenAprovacao });
    router.refresh();
  }

  async function aplicarTemplate(templateId: string) {
    if (!detalhe || !templateId) return;
    await fetch(`/api/templates-tarefas/${templateId}/aplicar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId: detalhe.clienteId, conteudoId: detalhe.id }),
    });
    router.refresh();
    abrir(detalhe.id);
  }

  async function novaTarefaVinculada() {
    if (!detalhe) return;
    const titulo = prompt("Título da tarefa (ex: gravar, editar, publicar):");
    if (!titulo) return;
    await fetch("/api/tarefas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, clienteId: detalhe.clienteId, conteudoId: detalhe.id }),
    });
    router.refresh();
    abrir(detalhe.id);
  }

  async function excluir() {
    if (!detalhe) return;
    if (!confirm("Excluir esse conteúdo? As tarefas vinculadas continuam existindo, só desvinculam.")) return;
    await fetch(`/api/conteudos/${detalhe.id}`, { method: "DELETE" });
    fechar();
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {colunas.map((col) => (
          <div key={col.status} className="w-64 shrink-0">
            <div className="mb-2 flex items-center gap-1.5 px-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.cor }} />
              <p className="text-xs font-medium text-text">{col.label}</p>
              <span className="text-xs text-muted">({col.itens.length})</span>
            </div>
            <div className="flex flex-col gap-2">
              {col.itens.map((item) => {
                const { icone: Icon, cor } = visualDoFormato(item.formato);
                return (
                  <button
                    key={item.id}
                    onClick={() => abrir(item.id)}
                    className="rounded-xl border border-border bg-card/60 p-3 text-left hover:bg-hover"
                    style={item.clienteCor ? { borderLeft: `2px solid ${item.clienteCor}` } : undefined}
                  >
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs" style={{ color: cor }}>
                      <Icon size={11} /> {item.clienteNome || "Sem cliente"}
                    </p>
                    <p className="mb-1 text-sm text-text">{item.titulo}</p>
                    <p className="text-[11px] text-muted">
                      {formatarData(item.dataPublicacao)}
                      {item.tarefasTotal > 0 && ` · ${item.tarefasTotal - item.tarefasAbertas}/${item.tarefasTotal} tarefas`}
                    </p>
                  </button>
                );
              })}
              {col.itens.length === 0 && <p className="text-[11px] text-muted/60">Nada aqui</p>}
            </div>
          </div>
        ))}
      </div>

      {detalheId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={fechar}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5"
          >
            {carregando || !detalhe ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-text">{detalhe.titulo}</p>
                  <button onClick={fechar} className="text-muted hover:text-text">
                    <X size={16} />
                  </button>
                </div>

                <label className="mb-1 block text-xs text-muted">Status</label>
                <select
                  value={detalhe.status}
                  onChange={(e) => salvarCampo("status", e.target.value)}
                  className="mb-3 h-10 w-full rounded-xl border border-border bg-base px-3 text-sm text-text"
                >
                  {STATUS_CONTEUDO.map((s) => (
                    <option key={s.valor} value={s.valor}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <div className="mb-3 grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted">Formato</label>
                    <select
                      value={detalhe.formato || ""}
                      onChange={(e) => salvarCampo("formato", e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-base px-3 text-sm text-text"
                    >
                      <option value="">—</option>
                      {FORMATOS_CONTEUDO.map((f) => (
                        <option key={f.valor} value={f.valor}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">Captação</label>
                    <DatePicker
                      value={detalhe.dataCaptacao?.slice(0, 10) || ""}
                      onChange={(v) => salvarCampo("dataCaptacao", v || null)}
                      limpavel
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">Publicação</label>
                    <DatePicker
                      value={detalhe.dataPublicacao?.slice(0, 10) || ""}
                      onChange={(v) => salvarCampo("dataPublicacao", v || null)}
                      limpavel
                    />
                  </div>
                </div>

                <label className="mb-1 block text-xs text-muted">Objetivo</label>
                <textarea
                  defaultValue={detalhe.objetivo || ""}
                  onBlur={(e) => salvarCampo("objetivo", e.target.value || null)}
                  rows={2}
                  className="mb-3 w-full rounded-xl border border-border bg-base px-3 py-2 text-sm text-text"
                />

                <label className="mb-1 block text-xs text-muted">Briefing / roteiro</label>
                <textarea
                  defaultValue={detalhe.briefing || ""}
                  onBlur={(e) => salvarCampo("briefing", e.target.value || null)}
                  rows={3}
                  placeholder="O que precisa acontecer nesse conteúdo"
                  className="mb-3 w-full rounded-xl border border-border bg-base px-3 py-2 text-sm text-text"
                />

                <label className="mb-1 block text-xs text-muted">Legenda</label>
                <textarea
                  defaultValue={detalhe.legenda || ""}
                  onBlur={(e) => salvarCampo("legenda", e.target.value || null)}
                  rows={2}
                  className="mb-3 w-full rounded-xl border border-border bg-base px-3 py-2 text-sm text-text"
                />

                <label className="mb-1 block text-xs text-muted">Link de arquivos (Drive, Canva...)</label>
                <input
                  defaultValue={detalhe.linkArquivos || ""}
                  onBlur={(e) => salvarCampo("linkArquivos", e.target.value || null)}
                  className="mb-4 h-10 w-full rounded-xl border border-border bg-base px-3 text-sm text-text"
                />

                <div className="mb-4 rounded-xl border border-border bg-base/60 p-3">
                  {!detalhe.tokenAprovacao ? (
                    <button
                      onClick={enviarAprovacao}
                      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-accent text-xs font-medium text-white"
                    >
                      Enviar pra aprovação do cliente
                    </button>
                  ) : (
                    <>
                      <p className="mb-1.5 text-[11px] text-muted">Link de aprovação (manda pro cliente)</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 truncate rounded-lg bg-base px-2 py-1.5 text-[10px] text-muted">
                          {typeof window !== "undefined" ? window.location.origin : ""}/aprovacao/{detalhe.tokenAprovacao}
                        </code>
                        <button
                          onClick={enviarAprovacao}
                          className="shrink-0 rounded-lg border border-border px-2 py-1.5 text-[10px] text-muted hover:text-text"
                        >
                          Reenviar
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-muted">Tarefas vinculadas</p>
                    <div className="flex items-center gap-2">
                      {templates.length > 0 && (
                        <select
                          onChange={(e) => e.target.value && aplicarTemplate(e.target.value)}
                          defaultValue=""
                          className="h-6 rounded-lg border border-border bg-base px-1.5 text-[10px] text-muted"
                        >
                          <option value="">Aplicar template...</option>
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nome}
                            </option>
                          ))}
                        </select>
                      )}
                      <button onClick={novaTarefaVinculada} className="flex items-center gap-1 text-xs text-accent hover:underline">
                        <Plus size={11} /> Nova
                      </button>
                    </div>
                  </div>
                  {detalhe.tarefas.length === 0 ? (
                    <p className="text-xs text-muted">Nenhuma tarefa vinculada ainda.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {detalhe.tarefas.map((t) => (
                        <div key={t.id} className="flex items-center justify-between rounded-lg bg-base/60 px-3 py-1.5 text-xs">
                          <span className={t.status === "feito" ? "text-muted line-through" : "text-text"}>{t.titulo}</span>
                          <span className="text-muted">{t.status === "feito" ? "✓" : "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {detalhe.clienteId && (
                    <a
                      href={`/dashboard/clientes/${detalhe.clienteId}?aba=tarefas`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs text-muted hover:text-text"
                    >
                      <ExternalLink size={11} /> Ver cliente
                    </a>
                  )}
                  <button
                    onClick={excluir}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={11} /> Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
