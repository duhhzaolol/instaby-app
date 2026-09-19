"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, X, Check, ImageIcon } from "lucide-react";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadImagem } from "@/components/ui/UploadImagem";
import { FocoImagem } from "@/components/ui/FocoImagem";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export type Resultado = { valor: string; legenda: string };

export type CaseItem = {
  id: string;
  nome: string;
  categoria: string | null;
  imagemUrl: string | null;
  imagemFoco: string | null;
  descricao: string | null;
  descricaoCompleta: string | null;
  botaoTexto: string | null;
  resultados: Resultado[] | null;
  link: string | null;
  destaque: boolean;
  ordem: number;
};

// Formato simples de edição pros resultados: uma linha por indicador,
// "valor - legenda", ex: "+478 - cliques em 15 dias".
function resultadosParaTexto(resultados: Resultado[] | null): string {
  return (resultados || []).map((r) => `${r.valor} - ${r.legenda}`).join("\n");
}
function textoParaResultados(texto: string): Resultado[] {
  return texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha) => {
      const [valor, ...resto] = linha.split(" - ");
      return { valor: (valor || "").trim(), legenda: resto.join(" - ").trim() };
    })
    .filter((r) => r.valor && r.legenda);
}

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
  imagemFoco,
  setImagemFoco,
  descricao,
  setDescricao,
  descricaoCompleta,
  setDescricaoCompleta,
  botaoTexto,
  setBotaoTexto,
  resultadosTexto,
  setResultadosTexto,
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
  imagemFoco: string;
  setImagemFoco: (v: string) => void;
  descricao: string;
  setDescricao: (v: string) => void;
  descricaoCompleta: string;
  setDescricaoCompleta: (v: string) => void;
  botaoTexto: string;
  setBotaoTexto: (v: string) => void;
  resultadosTexto: string;
  setResultadosTexto: (v: string) => void;
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
      <Label>Descrição curta (aparece no card e no destaque)</Label>
      <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} placeholder="Mais membros, mais engajamento..." className="mb-3" />
      <Label>Link "Ver case" — deixe vazio pra usar a página de case do próprio site</Label>
      <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://... (opcional, link externo)" className="mb-3" />
      <label className="mb-3 flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={destaque} onChange={(e) => setDestaque(e.target.checked)} />
        Card em destaque (aparece grande, como projeto principal do portfólio)
      </label>

      {destaque && (
        <>
          <Label>Texto do botão</Label>
          <Input value={botaoTexto} onChange={(e) => setBotaoTexto(e.target.value)} placeholder="Ver case completo" className="mb-3" />
          <Label>Resultados (opcional) — um por linha, formato "valor - legenda"</Label>
          <Textarea
            value={resultadosTexto}
            onChange={(e) => setResultadosTexto(e.target.value)}
            rows={3}
            placeholder={"+478 - cliques em 15 dias\n58.852 - impressões\nR$ 1,43 - CPC médio"}
            className="mb-3 font-mono text-xs"
          />
        </>
      )}

      <Label>Descrição completa (opcional — pro caso o link "Ver case" fique vazio)</Label>
      <Textarea
        value={descricaoCompleta}
        onChange={(e) => setDescricaoCompleta(e.target.value)}
        rows={4}
        placeholder="Texto completo do case, pra página própria do site sobre esse trabalho."
        className="mb-3"
      />

      <Label>Imagem de capa</Label>
      <UploadImagem
        value={imagemUrl}
        onChange={setImagemUrl}
        pasta="cases"
        tamanhoRecomendado={destaque ? "1600 × 700px" : "800 × 800px"}
        proporcao={destaque ? "wide" : "quadrado"}
      />
      {imagemUrl && (
        <div className="mt-3">
          <Label>Ponto de enquadramento</Label>
          <FocoImagem imagemUrl={imagemUrl} valor={imagemFoco || "50% 50%"} onChange={setImagemFoco} />
        </div>
      )}
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
  const [imagemFoco, setImagemFoco] = useState("50% 50%");
  const [descricao, setDescricao] = useState("");
  const [descricaoCompleta, setDescricaoCompleta] = useState("");
  const [botaoTexto, setBotaoTexto] = useState("");
  const [resultadosTexto, setResultadosTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  function limpar() {
    setNome("");
    setCategoria("");
    setLink("");
    setDestaque(false);
    setImagemUrl(null);
    setImagemFoco("50% 50%");
    setDescricao("");
    setDescricaoCompleta("");
    setBotaoTexto("");
    setResultadosTexto("");
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setEnviando(true);
    await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        categoria: categoria || null,
        link: link || null,
        destaque,
        imagemUrl,
        imagemFoco: imagemFoco || null,
        descricao: descricao || null,
        descricaoCompleta: descricaoCompleta || null,
        botaoTexto: botaoTexto || null,
        resultados: textoParaResultados(resultadosTexto),
      }),
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
            imagemFoco={imagemFoco}
            setImagemFoco={setImagemFoco}
            descricao={descricao}
            setDescricao={setDescricao}
            descricaoCompleta={descricaoCompleta}
            setDescricaoCompleta={setDescricaoCompleta}
            botaoTexto={botaoTexto}
            setBotaoTexto={setBotaoTexto}
            resultadosTexto={resultadosTexto}
            setResultadosTexto={setResultadosTexto}
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
                  <img src={c.imagemUrl} alt={c.nome} className="h-12 w-12 shrink-0 rounded-lg object-cover" style={{ objectPosition: c.imagemFoco || "50% 50%" }} />
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
  const [imagemFoco, setImagemFoco] = useState(item.imagemFoco || "50% 50%");
  const [descricao, setDescricao] = useState(item.descricao || "");
  const [descricaoCompleta, setDescricaoCompleta] = useState(item.descricaoCompleta || "");
  const [botaoTexto, setBotaoTexto] = useState(item.botaoTexto || "");
  const [resultadosTexto, setResultadosTexto] = useState(resultadosParaTexto(item.resultados));
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    await fetch(`/api/cases/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        categoria: categoria || null,
        link: link || null,
        destaque,
        imagemUrl,
        imagemFoco: imagemFoco || null,
        descricao: descricao || null,
        descricaoCompleta: descricaoCompleta || null,
        botaoTexto: botaoTexto || null,
        resultados: textoParaResultados(resultadosTexto),
      }),
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
        imagemFoco={imagemFoco}
        setImagemFoco={setImagemFoco}
        descricao={descricao}
        setDescricao={setDescricao}
        descricaoCompleta={descricaoCompleta}
        setDescricaoCompleta={setDescricaoCompleta}
        botaoTexto={botaoTexto}
        setBotaoTexto={setBotaoTexto}
        resultadosTexto={resultadosTexto}
        setResultadosTexto={setResultadosTexto}
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
