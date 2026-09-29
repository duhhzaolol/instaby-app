"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, ExternalLink, TrendingUp, TrendingDown, MessageSquare, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { visualDaRede } from "@/lib/redesSociais";

export type RelatorioResumo = {
  id: string;
  rede: string;
  inicio: string;
  fim: string;
  seguidoresInicio: number | null;
  seguidoresFim: number | null;
  investimento: number | null;
  leads: number | null;
  // Etapa 1 item 7 — comentário do cliente (deixado na página pública do
  // relatório) e a resposta da agência, agora visíveis e editáveis aqui também,
  // não só na página pública.
  comentarioCliente?: string | null;
  comentarioClienteEm?: string | null;
  comentarioAgencia?: string | null;
};

export function RelatorioCard({ relatorio, index }: { relatorio: RelatorioResumo; index: number }) {
  const router = useRouter();
  const { icone: Icon, cor, label } = visualDaRede(relatorio.rede);
  const [comentarioAberto, setComentarioAberto] = useState(false);
  const [respostaAgencia, setRespostaAgencia] = useState(relatorio.comentarioAgencia || "");
  const [salvandoResposta, setSalvandoResposta] = useState(false);
  const temComentarioCliente = !!relatorio.comentarioCliente;

  async function salvarResposta() {
    setSalvandoResposta(true);
    const res = await fetch(`/api/relatorios/${relatorio.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comentarioAgencia: respostaAgencia || null }),
    });
    setSalvandoResposta(false);
    if (!res.ok) {
      alert("Não consegui salvar essa resposta.");
      return;
    }
    router.refresh();
  }

  const crescimento =
    relatorio.seguidoresInicio && relatorio.seguidoresFim
      ? relatorio.seguidoresFim - relatorio.seguidoresInicio
      : null;
  const crescimentoPct =
    crescimento !== null && relatorio.seguidoresInicio
      ? Math.round((crescimento / relatorio.seguidoresInicio) * 1000) / 10
      : null;

  async function excluir() {
    if (!confirm("Excluir esse relatório?")) return;
    const res = await fetch(`/api/relatorios/${relatorio.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Não consegui excluir esse relatório. Tenta de novo.");
      return;
    }
    router.refresh();
  }

  return (
    <Card index={index} hoverable={false} className="overflow-hidden p-0">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href={`/relatorio/${relatorio.id}`} target="_blank" className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${cor}1A`, color: cor }}
          >
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-text">
              {label} · {new Date(relatorio.inicio).toLocaleDateString("pt-BR")} a{" "}
              {new Date(relatorio.fim).toLocaleDateString("pt-BR")}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted">
              {crescimento !== null ? (
                <>
                  {crescimento >= 0 ? (
                    <TrendingUp size={11} className="text-emerald-400" />
                  ) : (
                    <TrendingDown size={11} className="text-red-400" />
                  )}
                  {crescimento >= 0 ? "+" : ""}
                  {crescimento} seguidores ({crescimentoPct}%)
                </>
              ) : relatorio.investimento ? (
                `R$ ${relatorio.investimento.toFixed(0)} investidos · ${relatorio.leads || 0} leads`
              ) : (
                "Ver relatório"
              )}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {/* Comentário do cliente / resposta da agência (Etapa 1 item 7) — o ícone
             fica destacado quando o cliente deixou um comentário nesse período,
             pra chamar atenção mesmo se a notificação já tiver sido adiada/lida. */}
          <button
            onClick={() => setComentarioAberto((v) => !v)}
            title={temComentarioCliente ? "Tem comentário do cliente" : "Comentário / resposta da agência"}
            className={`relative ${temComentarioCliente ? "text-accent" : "text-muted hover:text-text"}`}
          >
            <MessageSquare size={13} />
            {temComentarioCliente && (
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
            )}
          </button>
          <Link href={`/relatorio/${relatorio.id}`} target="_blank" className="text-muted hover:text-text">
            <ExternalLink size={13} />
          </Link>
          <button onClick={excluir} className="text-muted hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {comentarioAberto && (
        <div className="border-t border-border bg-base/40 p-4">
          {relatorio.comentarioCliente ? (
            <div className="mb-3 rounded-lg bg-card/60 px-3 py-2">
              <p className="mb-0.5 flex items-center justify-between text-[11px] text-muted">
                <span className="font-medium text-text/80">Comentário do cliente</span>
                {relatorio.comentarioClienteEm && (
                  <span>{new Date(relatorio.comentarioClienteEm).toLocaleString("pt-BR")}</span>
                )}
              </p>
              <p className="whitespace-pre-wrap text-xs text-text">{relatorio.comentarioCliente}</p>
            </div>
          ) : (
            <p className="mb-3 text-xs text-muted">O cliente ainda não comentou esse período.</p>
          )}
          <label className="mb-1 block text-xs text-muted">Resposta da agência (aparece no relatório público)</label>
          <div className="flex items-start gap-1.5">
            <textarea
              value={respostaAgencia}
              onChange={(e) => setRespostaAgencia(e.target.value)}
              rows={2}
              placeholder="Ex.: Obrigado pelo retorno! Esse mês..."
              className="w-full flex-1 rounded-lg border border-border bg-card/60 px-3 py-2 text-xs text-text outline-none focus:border-accent/50"
            />
            <button
              onClick={salvarResposta}
              disabled={salvandoResposta}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
