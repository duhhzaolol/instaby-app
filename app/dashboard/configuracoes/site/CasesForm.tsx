"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, X, Check, ImageIcon } from "lucide-react";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadImagem } from "@/components/ui/UploadImagem";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export type CaseItem = {
  id: string;
  nome: string;
  categoria: string | null;
  imagemUrl: string | null;
  link: string | null;
  destaque: boolean;
  ordem: number;
};

function CampoCase({
  nome,
  setNome,
  categoria,
  setCategoria,
  link,
  setLink,
  destaque,
  setDestaque,
  imagemUrl,
  setImagemUrl,
}: {
  nome: string;
  setNome: (v: string) => void;
  categoria: string;
  setCategoria: (v: string) => void;
  link: string;
  setLink: (v: string) => void;
  destaque: boolean;
  setDestaque: (v: boolean) => void;
  imagemUrl: string | null;
  setImagemUrl: (v: string | null) => void;
}) {
  return (
    <>
      <Label>Nome do case/cliente</Label>
      <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Skyfit Araras" className="mb-3" />
      <Label>Categoria/tags (opcional)</Label>
      <Input
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        placeholder="SOCIAL MEDIA / TRÁFEGO / PRODUÇÃO"
        className="mb-3"
      />
      <Label>Link "Ver case" (opcional)</Label>
      <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="mb-3" />
      <label className="mb-3 flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={destaque} onChange={(e) => setDestaque(e.target.checked)} />
        Card em destaque (aparece grande, linha inteira)
      </label>
      <Label>Imagem de capa</Label>
      <UploadImagem
        value={imagemUrl}
        onChange={setImagemUrl}
        pasta="cases"
        tamanhoRecomendado={destaque ? "1600 × 700px" : "800 × 800px"}
        proporcao={destaque ? "wide" : "quadrado"}
      />
    </>
  );
}

export default function CasesForm({ cases }: { cases: CaseItem[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [link, setLink] = useState("");
  const [destaque, setDestaque] = useState(false);
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function limpar() {
    setNome("");
    setCategoria("");
    setLink("");
    setDestaque(false);
    setImagemUrl(null);
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setEnviando(true);
    await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, categoria: categoria || null, link: link || null, destaque, imagemUrl }),
    });
    setEnviando(false);
    limpar();
    setAberto(false);
    router.refresh();
  }

  async function remover(id: string) {
    if (!confirm("Remover esse case do portfólio?")) return;
    await fetch(`/api/cases/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function mover(id: string, direcao: "up" | "down") {
    const idx = cases.findIndex((c) => c.id === id);
    const vizinho = direcao === "up" ? cases[idx - 1] : cases[idx + 1];
    if (!vizinho) return;
    const atual = cases[idx];
    await Promise.all([
      fetch(`/api/cases/${atual.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordem: vizinho.ordem }),
      }),
      fetch(`/api/cases/${vizinho.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordem: atual.ordem }),
      }),
    ]);
    router.refresh();
  }

  return (
    <div>
      {!aberto ? (
        <button
          onClick={() => setAberto(true)}
          className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-accent/30 bg-accent/5 py-3 text-sm font-medium text-accent hover:bg-accent/10"
        >
          <Plus size={15} /> Adicionar trabalho ao portfólio
        </button>
      ) : (
        <form onSubmit={adicionar} className="mb-4 rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-text">Novo trabalho</p>
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
          <CampoCase
            nome={nome}
            setNome={setNome}
            categoria={categoria}
            setCategoria={setCategoria}
            link={link}
            setLink={setLink}
            destaque={destaque}
            setDestaque={setDestaque}
            imagemUrl={imagemUrl}
            setImagemUrl={setImagemUrl}
          />
          <Button type="submit" disabled={enviando || !nome.trim()} className="mt-3 w-full">
            {enviando ? "Salvando..." : "Adicionar"}
          </Button>
        </form>
      )}

      {cases.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Nenhum trabalho ainda" description="Adicione seus melhores cases pra eles aparecerem no site." />
      ) : (
        <div className="flex flex-col gap-2">
          {cases.map((c, i) =>
            editandoId === c.id ? (
              <EditarCase key={c.id} item={c} onFechar={() => setEditandoId(null)} />
            ) : (
              <Card key={c.id} index={i} hoverable={false} className="flex items-center gap-3 p-3">
                {c.imagemUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imagemUrl} alt={c.nome} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-base/60 text-muted">
                    <ImageIcon size={16} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {c.nome} {c.destaque && <span className="ml-1 text-[10px] text-accent">· destaque</span>}
                  </p>
                  {c.categoria && <p className="truncate text-xs text-muted">{c.categoria}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => mover(c.id, "up")}
                    disabled={i === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-text disabled:opacity-30"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => mover(c.id, "down")}
                    disabled={i === cases.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-text disabled:opacity-30"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => setEditandoId(c.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-text"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => remover(c.id)}
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

function EditarCase({ item, onFechar }: { item: CaseItem; onFechar: () => void }) {
  const router = useRouter();
  const [nome, setNome] = useState(item.nome);
  const [categoria, setCategoria] = useState(item.categoria || "");
  const [link, setLink] = useState(item.link || "");
  const [destaque, setDestaque] = useState(item.destaque);
  const [imagemUrl, setImagemUrl] = useState<string | null>(item.imagemUrl);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    await fetch(`/api/cases/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, categoria: categoria || null, link: link || null, destaque, imagemUrl }),
    });
    setSalvando(false);
    onFechar();
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-accent/30 bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Editar trabalho</p>
        <button onClick={onFechar} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>
      <CampoCase
        nome={nome}
        setNome={setNome}
        categoria={categoria}
        setCategoria={setCategoria}
        link={link}
        setLink={setLink}
        destaque={destaque}
        setDestaque={setDestaque}
        imagemUrl={imagemUrl}
        setImagemUrl={setImagemUrl}
      />
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
