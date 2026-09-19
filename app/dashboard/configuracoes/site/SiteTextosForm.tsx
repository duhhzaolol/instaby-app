"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadImagem } from "@/components/ui/UploadImagem";
import { FocoImagem } from "@/components/ui/FocoImagem";

type ConfigSite = {
  siteHeroTitulo: string | null;
  siteHeroSubtitulo: string | null;
  siteHeroImagemUrl: string | null;
  siteHeroImagemUrlMobile: string | null;
  siteHeroFoco: string | null;
  siteSobreTexto: string | null;
  siteSobreImagemUrl: string | null;
  siteSobreImagemUrlMobile: string | null;
  siteSobreFoco: string | null;
  siteRodapeTexto: string | null;
};

export default function SiteTextosForm({ config }: { config: ConfigSite }) {
  const router = useRouter();
  const [heroTitulo, setHeroTitulo] = useState(config.siteHeroTitulo || "");
  const [heroSubtitulo, setHeroSubtitulo] = useState(config.siteHeroSubtitulo || "");
  const [heroImagemUrl, setHeroImagemUrl] = useState<string | null>(config.siteHeroImagemUrl);
  const [heroImagemUrlMobile, setHeroImagemUrlMobile] = useState<string | null>(config.siteHeroImagemUrlMobile);
  const [heroFoco, setHeroFoco] = useState(config.siteHeroFoco || "50% 50%");
  const [sobreTexto, setSobreTexto] = useState(config.siteSobreTexto || "");
  const [sobreImagemUrl, setSobreImagemUrl] = useState<string | null>(config.siteSobreImagemUrl);
  const [sobreImagemUrlMobile, setSobreImagemUrlMobile] = useState<string | null>(config.siteSobreImagemUrlMobile);
  const [sobreFoco, setSobreFoco] = useState(config.siteSobreFoco || "50% 50%");
  const [rodapeTexto, setRodapeTexto] = useState(config.siteRodapeTexto || "");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteHeroTitulo: heroTitulo || null,
        siteHeroSubtitulo: heroSubtitulo || null,
        siteHeroImagemUrl: heroImagemUrl,
        siteHeroImagemUrlMobile: heroImagemUrlMobile,
        siteHeroFoco: heroFoco || null,
        siteSobreTexto: sobreTexto || null,
        siteSobreImagemUrl: sobreImagemUrl,
        siteSobreImagemUrlMobile: sobreImagemUrlMobile,
        siteSobreFoco: sobreFoco || null,
        siteRodapeTexto: rodapeTexto || null,
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
          placeholder="Sua marca merece mais do que postar por postar."
          className="mb-3"
        />
        <Label>Subtítulo (linha de apoio, embaixo do título)</Label>
        <Textarea
          value={heroSubtitulo}
          onChange={(e) => setHeroSubtitulo(e.target.value)}
          rows={2}
          placeholder="A Instaby cuida de estratégia, conteúdo e tráfego pago..."
          className="mb-4"
        />

        <div className="rounded-xl border border-border/60 bg-base/40 p-3">
          <p className="mb-1 text-xs font-medium text-text">Banner de fundo da abertura</p>
          <p className="mb-3 text-[11px] leading-relaxed text-muted">
            Imagem de fundo da primeira seção do site, atrás do título e do botão. Envie uma foto ou composição{" "}
            <strong className="text-text">sem nenhum texto, botão ou legenda</strong> — tudo isso já é desenhado
            pelo site por cima da imagem. Deixe o assunto principal (câmera, pessoa, tela) mais pro lado direito da
            foto, com espaço livre à esquerda pro título não cobrir nada importante.
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
      </div>

      <div className="border-t border-border pt-5">
        <p className="mb-3 text-sm font-medium text-text">Seção "Quem somos" — texto aparece por cima do banner de fundo</p>
        <Label>Texto</Label>
        <Textarea
          value={sobreTexto}
          onChange={(e) => setSobreTexto(e.target.value)}
          rows={4}
          placeholder="A Instaby nasceu em Araras, SP..."
          className="mb-4"
        />

        <div className="rounded-xl border border-border/60 bg-base/40 p-3">
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
        <p className="mb-3 text-sm font-medium text-text">Rodapé</p>
        <Label>Texto do rodapé (opcional — se vazio, usa o padrão com o ano atual)</Label>
        <Textarea
          value={rodapeTexto}
          onChange={(e) => setRodapeTexto(e.target.value)}
          rows={2}
          placeholder="© 2026 Instaby Agência. Todos os direitos reservados. · Araras · Campinas · São Paulo"
        />
      </div>

      <Button onClick={salvar} disabled={salvando} className="w-full">
        {salvo ? <Check size={14} /> : null} {salvando ? "Salvando..." : salvo ? "Salvo!" : "Salvar textos e imagens do site"}
      </Button>
    </div>
  );
}
