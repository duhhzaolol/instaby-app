"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Instagram,
  Youtube,
  Linkedin,
  Megaphone,
  Video,
  Film,
  LayoutTemplate,
  MapPin,
  Lightbulb,
  Smartphone,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  TrendingUp,
} from "lucide-react";
import { CinematicIntro } from "./CinematicIntro";
import { PilaresCarroChefe } from "./PilaresCarroChefe";
import { AlbunsCarrossel } from "./AlbunsCarrossel";
import { MapaAtuacao } from "./MapaAtuacao";
import { ElementoFlutuante, SvgRec, IconeFlutuanteMini } from "./FloatingGear";

const ICONES_SERVICOS = [Instagram, Megaphone, Video, Film, LayoutTemplate, MapPin, Lightbulb, Smartphone];

const SERVICOS_PADRAO = [
  { nome: "Social Media", descricao: "Planejamento, conteúdo e gestão de redes sociais no dia a dia.", destino: "#servicos" },
  { nome: "Tráfego Pago", descricao: "Campanhas no Meta Ads e Google Ads com foco em resultado real.", destino: "#servicos" },
  { nome: "Captação de vídeo", descricao: "Produção em estúdio ou externa, com equipamento e direção.", destino: "#servicos" },
  { nome: "Edição de vídeo", descricao: "Cortes, Reels e vídeos institucionais com identidade da marca.", destino: "#servicos" },
  { nome: "Landing Pages", descricao: "Páginas rápidas, responsivas e pensadas pra converter.", destino: "#servicos" },
  { nome: "Google Meu Negócio", descricao: "Presença local otimizada — avaliações, fotos e posicionamento.", destino: "#servicos" },
  { nome: "Consultoria", descricao: "Diagnóstico e direção estratégica pro marketing do seu negócio.", destino: "#servicos" },
  { nome: "Apps e soluções digitais", descricao: "Ferramentas e sistemas sob medida pra necessidades específicas.", destino: "#servicos" },
];

const DIFERENCIAIS_PADRAO = [
  { titulo: "Proximidade", texto: "Atendimento direto e humano." },
  { titulo: "Agilidade", texto: "Do planejamento à execução." },
  { titulo: "Transparência", texto: "Relatórios claros e sem enrolação." },
  { titulo: "Foco em resultado", texto: "Tudo com um propósito: o crescimento do seu negócio." },
];

const PROCESSO = [
  { passo: "01", titulo: "Diagnóstico", texto: "Entendemos seu negócio, seu público e onde você quer chegar." },
  { passo: "02", titulo: "Estratégia", texto: "Montamos o plano — conteúdo, tráfego, ou os dois — com metas claras." },
  { passo: "03", titulo: "Execução", texto: "Produção, publicação e gestão de campanhas no ritmo combinado." },
  { passo: "04", titulo: "Acompanhamento", texto: "Relatórios periódicos e ajuste de rota conforme os resultados." },
];

const PILARES_PADRAO: Pilar[] = [
  {
    nome: "Tráfego Pago",
    texto:
      "Campanhas no Meta Ads e Google Ads com estratégia, teste e otimização constante — o motor que traz cliente novo pro seu negócio todos os dias.",
    indicadores: [],
  },
  {
    nome: "Criação de Conteúdo",
    texto: "Planejamento e produção de conteúdo com identidade — o que sua marca fala, mostra e posta no dia a dia.",
  },
  {
    nome: "Captação",
    texto: "Fotos e vídeos com direção e equipamento profissional — em estúdio ou externa, prontos pra virar conteúdo e campanha.",
  },
];

