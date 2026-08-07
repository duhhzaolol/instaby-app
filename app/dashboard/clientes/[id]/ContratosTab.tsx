"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSignature, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

type Contrato = { id: string; conteudo: string; status: string; orcamentoId: string | null };
type OrcamentoAceito = { id: string; slug: string };

const tone: Record<string, "gray" | "yellow" | "green"> = {
  rascunho: "gray",
  enviado: "yellow",
  assinado: "green",
};

const label: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  assinado: "Assinado",
};

export default function ContratosTab({
  clienteId,
  contratos,
  orcamentosAceitos,
  temServicosContratados,
}: {
  clienteId: string;
  contratos: Contrato[];
  orcamentosAceitos: OrcamentoAceito[];
  temServicosContratados: boolean;
}) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState<Record<string, string>>({});

  async function gerarDoOrcamento(orcamentoId: string) {
    setGerando(true);
    await fetch(`/api/clientes/${clienteId}/contratos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orcamentoId }),
    });
    setGerando(false);
    router.refresh();
  }

  async function gerarDosServicos() {
    setGerando(true);
    await fetch(`/api/clientes/${clienteId}/contratos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fonte: "servicos" }),
    });
    setGerando(false);
    router.refresh();
  }

  async function atualizarStatus(id: string, status: string) {
    await fetch(`/api/contratos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function salvarTexto(id: string) {
    await fetch(`/api/contratos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conteudo: textoEditado[id] }),
    });
    setExpandido(null);
    router.refresh();
  }

  function copiar(texto: string) {
    navigator.clipboard.writeText(texto);
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esse contrato?")) return;
    await fetch(`/api/contratos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      {(orcamentosAceitos.length > 0 || temServicosContratados) && (
        <div className="mb-5 flex flex-wrap gap-2">
          {temServicosContratados && (
            <button
              onClick={gerarDosServicos}
              disabled={gerando}
              className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent disabled:opacity-50"
            >
              <FileSignature size={12} />
              {gerando ? "Gerando..." : "Gerar contrato dos serviços contratados"}
            </button>
          )}
          {orcamentosAceitos.map((o) => (
            <button
              key={o.id}
              onClick={() => gerarDoOrcamento(o.id)}
              disabled={gerando}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted disabled:opacity-50"
            >
              <FileSignature size={12} />
              {gerando ? "Gerando..." : `Gerar do orçamento ${o.slug}`}
            </button>
          ))}
        </div>
      )}

      {contratos.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="Nenhum contrato ainda"
          description={
            temServicosContratados || orcamentosAceitos.length > 0
              ? "Use um dos botões acima pra gerar automaticamente."
              : "Adicione serviços contratados ou aceite um orçamento pra poder gerar o contrato."
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {contratos.map((c, i) => (
            <Card key={c.id} index={i} hoverable={false} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <Badge tone={tone[c.status]}>{label[c.status]}</Badge>
                <div className="flex gap-3 text-xs">
                  <button
                    onClick={() => {
                      if (expandido === c.id) {
                        setExpandido(null);
                      } else {
                        setTextoEditado((t) => ({ ...t, [c.id]: t[c.id] ?? c.conteudo }));
                        setExpandido(c.id);
                      }
                    }}
                    className="font-medium text-muted hover:text-text"
                  >
                    {expandido === c.id ? "Fechar" : "Editar"}
                  </button>
                  <button onClick={() => copiar(c.conteudo)} className="font-medium text-accent hover:underline">
                    Copiar
                  </button>
                  <button onClick={() => excluir(c.id)} className="text-muted hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {expandido === c.id ? (
                <div>
                  <textarea
                    value={textoEditado[c.id] ?? c.conteudo}
                    onChange={(e) => setTextoEditado((t) => ({ ...t, [c.id]: e.target.value }))}
                    rows={8}
                    className="mb-3 w-full rounded-lg border border-border bg-base px-3 py-2 text-sm text-text outline-none focus:border-accent/50"
                  />
                  <Button size="sm" onClick={() => salvarTexto(c.id)}>
                    Salvar
                  </Button>
                </div>
              ) : (
                <p className="whitespace-pre-line text-xs leading-relaxed text-muted">{c.conteudo}</p>
              )}

              {c.status !== "assinado" && expandido !== c.id && (
                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                  {c.status === "rascunho" && (
                    <button
                      onClick={() => atualizarStatus(c.id, "enviado")}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Marcar como enviado
                    </button>
                  )}
                  {c.status === "enviado" && (
                    <button
                      onClick={() => atualizarStatus(c.id, "assinado")}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Marcar como assinado
                    </button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
