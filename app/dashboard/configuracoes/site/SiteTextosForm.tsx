"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadImagem } from "@/components/ui/UploadImagem";
import { FocoImagem } from "@/components/ui/FocoImagem";

type Indicador = { valor: string; legenda: string };
type ImagemGaleria = { url: string; foco: string };

type ConfigSite = {
  siteHeroTitulo: string | null;
  siteHeroSubtitulo: string | null;
  siteHeroTituloDestaque: string | null;
  siteHeroImagemUrl: string | null;
  siteHeroImagemUrlMobile: string | null;
  siteHeroFoco: string | null;
  siteHeroIndicadores: Indicador[] | null;
  siteHeroGaleria: ImagemGaleria[] | null;
  siteSobreTexto: string | null;
  siteSobreImagemUrl: string | null;
  siteSobreImagemUrlMobile: string | null;
  siteSobreFoco: string | null;
  siteSobreBotaoTexto: string | null;
  siteSobreBotaoUrl: string | null;
  siteRodapeRegiao: string | null;
  siteRodapeDireitos: string | null;
  siteRodapeTexto: string | null;
  siteCorTitulo: string | null;
  siteCorTexto: string | null;
};

const INDICADORES_VAZIOS: Indicador[] = [
  { valor: "", legenda: "" },
  { valor: "", legenda: "" },
  { valor: "", legenda: "" },
];

