"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, ExternalLink } from "lucide-react";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TIPOS_LINK, visualDoTipoLink } from "@/lib/linkClienteVisual";

export type LinkClienteData = { id: string; tipo: string; label: string | null; url: string };

export default function LinksClienteTab({
  clienteId,
  links,
  linkDriveAntigo,
}: {
  clienteId: string;
  links: LinkClienteData[];
  linkDriveAntigo: string | null;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState("drive");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setEnviando(true);
    await fetch(`/api/clientes/${clienteId}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, label: label || null, url }),
    });
    setEnviando(false);
    setTipo("drive");
    setLabel("");
    setUrl("");
    setAberto(false);
    router.refresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esse link?")) return;
    await fetch(`/api/links/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      {linkDriveAntigo && links.every((l) => l.url !== linkDriveAntigo) && (
        <a
          href={linkDriveAntigo}
          target="_blank"
          className="mb-2 flex items-center justify-between rounded-xl border border-border bg-card/40 p-3.5 hover:bg-hover"
        >
          <span className="text-sm text-text">Google Drive (do cadastro)</span>
          <ExternalLink size={13} className="text-muted" />
        </a>
      )}

      <div className="mb-4 flex flex-col gap-2">
        {links.map((l) => {
          const { icone: Icon, label: labelTipo } = visualDoTipoLink(l.tipo);
          return (
            <div key={l.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3.5">
              <a href={l.url} target="_blank" className="flex min-w-0 flex-1 items-center gap-2.5 hover:opacity-80">
                <Icon size={15} className="shrink-0 text-accent" />
                <div className="min-w-0">
                  <p className="truncate text-sm text-text">{l.label || labelTipo}</p>
                  <p className="truncate text-xs text-muted">{l.url}</p>
                </div>
              </a>
              <button onClick={() => excluir(l.id)} className="ml-2 shrink-0 text-muted hover:text-red-400">
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
        {links.length === 0 && !linkDriveAntigo && <p className="text-sm text-muted">Nenhum link cadastrado ainda.</p>}
      </div>

      {!aberto ? (
        <button
          onClick={() => setAberto(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/40 py-3 text-sm text-muted hover:border-accent/40 hover:text-text"
        >
          <Plus size={15} /> Adicionar link
        </button>
      ) : (
        <form onSubmit={salvar} className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-text">Novo link</p>
            <button type="button" onClick={() => setAberto(false)} className="text-muted hover:text-text">
              <X size={16} />
            </button>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <Label>Tipo</Label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-base px-3 text-sm text-text"
              >
                {TIPOS_LINK.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Nome (opcional)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex: Drive de fotos" />
            </div>
          </div>
          <Label>URL</Label>
          <Input required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="mb-4" />
          <Button type="submit" disabled={enviando} className="w-full">
            {enviando ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      )}
    </div>
  );
}