const NAV = [
  { label: "Início", href: "#inicio" },
  { label: "Serviços", href: "#servicos" },
  { label: "Álbuns", href: "#portfolio" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

// Aplica opacidade a uma cor hex (#RRGGBB), virando rgba(...) — usado nos textos
// sobre os banners (Hero/Sobre/Contato final), que sempre têm uma versão "suave"
// (subtítulo, legenda) além da cor cheia do título.
function comAlpha(hex: string, alpha: number) {
  const limpo = (hex || "#FFFFFF").replace("#", "");
  const valido = /^[0-9a-fA-F]{6}$/.test(limpo) ? limpo : "FFFFFF";
  const r = parseInt(valido.slice(0, 2), 16);
  const g = parseInt(valido.slice(2, 4), 16);
  const b = parseInt(valido.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Divide um título em [antes, trecho em destaque, depois] pra pintar o trecho de dourado.
function partirTitulo(titulo: string, destaque?: string | null) {
  if (!destaque) return { antes: titulo, meio: "", depois: "" };
  const idx = titulo.toLowerCase().indexOf(destaque.toLowerCase());
  if (idx === -1) return { antes: titulo, meio: "", depois: "" };
  return {
    antes: titulo.slice(0, idx),
    meio: titulo.slice(idx, idx + destaque.length),
    depois: titulo.slice(idx + destaque.length),
  };
}

// Grade neon sutil, reaproveitada em algumas seções escuras pra dar continuidade
// visual com a abertura cinematográfica (câmera) lá no topo.
function GradeNeon() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(230,57,70,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(230,57,70,0.6) 1px, transparent 1px)",
        backgroundSize: "46px 46px",
      }}
    />
  );
}

type Indicador = { valor: string; legenda: string };
type ServicoOverride = { nome: string; descricao: string; destino: string; imagemUrl?: string | null; foco?: string | null };
type DiferencialOverride = { titulo: string; texto: string };
type Resultado = { valor: string; legenda: string };
type Pilar = { nome: string; texto: string; indicadores?: Indicador[] };
type ImagemGaleria = { url: string; foco?: string | null };
type LocalMapa = { nome: string };

type CaseTrabalho = {
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
};