export default function SiteTextosForm({ config }: { config: ConfigSite }) {
  const router = useRouter();
  const [heroTitulo, setHeroTitulo] = useState(config.siteHeroTitulo || "");
  const [heroSubtitulo, setHeroSubtitulo] = useState(config.siteHeroSubtitulo || "");
  const [heroTituloDestaque, setHeroTituloDestaque] = useState(config.siteHeroTituloDestaque || "");
  const [heroImagemUrl, setHeroImagemUrl] = useState<string | null>(config.siteHeroImagemUrl);
  const [heroImagemUrlMobile, setHeroImagemUrlMobile] = useState<string | null>(config.siteHeroImagemUrlMobile);
  const [heroFoco, setHeroFoco] = useState(config.siteHeroFoco || "50% 50%");
  const [indicadores, setIndicadores] = useState<Indicador[]>(
    config.siteHeroIndicadores && config.siteHeroIndicadores.length === 3 ? config.siteHeroIndicadores : INDICADORES_VAZIOS
  );
  const [galeria, setGaleria] = useState<ImagemGaleria[]>(config.siteHeroGaleria || []);
  const [sobreTexto, setSobreTexto] = useState(config.siteSobreTexto || "");
  const [sobreImagemUrl, setSobreImagemUrl] = useState<string | null>(config.siteSobreImagemUrl);
  const [sobreImagemUrlMobile, setSobreImagemUrlMobile] = useState<string | null>(config.siteSobreImagemUrlMobile);
  const [sobreFoco, setSobreFoco] = useState(config.siteSobreFoco || "50% 50%");
  const [sobreBotaoTexto, setSobreBotaoTexto] = useState(config.siteSobreBotaoTexto || "");
  const [sobreBotaoUrl, setSobreBotaoUrl] = useState(config.siteSobreBotaoUrl || "");
  const [rodapeRegiao, setRodapeRegiao] = useState(config.siteRodapeRegiao || "");
  const [rodapeDireitos, setRodapeDireitos] = useState(config.siteRodapeDireitos || "");
  const [rodapeTexto, setRodapeTexto] = useState(config.siteRodapeTexto || "");
  const [corTitulo, setCorTitulo] = useState(config.siteCorTitulo || "#FFFFFF");
  const [corTexto, setCorTexto] = useState(config.siteCorTexto || "#FFFFFF");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function atualizarIndicador(i: number, campo: keyof Indicador, valor: string) {
    setIndicadores((prev) => prev.map((ind, idx) => (idx === i ? { ...ind, [campo]: valor } : ind)));
  }

  function atualizarGaleriaUrl(i: number, url: string | null) {
    setGaleria((prev) => prev.map((item, idx) => (idx === i ? { ...item, url: url || "" } : item)));
  }

  function atualizarGaleriaFoco(i: number, foco: string) {
    setGaleria((prev) => prev.map((item, idx) => (idx === i ? { ...item, foco } : item)));
  }

  function adicionarFotoGaleria() {
    setGaleria((prev) => [...prev, { url: "", foco: "50% 50%" }]);
  }

  function removerFotoGaleria(i: number) {
    setGaleria((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    const indicadoresPreenchidos = indicadores.filter((i) => i.valor.trim() && i.legenda.trim());
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteHeroTitulo: heroTitulo || null,
        siteHeroSubtitulo: heroSubtitulo || null,
        siteHeroTituloDestaque: heroTituloDestaque || null,
        siteHeroImagemUrl: heroImagemUrl,
        siteHeroImagemUrlMobile: heroImagemUrlMobile,
        siteHeroFoco: heroFoco || null,
        siteHeroIndicadores: indicadoresPreenchidos.length > 0 ? indicadoresPreenchidos : [],
        siteHeroGaleria: galeria.filter((g) => g.url.trim()),
        siteSobreTexto: sobreTexto || null,
        siteSobreImagemUrl: sobreImagemUrl,
        siteSobreImagemUrlMobile: sobreImagemUrlMobile,
        siteSobreFoco: sobreFoco || null,
        siteSobreBotaoTexto: sobreBotaoTexto || null,
        siteSobreBotaoUrl: sobreBotaoUrl || null,
        siteRodapeRegiao: rodapeRegiao || null,
        siteRodapeDireitos: rodapeDireitos || null,
        siteRodapeTexto: rodapeTexto || null,
        siteCorTitulo: corTitulo || null,
        siteCorTexto: corTexto || null,
      }),
    });
    setSalvando(false);
    setSalvo(true);
    router.refresh();
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card/60 p-5">
      <div>
        <p className="mb-3 text-sm font-medium text-text">Abertura do site (Hero) — aparece por cima do banner de fundo</p>
        <Label>Frase de impacto (título principal)</Label>
        <Textarea
          value={heroTitulo}
          onChange={(e) => setHeroTitulo(e.target.value)}
          rows={2}
          placeholder="Ideias que viram conteúdo. Conteúdo que vira resultado."
          className="mb-3"
        />
        <Label>Palavra ou trecho em dourado dentro do título (opcional)</Label>
        <Input
          value={heroTituloDestaque}
          onChange={(e) => setHeroTituloDestaque(e.target.value)}
          placeholder="resultado"
          className="mb-3"
        />
        <p className="mb-3 text-[11px] text-muted">
          Precisa ser um trecho que aparece exatamente igual dentro do título acima — essa parte fica dourada, o
          resto continua branco.
        </p>
        <Label>Subtítulo (linha de apoio, embaixo do título)</Label>
        <Textarea
          value={heroSubtitulo}
          onChange={(e) => setHeroSubtitulo(e.target.value)}
          rows={2}
          placeholder="Estratégia, produção e tráfego pago para negócios que querem crescer com consistência."
          className="mb-4"
        />

        <p className="mb-2 text-xs font-medium text-text">Indicadores abaixo dos botões (opcional, até 3)</p>
        <p className="mb-3 text-[11px] text-muted">
          Só aparecem no site quando os dois campos de um indicador estiverem preenchidos. Deixe todos vazios pra
          esconder a linha inteira até você ter números reais pra colocar.
        </p>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {indicadores.map((ind, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-base/40 p-2">
              <Input
                value={ind.valor}
                onChange={(e) => atualizarIndicador(i, "valor", e.target.value)}
                placeholder="+50"
                className="mb-1"
              />
              <Input
                value={ind.legenda}
                onChange={(e) => atualizarIndicador(i, "legenda", e.target.value)}
                placeholder="projetos entregues"
              />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-base/40 p-3">
          <p className="mb-1 text-xs font-medium text-text">Banner de fundo da abertura</p>
          <p className="mb-3 text-[11px] leading-relaxed text-muted">
            Imagem de fundo da primeira seção do site, atrás do título e do botão. Envie uma foto ou composição de
            equipamentos/produção audiovisual, <strong className="text-text">sem nenhum texto, botão ou legenda</strong> —
            tudo isso já é desenhado pelo site por cima da imagem. Deixe o assunto principal mais pro lado direito
            da foto, com espaço livre à esquerda pro título não cobrir nada importante.
          </p>
          <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted">
            <p>
              <span className="text-text">Tamanho recomendado:</span> 1920 × 1080px
            </p>
            <p>
              <span className="text-text">Proporção:</span> 16:9 (bem larga)
            </p>
            <p>
              <span className="text-text">Formatos aceitos:</span> JPG, PNG ou WebP
            </p>
            <p>
              <span className="text-text">Tamanho máximo do arquivo:</span> 8MB
            </p>
          </div>
          <p className="mb-2 text-[10px] text-muted/70">
            "Recomendado" é o ideal pra nitidez — imagens menores também funcionam, só podem ficar um pouco
            esticadas ou perder qualidade em telas grandes.
          </p>
          <UploadImagem value={heroImagemUrl} onChange={setHeroImagemUrl} pasta="site-hero" tamanhoRecomendado="1920 × 1080px" proporcao="16:9" />

          {heroImagemUrl && (
            <div className="mt-3">
              <Label>Ponto de enquadramento (o que fica visível quando a imagem é cortada)</Label>
              <FocoImagem imagemUrl={heroImagemUrl} valor={heroFoco} onChange={setHeroFoco} />
            </div>
          )}

          <div className="mt-4 border-t border-border/60 pt-3">
            <p className="mb-1 text-xs font-medium text-text">Imagem alternativa pro celular (opcional)</p>
            <p className="mb-2 text-[11px] text-muted">
              Se o recorte da imagem principal não ficar bom em telas estreitas, envie uma versão vertical só pro
              celular. Se não enviar, o celular usa a mesma imagem principal, cortada pelo ponto de enquadramento
              acima.
            </p>
            <p className="mb-2 text-[11px] text-muted">
              <span className="text-text">Tamanho recomendado:</span> 1080 × 1350px (proporção 4:5, vertical)
            </p>
            <UploadImagem
              value={heroImagemUrlMobile}
              onChange={setHeroImagemUrlMobile}
              pasta="site-hero-mobile"
              tamanhoRecomendado="1080 × 1350px"
              proporcao="4:5, vertical"
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-base/40 p-3">
          <p className="mb-1 text-xs font-medium text-text">Galeria de fotos do fundo (opcional)</p>
          <p className="mb-3 text-[11px] leading-relaxed text-muted">
            Envie 2 ou mais fotos aqui pra elas revezarem automaticamente como fundo da abertura, uma de cada vez,
            com um fade suave — tipo uma vitrine. Com pelo menos uma foto aqui, essa galeria substitui o banner
            único configurado acima. Deixe vazia pra manter o banner fixo de sempre.
          </p>
          <div className="flex flex-col gap-3">
            {galeria.map((foto, i) => (
              <div key={i} className="rounded-lg border border-border/60 bg-card/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Foto {i + 1}</p>
                  <Button variant="danger" size="sm" onClick={() => removerFotoGaleria(i)} title="Remover foto">
                    <Trash2 size={12} />
                  </Button>
                </div>
                <UploadImagem
                  value={foto.url || null}
                  onChange={(url) => atualizarGaleriaUrl(i, url)}
                  pasta="site-hero-galeria"
                  tamanhoRecomendado="1920 × 1080px"
                  proporcao="16:9"
                />
                {foto.url && (
                  <div className="mt-2">
                    <FocoImagem imagemUrl={foto.url} valor={foto.foco || "50% 50%"} onChange={(v) => atualizarGaleriaFoco(i, v)} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button variant="secondary" onClick={adicionarFotoGaleria} className="mt-3 w-full">
            <Plus size={14} /> Adicionar foto à galeria
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="mb-3 text-sm font-medium text-text">Seção "Quem somos" — texto aparece por cima do banner de fundo</p>
        <Label>Texto</Label>
        <Textarea
          value={sobreTexto}
          onChange={(e) => setSobreTexto(e.target.value)}
          rows={4}
          placeholder="A Instaby nasceu em Araras, SP..."
          className="mb-3"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Texto do botão</Label>
            <Input value={sobreBotaoTexto} onChange={(e) => setSobreBotaoTexto(e.target.value)} placeholder="Conheça nossa história" />
          </div>
          <div>
            <Label>Destino do botão</Label>
            <Input value={sobreBotaoUrl} onChange={(e) => setSobreBotaoUrl(e.target.value)} placeholder="deixe vazio pra usar o WhatsApp" />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-base/40 p-3">
          <p className="mb-1 text-xs font-medium text-text">Banner de fundo do "Quem somos"</p>
          <p className="mb-3 text-[11px] leading-relaxed text-muted">
            Ex: você trabalhando, gravando ou no dia a dia da agência.{" "}
            <strong className="text-text">Sem texto, botão ou legenda escritos na imagem</strong> — o texto acima já
            aparece por cima automaticamente.
          </p>
          <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted">
            <p>
              <span className="text-text">Tamanho recomendado:</span> 1920 × 1080px
            </p>
            <p>
              <span className="text-text">Proporção:</span> 16:9 (bem larga)
            </p>
            <p>
              <span className="text-text">Formatos aceitos:</span> JPG, PNG ou WebP
            </p>
            <p>
              <span className="text-text">Tamanho máximo do arquivo:</span> 8MB
            </p>
          </div>
          <UploadImagem
            value={sobreImagemUrl}
            onChange={setSobreImagemUrl}
            pasta="site-sobre"
            tamanhoRecomendado="1920 × 1080px"
            proporcao="16:9"
          />

          {sobreImagemUrl && (
            <div className="mt-3">
              <Label>Ponto de enquadramento</Label>
              <FocoImagem imagemUrl={sobreImagemUrl} valor={sobreFoco} onChange={setSobreFoco} />
            </div>
          )}

          <div className="mt-4 border-t border-border/60 pt-3">
            <p className="mb-1 text-xs font-medium text-text">Imagem alternativa pro celular (opcional)</p>
            <p className="mb-2 text-[11px] text-muted">Mesma lógica do Hero — se não enviar, usa a imagem principal.</p>
            <p className="mb-2 text-[11px] text-muted">
              <span className="text-text">Tamanho recomendado:</span> 1080 × 1350px (proporção 4:5, vertical)
            </p>
            <UploadImagem
              value={sobreImagemUrlMobile}
              onChange={setSobreImagemUrlMobile}
              pasta="site-sobre-mobile"
              tamanhoRecomendado="1080 × 1350px"
              proporcao="4:5, vertical"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="mb-1 text-sm font-medium text-text">Cor dos textos sobre os banners</p>
        <p className="mb-4 text-[11px] leading-relaxed text-muted">
          Controla de uma vez a cor de todo texto que fica em cima das fotos de fundo (abertura, "Quem somos" e
          chamada final) — título, subtítulo, legendas dos indicadores. Clique no quadrado pra escolher a cor, ou
          cole um código hex. Se sua foto de fundo for clara, mude pra uma cor escura aqui pra continuar legível.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Cor dos títulos</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={corTitulo}
                onChange={(e) => setCorTitulo(e.target.value)}
                className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border/60 bg-transparent p-1"
              />
              <Input value={corTitulo} onChange={(e) => setCorTitulo(e.target.value)} placeholder="#FFFFFF" />
            </div>
          </div>
          <div>
            <Label>Cor dos textos e legendas</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={corTexto}
                onChange={(e) => setCorTexto(e.target.value)}
                className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border/60 bg-transparent p-1"
              />
              <Input value={corTexto} onChange={(e) => setCorTexto(e.target.value)} placeholder="#FFFFFF" />
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-xl p-4" style={{ background: "linear-gradient(135deg, #2a2a2e, #0d0d0f)" }}>
          <p className="mb-1 text-sm font-semibold" style={{ color: corTitulo || "#FFFFFF" }}>
            Prévia do título
          </p>
          <p className="text-xs" style={{ color: corTexto || "#FFFFFF", opacity: 0.75 }}>
            Prévia do texto — é assim que vai aparecer sobre a foto de fundo.
          </p>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="mb-3 text-sm font-medium text-text">Rodapé</p>
        <Label>Região de atendimento</Label>
        <Input value={rodapeRegiao} onChange={(e) => setRodapeRegiao(e.target.value)} placeholder="Araras · Campinas · São Paulo" className="mb-3" />
        <Label>Direitos autorais (opcional — se vazio, usa o padrão com o ano atual)</Label>
        <Input value={rodapeDireitos} onChange={(e) => setRodapeDireitos(e.target.value)} placeholder="© 2026 Instaby Agência. Todos os direitos reservados." className="mb-3" />
        <Label>Frase institucional</Label>
        <Textarea
          value={rodapeTexto}
          onChange={(e) => setRodapeTexto(e.target.value)}
          rows={2}
          placeholder="Marketing digital com resultado de verdade."
        />
        <p className="mt-2 text-[11px] text-muted">
          Os ícones de redes sociais do rodapé usam os mesmos links configurados na aparência da página /link,
          mais abaixo nesta tela.
        </p>
      </div>

      <Button onClick={salvar} disabled={salvando} className="w-full">
        {salvo ? <Check size={14} /> : null} {salvando ? "Salvando..." : salvo ? "Salvo!" : "Salvar textos e imagens do site"}
      </Button>
    </div>
  );
}
