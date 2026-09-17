"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadImagem } from "@/components/ui/UploadImagem";

type ConfigSite = {
  siteHeroTitulo: string | null;
  siteHeroSubtitulo: string | null;
  siteHeroImagemUrl: string | null;
  siteSobreTexto: string | null;
  siteSobreImagemUrl: string | null;
  siteRodapeTexto: string | null;
};

export default function SiteTextosForm({ config }: { config: ConfigSite }) {
  const router = useRouter();
  const [heroTitulo, setHeroTitulo] = useState(config.siteHeroTitulo || "");
  const [heroSubtitulo, setHeroSubtitulo] = useState(config.siteHeroSubtitulo || "");
  const [heroImagemUrl, setHeroImagemUrl] = useState<string | null>(config.siteHeroImagemUrl);
  const [sobreTexto, setSobreTexto] = useState(config.siteSobreTexto || "");
  const [sobreImagemUrl, setSobreImagemUrl] = useState<string | null>(config.siteSobreImagemUrl);
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
        siteSobreTexto: sobreTexto || null,
        siteSobreImagemUrl: sobreImagemUrl,
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
        <p className="mb-3 text-sm font-medium text-text">Abertura do site (Hero)</p>
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
          className="mb-3"
        />
        <Label>Imagem de abertura (opcional)</Label>
        <UploadImagem
          value={heroImagemUrl}
          onChange={setHeroImagemUrl}
          pasta="site-hero"
          tamanhoRecomendado="1600 × 1200px"
          proporcao="4:3"
        />
      </div>

      <div className="border-t border-border pt-5">
        <p className="mb-3 text-sm font-medium text-text">Seção "Quem somos"</p>
        <Label>Texto</Label>
        <Textarea
          value={sobreTexto}
          onChange={(e) => setSobreTexto(e.target.value)}
          rows={4}
          placeholder="A Instaby nasceu em Araras, SP..."
          className="mb-3"
        />
        <Label>Foto (opcional — ex: você trabalhando/gravando)</Label>
        <UploadImagem
          value={sobreImagemUrl}
          onChange={setSobreImagemUrl}
          pasta="site-sobre"
          tamanhoRecomendado="900 × 1100px"
          proporcao="retrato"
        />
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