export function LandingPage({
  logos,
  depoimentos,
  whatsappAgencia,
  heroTitulo,
  heroSubtitulo,
  heroTituloDestaque,
  heroImagemUrl,
  heroImagemUrlMobile,
  heroFoco,
  heroIndicadores,
  servicos,
  diferenciais,
  sobreTexto,
  sobreImagemUrl,
  sobreImagemUrlMobile,
  sobreFoco,
  sobreBotaoTexto,
  sobreBotaoUrl,
  processoTexto,
  processoBotaoTexto,
  processoBotaoUrl,
  processoImagemUrl,
  processoImagemUrlMobile,
  processoFoco,
  ctaTitulo,
  ctaTexto,
  ctaBotaoTexto,
  ctaImagemUrl,
  ctaImagemUrlMobile,
  ctaFoco,
  rodapeRegiao,
  rodapeDireitos,
  rodapeTexto,
  corTitulo,
  corTexto,
  instagram,
  youtube,
  tiktok,
  linkedin,
  cases,
  aberturaTitulo,
  aberturaSubtitulo,
  pilares,
  albunsTitulo,
  albunsTexto,
  heroGaleria,
  mapaTitulo,
  mapaTexto,
  mapaLocais,
}: {
  logos: { nome: string; logoUrl: string }[];
  depoimentos: { id: string; nomeCliente: string; texto: string }[];
  whatsappAgencia: string | null;
  heroTitulo?: string | null;
  heroSubtitulo?: string | null;
  heroTituloDestaque?: string | null;
  heroImagemUrl?: string | null;
  heroImagemUrlMobile?: string | null;
  heroFoco?: string | null;
  heroIndicadores?: Indicador[] | null;
  servicos?: ServicoOverride[] | null;
  diferenciais?: DiferencialOverride[] | null;
  sobreTexto?: string | null;
  sobreImagemUrl?: string | null;
  sobreImagemUrlMobile?: string | null;
  sobreFoco?: string | null;
  sobreBotaoTexto?: string | null;
  sobreBotaoUrl?: string | null;
  processoTexto?: string | null;
  processoBotaoTexto?: string | null;
  processoBotaoUrl?: string | null;
  processoImagemUrl?: string | null;
  processoImagemUrlMobile?: string | null;
  processoFoco?: string | null;
  ctaTitulo?: string | null;
  ctaTexto?: string | null;
  ctaBotaoTexto?: string | null;
  ctaImagemUrl?: string | null;
  ctaImagemUrlMobile?: string | null;
  ctaFoco?: string | null;
  rodapeRegiao?: string | null;
  rodapeDireitos?: string | null;
  rodapeTexto?: string | null;
  corTitulo?: string | null;
  corTexto?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  cases?: CaseTrabalho[];
  aberturaTitulo?: string | null;
  aberturaSubtitulo?: string | null;
  pilares?: Pilar[] | null;
  albunsTitulo?: string | null;
  albunsTexto?: string | null;
  heroGaleria?: ImagemGaleria[] | null;
  mapaTitulo?: string | null;
  mapaTexto?: string | null;
  mapaLocais?: LocalMapa[] | null;
}) {
  const [menuAberto, setMenuAberto] = useState(false);

  // Cabeçalho flutua transparente sobre o Hero (uma cena só com a foto, sem
  // barra separada por cima) e só ganha fundo sólido depois que a pessoa rola
  // uma distância pra dentro da seção — nunca enquanto a abertura cinematográfica
  // ainda cobre a tela (ela já fica na frente do cabeçalho, com z-index maior).
  const heroRef = useRef<HTMLElement>(null);
  const [cabecalhoSolido, setCabecalhoSolido] = useState(false);
  useEffect(() => {
    function aoRolar() {
      const el = heroRef.current;
      if (!el) return;
      setCabecalhoSolido(el.getBoundingClientRect().top < -120);
    }
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, []);

  // Galeria de fundo do Hero — com 2+ fotos válidas, revezam com fade lento;
  // com 0 ou 1, cai no comportamento antigo (heroImagemUrl fixa), então sites
  // que ainda não configuraram a galeria continuam exatamente como estavam.
  const galeriaValida = (heroGaleria || []).filter((g) => g.url?.trim());
  const usaGaleria = galeriaValida.length > 0;
  const [indiceGaleria, setIndiceGaleria] = useState(0);
  useEffect(() => {
    if (galeriaValida.length < 2) return;
    const t = setInterval(() => setIndiceGaleria((i) => (i + 1) % galeriaValida.length), 5000);
    return () => clearInterval(t);
  }, [galeriaValida.length]);

  const linkWhatsapp = whatsappAgencia
    ? `https://wa.me/${whatsappAgencia}?text=${encodeURIComponent("Olá! Vim pelo site da Instaby e queria saber mais sobre os serviços.")}`
    : null;

  const titulo = heroTitulo || "Ideias que viram conteúdo. Conteúdo que vira resultado.";
  const subtitulo =
    heroSubtitulo ||
    "Estratégia, produção e tráfego pago para negócios que querem crescer com consistência.";
  const { antes, meio, depois } = partirTitulo(titulo, heroTituloDestaque);
  // Cor dos textos que ficam sobre os banners (Hero/Sobre/Contato final) — configurável
  // no painel. Aplicada via style (não só classe do Tailwind), pra nunca depender de
  // opacidade de classe e sempre garantir o contraste que você escolher.
  const corTituloFinal = corTitulo || "#FFFFFF";
  const corTextoFinal = corTexto || "#FFFFFF";
  const heroFocoFinal = heroFoco || "50% 50%";
  const sobreFocoFinal = sobreFoco || "50% 50%";
  const ctaFocoFinal = ctaFoco || "50% 50%";
  const processoFocoFinal = processoFoco || "50% 50%";
  const indicadoresValidos = (heroIndicadores || []).filter((i) => i.valor?.trim() && i.legenda?.trim());

  const servicosFinal = SERVICOS_PADRAO.map((padrao, i) => ({
    nome: servicos?.[i]?.nome || padrao.nome,
    descricao: servicos?.[i]?.descricao || padrao.descricao,
    destino: servicos?.[i]?.destino || padrao.destino,
    imagemUrl: servicos?.[i]?.imagemUrl || null,
    foco: servicos?.[i]?.foco || "50% 50%",
    icone: ICONES_SERVICOS[i],
  }));

  const diferenciaisFinal = DIFERENCIAIS_PADRAO.map((padrao, i) => ({
    titulo: diferenciais?.[i]?.titulo || padrao.titulo,
    texto: diferenciais?.[i]?.texto || padrao.texto,
  }));

  const pilaresFinal: Pilar[] = PILARES_PADRAO.map((padrao, i) => ({
    nome: pilares?.[i]?.nome || padrao.nome,
    texto: pilares?.[i]?.texto || padrao.texto,
    indicadores: pilares?.[i]?.indicadores?.length ? pilares![i].indicadores : padrao.indicadores,
  }));

  const textoSobre =
    sobreTexto ||
    "A Instaby nasceu em Araras, SP, com um jeito direto de trabalhar: entender o negócio do cliente antes de qualquer criativo ou campanha, e acompanhar de perto cada resultado. Cuidamos de social media, tráfego pago, produção de vídeo e presença digital — sempre com a estratégia guiando a execução.";
  const sobreBotaoTextoFinal = sobreBotaoTexto || "Conheça nossa história";
  const sobreBotaoUrlFinal = sobreBotaoUrl || linkWhatsapp || "#contato";

  const processoTextoFinal =
    processoTexto || "Um processo simples, sem mistério, que coloca o seu negócio no caminho certo.";
  const processoBotaoTextoFinal = processoBotaoTexto || "Falar com um especialista";
  const processoBotaoUrlFinal = processoBotaoUrl || linkWhatsapp || "#contato";

  const ctaTituloFinal = ctaTitulo || "Sua marca pode estar aqui também.";
  const ctaTextoFinal = ctaTexto || "Conta um pouco sobre seu negócio e a gente te mostra como pode ajudar.";
  const ctaBotaoTextoFinal = ctaBotaoTexto || "Chamar no WhatsApp";

  const temSociais = instagram || youtube || tiktok || linkedin;
  const linkContatoPilar = linkWhatsapp || "#contato";

  return (
    <div className="min-h-screen bg-base text-text">
      {/* Abertura — ícones flutuando convergem e formam o logo conforme rola um pouco */}
      <CinematicIntro titulo={aberturaTitulo} subtitulo={aberturaSubtitulo} />

      {/* Cabeçalho — fixo e transparente sobre o Hero (uma cena só, sem barra
          separada por cima); ganha fundo e linha inferior só depois que rola
          um pouco pra dentro da página, longe da foto de abertura. */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
          cabecalhoSolido ? "border-b border-border/60 bg-base/90 backdrop-blur-md" : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#inicio" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
          </a>

          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors hover:text-text">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {linkWhatsapp && (
              <a
                href={linkWhatsapp}
                target="_blank"
                className="flex items-center gap-2 rounded-full border border-accent px-4 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
              >
                <MessageCircle size={14} /> Falar no WhatsApp
              </a>
            )}
          </div>

          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted md:hidden"
          >
            {menuAberto ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {menuAberto && (
          <div className="max-h-[80vh] overflow-y-auto border-t border-border/60 bg-base px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-3 text-sm">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} onClick={() => setMenuAberto(false)} className="text-muted hover:text-text">
                  {n.label}
                </a>
              ))}
              {linkWhatsapp && (
                <a
                  href={linkWhatsapp}
                  target="_blank"
                  className="mt-1 flex items-center justify-center gap-2 rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent"
                >
                  <MessageCircle size={14} /> Falar no WhatsApp
                </a>
              )}
              <Link href="/app" className="text-xs text-muted/70 hover:text-muted">
                Entrar no painel
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero — banner ocupa a seção inteira, de ponta a ponta; texto sempre por
          cima. Começa exatamente no topo (o cabeçalho flutua por cima,
          transparente) pra virar "uma coisa só" com o cabeçalho, em vez de uma
          barra sobre um banner separado. */}
      <motion.section
        id="inicio"
        ref={heroRef}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full overflow-hidden"
      >
        {usaGaleria ? (
          <>
            {galeriaValida.map((g, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={g.url + i}
                src={g.url}
                alt="Instaby"
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out"
                style={{ objectPosition: g.foco || "50% 50%", opacity: i === indiceGaleria ? 1 : 0 }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </>
        ) : heroImagemUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImagemUrlMobile || heroImagemUrl}
              alt="Instaby"
              className="absolute inset-0 h-full w-full object-cover sm:hidden"
              style={{ objectPosition: heroFocoFinal }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImagemUrl}
              alt="Instaby"
              className="absolute inset-0 hidden h-full w-full object-cover sm:block"
              style={{ objectPosition: heroFocoFinal }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at top left, rgba(230,57,70,0.25), transparent 65%), #131519" }}
          />
        )}
        {/* reforço de legibilidade pro cabeçalho, que flutua transparente por cima —
            garante contraste em qualquer foto, independente do degradê do texto
            (mais forte à esquerda) */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />
        {/* transição suave pro tom da seção seguinte — sem corte seco entre o
            banner do Hero e o fundo escuro logo abaixo */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-base sm:h-32" />

        <div className="relative z-10 mx-auto flex min-h-[560px] max-w-6xl flex-col justify-center gap-5 px-6 py-20 sm:min-h-[680px] sm:py-28">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent backdrop-blur"
            >
              <Sparkles size={12} /> Marketing digital com resultado de verdade
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="mb-5 whitespace-pre-line text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
              style={{ color: corTituloFinal }}
            >
              {antes}
              {meio && <span className="text-amber-400">{meio}</span>}
              {depois}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mb-9 max-w-xl text-base leading-relaxed sm:text-lg"
              style={{ color: comAlpha(corTextoFinal, 0.75) }}
            >
              {subtitulo}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-3"
            >
              {linkWhatsapp && (
                <a
                  href={linkWhatsapp}
                  target="_blank"
                  className="relative flex items-center gap-2 overflow-hidden rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02]"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/2 animate-streak-sweep bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18)_40%,rgba(255,255,255,0.85)_50%,rgba(255,255,255,0.18)_60%,transparent)]"
                  />
                  <MessageCircle size={16} /> Falar no WhatsApp
                </a>
              )}
              <a
                href="#servicos"
                className="flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:border-white/40 hover:text-white"
              >
                Ver serviços <ArrowRight size={14} />
              </a>
            </motion.div>

            {indicadoresValidos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3"
              >
                {indicadoresValidos.map((ind, i) => (
                  <div key={i}>
                    <p className="text-xl font-semibold" style={{ color: corTituloFinal }}>
                      {ind.valor}
                    </p>
                    <p className="text-xs" style={{ color: comAlpha(corTextoFinal, 0.6) }}>
                      {ind.legenda}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        <motion.a
          href="#servicos"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="absolute bottom-6 right-6 z-10 hidden items-center gap-1.5 text-xs text-white/50 hover:text-white/80 sm:flex"
        >
          role para explorar <ChevronDown size={13} className="animate-bounce" />
        </motion.a>
      </motion.section>

      {/* Pilares — os 3 carros-chefe, Tráfego Pago em destaque */}
      <PilaresCarroChefe pilares={pilaresFinal} linkContato={linkContatoPilar} />

      {/* Serviços — o restante do que a Instaby faz, sem depender de foto */}
      <section id="servicos" className="relative overflow-hidden bg-base px-6 py-16">
        <GradeNeon />
        <ElementoFlutuante className="right-[5%] top-[10%] hidden lg:block" duracao={8}>
          <SvgRec />
        </ElementoFlutuante>
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <motion.p {...fadeUp()} className="mb-2 text-xs font-medium uppercase tracking-wider text-accent">
                E também
              </motion.p>
              <motion.h2 {...fadeUp(0.05)} className="text-2xl font-semibold sm:text-3xl">
                Tudo o que sua marca precisa, num só lugar
              </motion.h2>
            </div>
            <motion.div {...fadeUp(0.1)} className="max-w-xs sm:text-right">
              <p className="mb-2 text-xs leading-relaxed text-muted">
                Do planejamento à execução — cada serviço pensado pra somar com os outros, não pra funcionar sozinho.
              </p>
            </motion.div>
          </div>
          {/* Celular: carrossel horizontal com swipe — a mesma grade 4×2 virava lista gigante */}
          <p className="mb-2 text-[10px] uppercase tracking-wider text-muted/50 sm:hidden">Deslize pra ver mais →</p>
          <div className="-mx-6 mb-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 sm:hidden">
            {servicosFinal.map((s, i) => {
              const Icon = s.icone;
              return (
                <a
                  key={i}
                  href={s.destino}
                  target={s.destino.startsWith("http") ? "_blank" : undefined}
                  className="group relative aspect-[3/4] w-[68%] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 active:border-accent/40"
                >
                  {s.imagemUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.imagemUrl}
                        alt={s.nome}
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ objectPosition: s.foco || "50% 50%" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
                      <div className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-accent backdrop-blur-sm">
                        <Icon size={13} />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-3.5">
                        <p className="text-sm font-medium text-white">{s.nome}</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/60">{s.descricao}</p>
                        <span className="mt-2 block h-0.5 w-7 rounded-full bg-accent" />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-br from-[#18191d] via-[#131418] to-[#0e0f12] p-3.5">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full opacity-70 blur-2xl"
                        style={{ background: "radial-gradient(circle, rgba(230,57,70,0.3), transparent 70%)" }}
                      />
                      <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent shadow-[0_0_18px_-6px_rgba(230,57,70,0.55)]">
                        <Icon size={20} />
                      </span>
                      <div className="relative">
                        <p className="text-sm font-medium text-white">{s.nome}</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/55">{s.descricao}</p>
                        <span className="mt-2 block h-0.5 w-7 rounded-full bg-accent" />
                      </div>
                    </div>
                  )}
                </a>
              );
            })}
          </div>

          {/* Tablet/desktop: grade de sempre */}
          <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {servicosFinal.map((s, i) => {
              const Icon = s.icone;
              return (
                <motion.a
                  key={i}
                  href={s.destino}
                  target={s.destino.startsWith("http") ? "_blank" : undefined}
                  {...fadeUp((i % 4) * 0.05)}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_10px_28px_-10px_rgba(230,57,70,0.45)]"
                >
                  {s.imagemUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.imagemUrl}
                        alt={s.nome}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                        style={{ objectPosition: s.foco || "50% 50%" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5 transition-colors group-hover:from-black/95" />
                      <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-accent backdrop-blur-sm transition-colors group-hover:bg-accent group-hover:text-white">
                        <Icon size={15} />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-sm font-semibold text-white">{s.nome}</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/60">{s.descricao}</p>
                        <span className="mt-2.5 block h-0.5 w-8 rounded-full bg-accent" />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-br from-[#18191d] via-[#131418] to-[#0e0f12] p-4 transition-colors duration-300 group-hover:from-[#1c1d22]">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                        style={{ background: "radial-gradient(circle, rgba(230,57,70,0.3), transparent 70%)" }}
                      />
                      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent shadow-[0_0_20px_-6px_rgba(230,57,70,0.55)] transition-transform duration-300 group-hover:scale-110">
                        <Icon size={26} />
                      </span>
                      <div className="relative">
                        <p className="text-sm font-semibold text-white">{s.nome}</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/55">{s.descricao}</p>
                        <span className="mt-2.5 block h-0.5 w-8 rounded-full bg-accent" />
                      </div>
                    </div>
                  )}
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quem somos — mesmo tratamento do Hero: banner de ponta a ponta, texto por cima */}
      <section id="sobre" className="relative w-full overflow-hidden">
        <ElementoFlutuante className="left-[4%] top-[14%] hidden lg:block" duracao={9} delay={0.4}>
          <IconeFlutuanteMini Icon={Film} />
        </ElementoFlutuante>
        {sobreImagemUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sobreImagemUrlMobile || sobreImagemUrl}
              alt="Instaby"
              className="absolute inset-0 h-full w-full object-cover sm:hidden"
              style={{ objectPosition: sobreFocoFinal }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sobreImagemUrl}
              alt="Instaby"
              className="absolute inset-0 hidden h-full w-full object-cover sm:block"
              style={{ objectPosition: sobreFocoFinal }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />

            <div className="relative z-10 mx-auto flex min-h-[440px] max-w-6xl flex-col justify-center px-6 py-16 sm:min-h-[500px] sm:py-20">
              <motion.div {...fadeUp()} className="max-w-xl">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">Quem somos</p>
                <h2 className="mb-5 text-2xl font-semibold sm:text-3xl" style={{ color: corTituloFinal }}>
                  Uma agência enxuta, feita pra quem quer resultado de verdade.
                </h2>
                <p
                  className="mb-6 whitespace-pre-line text-sm leading-relaxed sm:text-base"
                  style={{ color: comAlpha(corTextoFinal, 0.75) }}
                >
                  {textoSobre}
                </p>
                <a
                  href={sobreBotaoUrlFinal}
                  target={sobreBotaoUrlFinal.startsWith("http") ? "_blank" : undefined}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02]"
                >
                  {sobreBotaoTextoFinal} <ArrowRight size={14} />
                </a>
              </motion.div>
            </div>
          </>
        ) : (
          <div className="relative mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
            <motion.p {...fadeUp()} className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">
              Quem somos
            </motion.p>
            <motion.h2 {...fadeUp(0.05)} className="mb-5 text-2xl font-semibold sm:text-3xl">
              Uma agência enxuta, feita pra quem quer resultado de verdade.
            </motion.h2>
            <motion.p {...fadeUp(0.1)} className="mx-auto mb-6 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted sm:text-base">
              {textoSobre}
            </motion.p>
            <motion.a
              {...fadeUp(0.15)}
              href={sobreBotaoUrlFinal}
              target={sobreBotaoUrlFinal.startsWith("http") ? "_blank" : undefined}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02]"
            >
              {sobreBotaoTextoFinal} <ArrowRight size={14} />
            </motion.a>
          </div>
        )}
      </section>

      {/* Faixa de diferenciais — compacta, logo abaixo do Sobre */}
      <section className="bg-base px-6 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {diferenciaisFinal.map((d, i) => (
            <motion.div key={d.titulo} {...fadeUp((i % 4) * 0.06)} className="flex gap-3">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="mb-0.5 text-sm font-medium text-text">{d.titulo}</p>
                <p className="text-xs leading-relaxed text-muted">{d.texto}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Álbuns — carrossel deslizante contínuo, reaproveitando o Portfólio já cadastrado */}
      <AlbunsCarrossel cases={cases || []} titulo={albunsTitulo} texto={albunsTexto} />

      {/* Clientes / depoimentos */}
      {(logos.length > 0 || depoimentos.length > 0) && (
        <section className="relative overflow-hidden bg-base py-16">
          <GradeNeon />
          {/* glow ambiente — o "brilhante" que faltava aqui */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(230,57,70,0.35), transparent 70%)" }}
          />

          <div className="relative mx-auto max-w-6xl px-6">
            <motion.p {...fadeUp()} className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-accent">
              Clientes
            </motion.p>
            <motion.h2 {...fadeUp(0.05)} className="mb-10 text-center text-2xl font-semibold sm:text-3xl">
              Marcas que confiam na Instaby
            </motion.h2>
          </div>

          {logos.length > 0 && (
            <motion.div {...fadeUp(0.1)} className="group/marquee relative mb-12 overflow-hidden py-2">
              {/* fade nas bordas — sumiço suave, sem corte seco */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-base to-transparent sm:w-28" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-base to-transparent sm:w-28" />
              <div
                className="flex w-max items-center gap-5 animate-marquee-esquerda group-hover/marquee:[animation-play-state:paused]"
                style={{ animationDuration: `${Math.max(logos.length * 4, 18)}s` }}
              >
                {[...logos, ...logos].map((l, i) => (
                  <div
                    key={`${l.nome}-${i}`}
                    className="group flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-accent/40 hover:bg-white/[0.06] hover:shadow-[0_0_32px_-8px_rgba(230,57,70,0.45)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={l.logoUrl}
                      alt={l.nome}
                      className="h-9 w-auto opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {depoimentos.length > 0 && (
            <div className="relative mx-auto max-w-6xl px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {depoimentos.map((d, i) => (
                  <motion.div
                    key={d.id}
                    {...fadeUp((i % 3) * 0.06)}
                    className="rounded-2xl border border-border bg-card/60 p-5 transition-colors duration-300 hover:border-accent/30"
                  >
                    <p className="mb-3 text-sm leading-relaxed text-muted">"{d.texto}"</p>
                    <p className="text-xs font-medium text-text">{d.nomeCliente}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Processo de trabalho — faixa vermelha escura, com foto de fundo opcional */}
      <section className="relative overflow-hidden px-6 py-16">
        {processoImagemUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={processoImagemUrlMobile || processoImagemUrl}
              alt="Instaby"
              className="absolute inset-0 h-full w-full object-cover sm:hidden"
              style={{ objectPosition: processoFocoFinal }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={processoImagemUrl}
              alt="Instaby"
              className="absolute inset-0 hidden h-full w-full object-cover sm:block"
              style={{ objectPosition: processoFocoFinal }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, rgba(58,10,15,0.92), rgba(26,5,7,0.88) 60%, rgba(13,3,4,0.92))" }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #3a0a0f, #1a0507 60%, #0d0304)" }}
          />
        )}
        {/* transição suave nas duas bordas — funde com o tom das seções vizinhas
            em vez de cortar seco de um tema pro outro */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-base to-transparent sm:h-28" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-base to-transparent sm:h-28" />
        <ElementoFlutuante className="right-[6%] bottom-[10%] hidden lg:block" duracao={10} delay={0.5}>
          <IconeFlutuanteMini Icon={TrendingUp} className="border-white/10 text-white/20" />
        </ElementoFlutuante>
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <motion.p {...fadeUp()} className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-400">
                Processo
              </motion.p>
              <motion.h2 {...fadeUp(0.05)} className="max-w-md text-2xl font-semibold text-white sm:text-3xl">
                Do planejamento ao resultado.
              </motion.h2>
            </div>
            <motion.div {...fadeUp(0.1)} className="max-w-xs sm:text-right">
              <p className="mb-3 text-xs leading-relaxed text-white/70">{processoTextoFinal}</p>
              <a
                href={processoBotaoUrlFinal}
                target={processoBotaoUrlFinal.startsWith("http") ? "_blank" : undefined}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-xs font-medium text-white hover:bg-white/10"
              >
                {processoBotaoTextoFinal}
              </a>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESSO.map((p, i) => (
              <motion.div
                key={p.passo}
                {...fadeUp(i * 0.08)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.07]"
              >
                <p className="mb-2 text-2xl font-semibold text-red-400/80">{p.passo}</p>
                <p className="mb-1.5 text-sm font-medium text-white">{p.titulo}</p>
                <p className="text-xs leading-relaxed text-white/60">{p.texto}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Onde a gente atende — mapa ilustrativo, entre o Processo e o Contato final */}
      <MapaAtuacao titulo={mapaTitulo} texto={mapaTexto} locais={mapaLocais} />

      {/* Contato final — banner de fundo, texto e botão por cima */}
      <section id="contato" className="relative w-full overflow-hidden">
        <ElementoFlutuante className="right-[6%] top-[16%] hidden lg:block" duracao={8.5} delay={0.7}>
          <IconeFlutuanteMini Icon={Instagram} />
        </ElementoFlutuante>
        {ctaImagemUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ctaImagemUrlMobile || ctaImagemUrl}
              alt="Instaby"
              className="absolute inset-0 h-full w-full object-cover sm:hidden"
              style={{ objectPosition: ctaFocoFinal }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ctaImagemUrl}
              alt="Instaby"
              className="absolute inset-0 hidden h-full w-full object-cover sm:block"
              style={{ objectPosition: ctaFocoFinal }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/30" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-base to-base" />
        )}

        <div className="relative z-10 mx-auto flex min-h-[380px] max-w-6xl flex-col justify-center px-6 py-16 sm:min-h-[420px] sm:py-20">
          <motion.div {...fadeUp()} className="max-w-lg">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">Vamos conversar?</p>
            <h2 className="mb-4 text-2xl font-semibold sm:text-3xl" style={{ color: corTituloFinal }}>
              {ctaTituloFinal}
            </h2>
            <p className="mb-7 text-sm leading-relaxed sm:text-base" style={{ color: comAlpha(corTextoFinal, 0.75) }}>
              {ctaTextoFinal}
            </p>
            {linkWhatsapp ? (
              <a
                href={linkWhatsapp}
                target="_blank"
                className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-accent px-7 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 animate-streak-sweep bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18)_40%,rgba(255,255,255,0.85)_50%,rgba(255,255,255,0.18)_60%,transparent)]"
                />
                <MessageCircle size={16} /> {ctaBotaoTextoFinal}
              </a>
            ) : (
              <Link
                href="/link"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02]"
              >
                Ver nossos contatos <ArrowRight size={14} />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="relative px-6 py-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="flex flex-col items-center justify-between gap-5 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Instaby" className="h-5 w-auto opacity-70 grayscale" />

            <nav className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} className="hover:text-text">
                  {n.label}
                </a>
              ))}
              <Link href="/link" className="hover:text-text">
                Links
              </Link>
              <Link href="/app" className="hover:text-text">
                Painel administrativo
              </Link>
            </nav>

            {temSociais && (
              <div className="flex items-center gap-3">
                {instagram && (
                  <a href={instagram} target="_blank" className="text-muted hover:text-text">
                    <Instagram size={15} />
                  </a>
                )}
                {youtube && (
                  <a href={youtube} target="_blank" className="text-muted hover:text-text">
                    <Youtube size={15} />
                  </a>
                )}
                {tiktok && (
                  <a href={tiktok} target="_blank" className="text-[10px] font-bold text-muted hover:text-text">
                    TT
                  </a>
                )}
                {linkedin && (
                  <a href={linkedin} target="_blank" className="text-muted hover:text-text">
                    <Linkedin size={15} />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 border-t border-border/40 pt-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-xs text-muted/60">{rodapeRegiao || "Araras · Campinas · São Paulo"}</p>
            <p className="text-xs text-muted/60">
              {rodapeDireitos || `© ${new Date().getFullYear()} Instaby Agência. Todos os direitos reservados.`}
            </p>
          </div>
          <p className="text-center text-xs text-muted/40">{rodapeTexto || "Marketing digital com resultado de verdade."}</p>
        </div>
      </footer>
    </div>
  );
}
