"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, X, Check, Link2 } from "lucide-react";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadImagem } from "@/components/ui/UploadImagem";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export type LinkBioItem = {
  id: string;
  titulo: string;
  url: string;
  imagemUrl: string | null;
  ordem: number;
};

function CampoLink({
  titulo,
  setTitulo,
  url,
  setUrl,
  imagemUrl,
  setImagemUrl,
}: {
  titulo: string;
  setTitulo: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  imagemUrl: string | null;
  setImagemUrl: (v: string | null) => void;
}) {
  return (
    <>
      <Label>Texto do link</Label>
      <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Portfólio" className="mb-3" />
      <Label>Endereço (URL)</Label>
      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="mb-3" />
      <Label>Foto de capa (opcional)</Label>
      <UploadImagem value={imagemUrl} onChange={setImagemUrl} pasta="links-bio" tamanhoRecomendado="200 × 200px" proporcao="quadrado" />
    </>
  );
}

export default function LinkBioForm({
  links,
  introTexto: introTextoInicial,
  rodapeTexto: rodapeTextoInicial,
}: {
  links: LinkBioItem[];
  introTexto: string;
  rodapeTexto: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [introTexto, setIntroTexto] = useState(introTextoInicial);
  const [rodapeTexto, setRodapeTexto] = useState(rodapeTextoInicial);
  const [salvandoTextos, setSalvandoTextos] = useState(false);
  const [textosSalvos, setTextosSalvos] = useState(false);

  function limpar() {
    setTitulo("");
    setUrl("");
    setImagemUrl(null);
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !url.trim()) return;
    setEnviando(true);
    await fetch("/api/links-bio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, url, imagemUrl }),
    });
    setEnviando(false);
    limpar();
    setAberto(false);
    router.refresh();
  }

  async function remover(id: string) {
    if (!confirm("Remover esse link?")) return;
    await fetch(`/api/links-bio/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function mover(id: string, direcao: "up" | "down") {
    const idx = links.findIndex((l) => l.id === id);
    const vizinho = direcao === "up" ? links[idx - 1] : links[idx + 1];
    if (!vizinho) return;
    const atual = links[idx];
    await Promise.all([
      fetch(`/api/links-bio/${atual.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordem: vizinho.ordem }),
      }),
      fetch(`/api/links-bio/${vizinho.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordem: atual.ordem }),
      }),
    ]);
    router.refresh();
  }

  async function salvarTextos() {
    setSalvandoTextos(true);
    setTextosSalvos(false);
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        linkBioIntroTexto: introTexto || null,
        linkBioRodapeTexto: rodapeTexto || null,
      }),
    });
    setSalvandoTextos(false);
    setTextosSalvos(true);
    router.refresh();
    setTimeout(() => setTextosSalvos(false), 2500);
  }

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
        <p className="mb-3 text-sm font-medium text-text">Textos da página (não são link)</p>
        <Label>Frase de abertura</Label>
        <Textarea
          value={introTexto}
          onChange={(e) => setIntroTexto(e.target.value)}
          rows={2}
          placeholder="Marketing digital com resultado de verdade"
          className="mb-3"
        />
        <Label>Rodapé (opcional — se vazio, usa o padrão com o ano atual)</Label>
        <Textarea
          value={rodapeTexto}
          onChange={(e) => setRodapeTexto(e.target.value)}
          rows={2}
          placeholder="© 2026 Instaby Agência"
          className="mb-3"
        />
        <Button onClick={salvarTextos} disabled={salvandoTextos} size="sm" className="w-full">
          {textosSalvos ? <Check size={14} /> : null} {salvandoTextos ? "Salvando..." : textosSalvos ? "Salvo!" : "Salvar textos"}
        </Button>
      </div>

      {!aberto ? (
        <button
          onClick={() => setAberto(true)}
          className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-accent/30 bg-accent/5 py-3 text-sm font-medium text-accent hover:bg-accent/10"
        >
          <Plus size={15} /> Adicionar link
        </button>
      ) : (
        <form onSubmit={adicionar} className="mb-4 rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-text">Novo link</p>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                limpar();
              }}
              className="text-muted hover:text-text"
            >
              <X size={16} />
            </button>
          </div>
          <CampoLink titulo={titulo} setTitulo={setTitulo} url={url} setUrl={setUrl} imagemUrl={imagemUrl} setImagemUrl={setImagemUrl} />
          <Button type="submit" disabled={enviando || !titulo.trim() || !url.trim()} className="mt-3 w-full">
            {enviando ? "Salvando..." : "Adicionar"}
          </Button>
        </form>
      )}

      {links.length === 0 ? (
        <EmptyState icon={Link2} title="Nenhum link ainda" description="Adicione links pra eles aparecerem na página /link." />
      ) : (
        <div className="flex flex-col gap-2">
          {links.map((l, i) =>
            editandoId === l.id ? (
              <EditarLink key={l.id} item={l} onFechar={() => setEditandoId(null)} />
            ) : (
              <Card key={l.id} index={i} hoverable={false} className="flex items-center gap-3 p-3">
                {l.imagemUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.imagemUrl} alt={l.titulo} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-base/60 text-muted">
                    <Link2 size={16} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{l.titulo}</p>
                  <p className="truncate text-xs text-muted">{l.url}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => mover(l.id, "up")}
                    disabled={i === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-text disabled:opacity-30"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => mover(l.id, "down")}
                    disabled={i === links.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-text disabled:opacity-30"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => setEditandoId(l.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-text"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => remover(l.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}

function EditarLink({ item, onFechar }: { item: LinkBioItem; onFechar: () => void }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(item.titulo);
  const [url, setUrl] = useState(item.url);
  const [imagemUrl, setImagemUrl] = useState<string | null>(item.imagemUrl);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    await fetch(`/api/links-bio/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, url, imagemUrl }),
    });
    setSalvando(false);
    onFechar();
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-accent/30 bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Editar link</p>
        <button onClick={onFechar} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>
      <CampoLink titulo={titulo} setTitulo={setTitulo} url={url} setUrl={setUrl} imagemUrl={imagemUrl} setImagemUrl={setImagemUrl} />
      <button
        onClick={salvar}
        disabled={salvando}
        className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        <Check size={14} /> {salvando ? "Salvando..." : "Salvar alterações"}
      </button>
    </div>
  );
}
