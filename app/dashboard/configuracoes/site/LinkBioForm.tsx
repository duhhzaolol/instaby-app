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
  descricao: string | null;
  url: string;
  imagemUrl: string | null;
  destaque: boolean;
  ordem: number;
};

function CampoLink({
  titulo,
  setTitulo,
  descricao,
  setDescricao,
  url,
  setUrl,
  destaque,
  setDestaque,
  imagemUrl,
  setImagemUrl,
}: {
  titulo: string;
  setTitulo: (v: string) => void;
  descricao: string;
  setDescricao: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  destaque: boolean;
  setDestaque: (v: boolean) => void;
  imagemUrl: string | null;
  setImagemUrl: (v: string | null) => void;
}) {
  return (
    <>
      <Label>Texto do link</Label>
      <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Falar no WhatsApp" className="mb-3" />
      <Label>Subtítulo (opcional)</Label>
      <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Atendimento rápido" className="mb-3" />
      <Label>Endereço (URL)</Label>
      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="mb-3" />
      <label className="mb-3 flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={destaque} onChange={(e) => setDestaque(e.target.checked)} />
        Card em destaque (aparece grande, com foto, no fim da lista)
      </label>
      <Label>Foto de capa (opcional)</Label>
      <UploadImagem
        value={imagemUrl}
        onChange={setImagemUrl}
        pasta="links-bio"
        tamanhoRecomendado={destaque ? "600 × 400px" : "200 × 200px"}
        proporcao={destaque ? "wide" : "quadrado"}
      />
    </>
  );
}

export default function LinkBioForm({
  links,
  introTexto: introTextoInicial,
  rodapeTexto: rodapeTextoInicial,
  imagemUrl: imagemUrlInicial,
  tagline: taglineInicial,
  tags: tagsInicial,
  instagram: instagramInicial,
  youtube: youtubeInicial,
  tiktok: tiktokInicial,
  linkedin: linkedinInicial,
}: {
  links: LinkBioItem[];
  introTexto: string;
  rodapeTexto: string;
  imagemUrl: string | null;
  tagline: string;
  tags: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  linkedin: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [url, setUrl] = useState("");
  const [destaque, setDestaque] = useState(false);
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [introTexto, setIntroTexto] = useState(introTextoInicial);
  const [rodapeTexto, setRodapeTexto] = useState(rodapeTextoInicial);
  const [heroImagemUrl, setHeroImagemUrl] = useState<string | null>(imagemUrlInicial);
  const [tagline, setTagline] = useState(taglineInicial);
  const [tags, setTags] = useState(tagsInicial);
  const [instagram, setInstagram] = useState(instagramInicial);
  const [youtube, setYoutube] = useState(youtubeInicial);
  const [tiktok, setTiktok] = useState(tiktokInicial);
  const [linkedin, setLinkedin] = useState(linkedinInicial);
  const [salvandoTextos, setSalvandoTextos] = useState(false);
  const [textosSalvos, setTextosSalvos] = useState(false);

  function limpar() {
    setTitulo("");
    setDescricao("");
    setUrl("");
    setDestaque(false);
    setImagemUrl(null);
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !url.trim()) return;
    setEnviando(true);
    await fetch("/api/links-bio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descricao: descricao || null, url, imagemUrl, destaque }),
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
        linkBioImagemUrl: heroImagemUrl || null,
        linkBioTagline: tagline || null,
        linkBioTags: tags || null,
        linkBioInstagram: instagram || null,
        linkBioYoutube: youtube || null,
        linkBioTiktok: tiktok || null,
        linkBioLinkedin: linkedin || null,
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
        <p className="mb-3 text-sm font-medium text-text">Aparência da página /link</p>

        <Label>Foto de topo (fundo do topo da página)</Label>
        <UploadImagem
          value={heroImagemUrl}
          onChange={setHeroImagemUrl}
          pasta="link-bio"
          tamanhoRecomendado="1080 × 1350px"
          proporcao="vertical"
        />

        <div className="mt-3">
          <Label>Tagline pequena (canto da foto, estilo assinatura)</Label>
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Mais que uma agência." className="mb-3" />
        </div>

        <Label>Frase de abertura (headline)</Label>
        <Textarea
          value={introTexto}
          onChange={(e) => setIntroTexto(e.target.value)}
          rows={2}
          placeholder="Estratégia, conteúdo e resultado de verdade."
          className="mb-3"
        />

        <Label>Linha de tags (opcional, em caixa alta)</Label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="MARCA · CONTEÚDO · TRÁFEGO · RESULTADO"
          className="mb-3"
        />

        <p className="mb-2 mt-4 text-xs font-medium text-muted">Redes sociais (deixe em branco pra não mostrar o ícone)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Instagram</Label>
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="mb-3" />
          </div>
          <div>
            <Label>YouTube</Label>
            <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/..." className="mb-3" />
          </div>
          <div>
            <Label>TikTok</Label>
            <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://tiktok.com/..." className="mb-3" />
          </div>
          <div>
            <Label>LinkedIn</Label>
            <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/..." className="mb-3" />
          </div>
        </div>

        <Label>Rodapé (opcional — se vazio, usa o padrão com o ano atual)</Label>
        <Textarea
          value={rodapeTexto}
          onChange={(e) => setRodapeTexto(e.target.value)}
          rows={2}
          placeholder="Marketing digital com resultado de verdade."
          className="mb-3"
        />

        <Button onClick={salvarTextos} disabled={salvandoTextos} size="sm" className="w-full">
          {textosSalvos ? <Check size={14} /> : null} {salvandoTextos ? "Salvando..." : textosSalvos ? "Salvo!" : "Salvar aparência"}
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
          <CampoLink
            titulo={titulo}
            setTitulo={setTitulo}
            descricao={descricao}
            setDescricao={setDescricao}
            url={url}
            setUrl={setUrl}
            destaque={destaque}
            setDestaque={setDestaque}
            imagemUrl={imagemUrl}
            setImagemUrl={setImagemUrl}
          />
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
                  <p className="truncate text-sm font-medium text-text">
                    {l.titulo} {l.destaque && <span className="ml-1 text-[10px] text-accent">· destaque</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{l.descricao || l.url}</p>
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
  const [descricao, setDescricao] = useState(item.descricao || "");
  const [url, setUrl] = useState(item.url);
  const [destaque, setDestaque] = useState(item.destaque);
  const [imagemUrl, setImagemUrl] = useState<string | null>(item.imagemUrl);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    await fetch(`/api/links-bio/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descricao: descricao || null, url, imagemUrl, destaque }),
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
      <CampoLink
        titulo={titulo}
        setTitulo={setTitulo}
        descricao={descricao}
        setDescricao={setDescricao}
        url={url}
        setUrl={setUrl}
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
