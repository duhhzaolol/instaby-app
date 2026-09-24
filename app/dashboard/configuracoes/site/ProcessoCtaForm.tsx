"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadImagem } from "@/components/ui/UploadImagem";
import { FocoImagem } from "@/components/ui/FocoImagem";

type Config = {
  siteProcessoTexto: string | null;
  siteProcessoBotaoTexto: string | null;
  siteProcessoBotaoUrl: string | null;
  siteProcessoImagemUrl: string | null;
  siteProcessoImagemUrlMobile: string | null;
  siteProcessoFoco: string | null;
  siteCtaTitulo: string | null;
  siteCtaTexto: string | null;
  siteCtaBotaoTexto: string | null;
  siteCtaImagemUrl: string | null;
  siteCtaImagemUrlMobile: string | null;
  siteCtaFoco: string | null;
};

export default function ProcessoCtaForm({ config }: { config: Config }) {
  const router = useRouter();
  const [processoTexto, setProcessoTexto] = useState(config.siteProcessoTexto || "");
  const [processoBotaoTexto, setProcessoBotaoTexto] = useState(config.siteProcessoBotaoTexto || "");
  const [processoBotaoUrl, setProcessoBotaoUrl] = useState(config.siteProcessoBotaoUrl || "");
  const [processoImagemUrl, setProcessoImagemUrl] = useState<string | null>(config.siteProcessoImagemUrl);
  const [processoImagemUrlMobile, setProcessoImagemUrlMobile] = useState<string | null>(config.siteProcessoImagemUrlMobile);
  const [processoFoco, setProcessoFoco] = useState(config.siteProcessoFoco || "50% 50%");
  const [ctaTitulo, setCtaTitulo] = useState(config.siteCtaTitulo || "");
  const [ctaTexto, setCtaTexto] = useState(config.siteCtaTexto || "");
  const [ctaBotaoTexto, setCtaBotaoTexto] = useState(config.siteCtaBotaoTexto || "");
  const [ctaImagemUrl, setCtaImagemUrl] = useState<string | null>(config.siteCtaImagemUrl);
  const [ctaImagemUrlMobile, setCtaImagemUrlMobile] = useState<string | null>(config.siteCtaImagemUrlMobile);
  const [ctaFoco, setCtaFoco] = useState(config.siteCtaFoco || "50% 50%");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteProcessoTexto: processoTexto || null,
        siteProcessoBotaoTexto: processoBotaoTexto || null,
        siteProcessoBotaoUrl: processoBotaoUrl || null,
        siteProcessoImagemUrl: processoImagemUrl,
        siteProcessoImagemUrlMobile: processoImagemUrlMobile,
        siteProcessoFoco: processoFoco || null,
        siteCtaTitulo: ctaTitulo || null,
        siteCtaTexto: ctaTexto || null,
        siteCtaBotaoTexto: ctaBotaoTexto || null,
        siteCtaImagemUrl: ctaImagemUrl,
        siteCtaImagemUrlMobile: ctaImagemUrlMobile,
        siteCtaFoco: ctaFoco || null,
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
        <p className="mb-3 text-sm font-medium text-text">Seção "Processo" (faixa vermelha escura)</p>
        <Label>Texto de apoio</Label>
        <Textarea
          value={processoTexto}
          onChange={(e) => setProcessoTexto(e.target.value)}
          rows={2}
          placeholder="Um processo simples, sem mistério, que coloca o seu negócio no caminho certo."
          className="mb-3"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Texto do botão</Label>
            <Input value={processoBotaoTexto} onChange={(e) => setProcessoBotaoTexto(e.target.value)} placeholder="Falar com um especialista" />
          </div>
          <div>
            <Label>Destino do botão</Label>
            <Input value={processoBotaoUrl} onChange={(e) => setProcessoBotaoUrl(e.target.value)} placeholder="deixe vazio pra usar o WhatsApp" />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-base/40 p-3">
          <p className="mb-1 text-xs font-medium text-text">Foto de fundo (opcional)</p>
          <p className="mb-3 text-[11px] leading-relaxed text-muted">
            Sem foto, a faixa continua só com o gradiente vermelho escuro de sempre. Com foto, ela aparece atrás
            desse mesmo gradiente (mais transparente) — o "vermelhinho" continua, só ganha uma imagem por trás.
          </p>
          <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted">
            <p>
              <span className="text-text">Tamanho recomendado:</span> 1920 × 1080px
            </p>
            <p>
              <span className="text-text">Proporção:</span> 16:9
            </p>
            <p>
              <span className="text-text">Formatos aceitos:</span> JPG, PNG ou WebP
            </p>
            <p>
              <span className="text-text">Tamanho máximo do arquivo:</span> 8MB
            </p>
          </div>
          <UploadImagem
            value={processoImagemUrl}
            onChange={setProcessoImagemUrl}
            pasta="site-processo"
            tamanhoRecomendado="1920 × 1080px"
            proporcao="16:9"
          />
          {processoImagemUrl && (
            <div className="mt-3">
              <Label>Ponto de enquadramento</Label>
              <FocoImagem imagemUrl={processoImagemUrl} valor={processoFoco} onChange={setProcessoFoco} />
            </div>
          )}
          <div className="mt-4 border-t border-border/60 pt-3">
            <p className="mb-1 text-xs font-medium text-text">Imagem alternativa pro celular (opcional)</p>
            <p className="mb-2 text-[11px] text-muted">
              <span className="text-text">Tamanho recomendado:</span> 1080 × 1350px (proporção 4:5, vertical)
            </p>
            <UploadImagem
              value={processoImagemUrlMobile}
              onChange={setProcessoImagemUrlMobile}
              pasta="site-processo-mobile"
              tamanhoRecomendado="1080 × 1350px"
              proporcao="4:5, vertical"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="mb-3 text-sm font-medium text-text">Chamada final (antes do rodapé)</p>
        <Label>Identificação/título</Label>
        <Input value={ctaTitulo} onChange={(e) => setCtaTitulo(e.target.value)} placeholder="Sua marca pode estar aqui também." className="mb-3" />
        <Label>Texto de apoio</Label>
        <Textarea
          value={ctaTexto}
          onChange={(e) => setCtaTexto(e.target.value)}
          rows={2}
          placeholder="Conta um pouco sobre seu negócio e a gente te mostra como pode ajudar."
          className="mb-3"
        />
        <Label>Texto do botão</Label>
        <Input value={ctaBotaoTexto} onChange={(e) => setCtaBotaoTexto(e.target.value)} placeholder="Chamar no WhatsApp" className="mb-4" />

        <div className="rounded-xl border border-border/60 bg-base/40 p-3">
          <p className="mb-1 text-xs font-medium text-text">Banner de fundo da chamada final</p>
          <p className="mb-3 text-[11px] leading-relaxed text-muted">
            Foto escura, ex: alguém usando o celular. Sem texto ou botão embutido — o título e o botão já aparecem
            por cima automaticamente.
          </p>
          <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted">
            <p>
              <span className="text-text">Tamanho recomendado:</span> 1600 × 1200px
            </p>
            <p>
              <span className="text-text">Proporção:</span> 4:3
            </p>
            <p>
              <span className="text-text">Formatos aceitos:</span> JPG, PNG ou WebP
            </p>
            <p>
              <span className="text-text">Tamanho máximo do arquivo:</span> 8MB
            </p>
          </div>
          <UploadImagem value={ctaImagemUrl} onChange={setCtaImagemUrl} pasta="site-cta" tamanhoRecomendado="1600 × 1200px" proporcao="4:3" />
          {ctaImagemUrl && (
            <div className="mt-3">
              <Label>Ponto de enquadramento</Label>
              <FocoImagem imagemUrl={ctaImagemUrl} valor={ctaFoco} onChange={setCtaFoco} />
            </div>
          )}
          <div className="mt-4 border-t border-border/60 pt-3">
            <p className="mb-1 text-xs font-medium text-text">Imagem alternativa pro celular (opcional)</p>
            <p className="mb-2 text-[11px] text-muted">
              <span className="text-text">Tamanho recomendado:</span> 1080 × 1350px (proporção 4:5, vertical)
            </p>
            <UploadImagem
              value={ctaImagemUrlMobile}
              onChange={setCtaImagemUrlMobile}
              pasta="site-cta-mobile"
              tamanhoRecomendado="1080 × 1350px"
              proporcao="4:5, vertical"
            />
          </div>
        </div>
      </div>

      <Button onClick={salvar} disabled={salvando} className="w-full">
        {salvo ? <Check size={14} /> : null} {salvando ? "Salvando..." : salvo ? "Salvo!" : "Salvar processo e chamada final"}
      </Button>
    </div>
  );
}
