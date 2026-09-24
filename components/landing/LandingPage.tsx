"use client";

import { useState } from "react";
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
} from "lucide-react";
import { CinematicIntro } from "./CinematicIntro";
import { PilaresCarroChefe } from "./PilaresCarroChefe";
import { AlbunsCarrossel } from "./AlbunsCarrossel";
import { ElementoFlutuante, SvgLenteMini, SvgTripeMini, SvgAneisMini, SvgAperturaMini } from "./FloatingGear";

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
type ServicoOverride = { nome: string; descricao: string; destino: string };
type DiferencialOverride = { titulo: string; texto: string };
type Resultado = { valor: string; legenda: string };
type Pilar = { nome: string; texto: string; indicadores?: Indicador[] };

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
}) {
  const [menuAberto, setMenuAberto] = useState(false);

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
  const indicadoresValidos = (heroIndicadores || []).filter((i) => i.valor?.trim() && i.legenda?.trim());

  const servicosFinal = SERVICOS_PADRAO.map((padrao, i) => ({
    nome: servicos?.[i]?.nome || padrao.nome,
    descricao: servicos?.[i]?.descricao || padrao.descricao,
    destino: servicos?.[i]?.destino || padrao.destino,
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
      {/* Abertura cinematográfica — a câmera aproxima conforme rola, "entra na lente" e revela o Hero */}
      <CinematicIntro titulo={aberturaTitulo} subtitulo={aberturaSubtitulo} />

      {/* Cabeçalho */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-base/85 backdrop-blur-md">
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
          <div className="border-t border-border/60 bg-base px-6 py-4 md:hidden">
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

      {/* Hero — banner ocupa a seção inteira, de ponta a ponta; texto sempre por cima */}
      <section id="inicio" className="relative w-full overflow-hidden">
        {heroImagemUrl ? (
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
            style={{ background: "radial-gradient(ellipse at top left, rgba(230,57,70,0.25), transparent 65%), #0d0d0f" }}
          />
        )}
        {/* linha de brilho no topo — ecoa o flash da abertura */}
        <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[560px] max-w-6xl flex-col justify-center gap-5 px-6 py-20 sm:min-h-[680px] sm:py-28">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent backdrop-blur"
            >
              <Sparkles size={12} /> Marketing digital com resultado de verdade
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mb-9 max-w-xl text-base leading-relaxed sm:text-lg"
              style={{ color: comAlpha(corTextoFinal, 0.75) }}
            >
              {subtitulo}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-3"
            >
              {linkWhatsapp && (
                <a
                  href={linkWhatsapp}
                  target="_blank"
                  className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02]"
                >
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
                animate={{ opacity: 1, y: 0 }}
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
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute bottom-6 right-6 z-10 hidden items-center gap-1.5 text-xs text-white/50 hover:text-white/80 sm:flex"
        >
          role para explorar <ChevronDown size={13} className="animate-bounce" />
        </motion.a>
      </section>

      {/* Pilares — os 3 carros-chefe, Tráfego Pago em destaque */}
      <PilaresCarroChefe pilares={pilaresFinal} linkContato={linkContatoPilar} />

      {/* Serviços — o restante do que a Instaby faz, sem depender de foto */}
      <section id="servicos" className="relative overflow-hidden bg-[#0b0b0d] px-6 py-16">
        <GradeNeon />
        <ElementoFlutuante className="right-[5%] top-[10%] hidden lg:block" duracao={8}>
          <SvgLenteMini className="h-12 w-12" />
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {servicosFinal.map((s, i) => {
              const Icon = s.icone;
              return (
                <motion.a
                  key={i}
                  href={s.destino}
                  target={s.destino.startsWith("http") ? "_blank" : undefined}
                  {...fadeUp((i % 4) * 0.05)}
                  className="group rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white/[0.07] hover:shadow-[0_10px_28px_-10px_rgba(230,57,70,0.45)]"
                >
                  <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                    <Icon size={15} />
                  </div>
                  <p className="mb-1 text-sm font-medium text-text">{s.nome}</p>
                  <p className="text-xs leading-relaxed text-muted">{s.descricao}</p>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quem somos — mesmo tratamento do Hero: banner de ponta a ponta, texto por cima */}
      <section id="sobre" className="relative w-full overflow-hidden">
        <ElementoFlutuante className="left-[4%] top-[14%] hidden lg:block" duracao={9} delay={0.4}>
          <SvgTripeMini className="text-white/10" />
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
      <section className="bg-[#0b0b0d] px-6 py-10">
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
        <section className="relative overflow-hidden bg-[#0b0b0d] px-6 py-16">
          <GradeNeon />
          <div className="relative mx-auto max-w-6xl">
            <motion.p {...fadeUp()} className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-accent">
              Clientes
            </motion.p>
            <motion.h2 {...fadeUp(0.05)} className="mb-12 text-center text-2xl font-semibold sm:text-3xl">
              Marcas que confiam na Instaby
            </motion.h2>

            {logos.length > 0 && (
              <motion.div {...fadeUp(0.1)} className="mb-12 flex flex-wrap items-center justify-center gap-8">
                {logos.map((l) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={l.nome}
                    src={l.logoUrl}
                    alt={l.nome}
                    className="h-10 w-auto opacity-70 grayscale transition-opacity hover:opacity-100 hover:grayscale-0"
                  />
                ))}
              </motion.div>
            )}

            {depoimentos.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {depoimentos.map((d, i) => (
                  <motion.div
                    key={d.id}
                    {...fadeUp((i % 3) * 0.06)}
                    className="rounded-2xl border border-border bg-card/60 p-5"
                  >
                    <p className="mb-3 text-sm leading-relaxed text-muted">"{d.texto}"</p>
                    <p className="text-xs font-medium text-text">{d.nomeCliente}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Processo de trabalho — faixa vermelha escura */}
      <section
        className="relative overflow-hidden px-6 py-16"
        style={{ background: "linear-gradient(135deg, #3a0a0f, #1a0507 60%, #0d0304)" }}
      >
        <ElementoFlutuante className="right-[6%] bottom-[10%] hidden lg:block" duracao={10} delay={0.5}>
          <SvgAperturaMini className="h-16 w-16 text-white/10" />
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            {PROCESSO.map((p, i) => (
              <motion.div key={p.passo} {...fadeUp(i * 0.08)} className="relative">
                <p className="mb-2 text-2xl font-semibold text-red-500/70">{p.passo}</p>
                <p className="mb-1.5 text-sm font-medium text-white">{p.titulo}</p>
                <p className="text-xs leading-relaxed text-white/60">{p.texto}</p>
                {i < PROCESSO.length - 1 && (
                  <ArrowRight size={14} className="absolute right-0 top-1.5 hidden text-white/20 lg:block" style={{ right: "-24px" }} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contato final — banner de fundo, texto e botão por cima */}
      <section id="contato" className="relative w-full overflow-hidden">
        <ElementoFlutuante className="right-[6%] top-[16%] hidden lg:block" duracao={8.5} delay={0.7}>
          <SvgAneisMini className="h-10 w-10" />
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
          <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-[#0d0d0f] to-[#0d0d0f]" />
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
                className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02]"
              >
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
