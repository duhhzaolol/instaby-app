"use client";

// Abertura do site: ícones espalhados (conteúdo, redes, tráfego) flutuam soltos
// e, conforme a pessoa rola um pouco (não é mais um scroll longo de 3 telas),
// convergem pro centro e "viram" o logo da Instaby. Curto de propósito — é só
// uma virada de chave, não uma cena longa. No final, a cena inteira (não só um
// flash por cima) esmaece em opacidade — quando o sticky solta, já não sobra
// nada opaco pra "puxar" visualmente, então a virada pro Hero é um fade de
// verdade, não um corte seco revelado pelo scroll.
//
// Cada ícone tem sua própria trajetória (posição inicial → centro), por isso
// vira um sub-componente (IconeConvergindo): chamar useTransform dentro de um
// .map() quebraria as regras de hooks do React — delegar pra um componente
// próprio, instanciado uma vez por ícone, é a forma correta e seguindo o mesmo
// padrão de qualquer lista de componentes.

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Instagram, Youtube, Play, TrendingUp, Heart, Film } from "lucide-react";

type ConfigIcone = {
  Icon: React.ElementType;
  x: number;
  y: number;
  rotate: number;
  // alguns só aparecem em telas maiores, pra não lotar um celular estreito
  soDesktop?: boolean;
};

const ICONES: ConfigIcone[] = [
  { Icon: Instagram, x: -150, y: -120, rotate: -14 },
  { Icon: Youtube, x: 150, y: -140, rotate: 12 },
  { Icon: Play, x: -180, y: 90, rotate: 9, soDesktop: true },
  { Icon: TrendingUp, x: 170, y: 110, rotate: -10, soDesktop: true },
  { Icon: Heart, x: -60, y: -185, rotate: -6 },
  { Icon: Film, x: 70, y: 175, rotate: 14 },
];

function IconeConvergindo({
  scrollYProgress,
  config,
}: {
  scrollYProgress: MotionValue<number>;
  config: ConfigIcone;
}) {
  const x = useTransform(scrollYProgress, [0, 0.5], [config.x, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [config.y, 0]);
  const rotate = useTransform(scrollYProgress, [0, 0.5], [config.rotate, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4, 0.56], [1, 0.9, 0.3]);
  const opacity = useTransform(scrollYProgress, [0, 0.38, 0.56], [1, 1, 0]);
  const Icon = config.Icon;

  return (
    <motion.div
      style={{ x, y, rotate, scale, opacity }}
      className={`absolute left-1/2 top-1/2 z-10 -ml-6 -mt-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] text-white/70 backdrop-blur-sm sm:-ml-7 sm:-mt-7 sm:h-14 sm:w-14 ${
        config.soDesktop ? "hidden sm:flex" : ""
      }`}
    >
      <Icon size={20} />
    </motion.div>
  );
}

export function CinematicIntro({
  titulo,
  subtitulo,
}: {
  titulo?: string | null;
  subtitulo?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // A cena inteira — fundo, ícones, logo e texto — esmaece no final. É essa
  // opacidade (aplicada no próprio bloco sticky, não só num overlay por cima)
  // que garante o fade real na virada pro Hero.
  const opacidadeCena = useTransform(scrollYProgress, [0, 0.78, 1], [1, 1, 0]);

  // Logo: nasce pequeno/transparente e ganha forma junto com a chegada dos ícones.
  const escalaLogo = useTransform(scrollYProgress, [0.3, 0.58], [0.5, 1]);
  const opacidadeLogo = useTransform(scrollYProgress, [0.3, 0.5], [0, 1]);
  const glowLogo = useTransform(scrollYProgress, [0.42, 0.58], [0, 1]);

  // Texto: entra logo depois do logo se formar.
  const opacidadeTexto = useTransform(scrollYProgress, [0.6, 0.72], [0, 1]);
  const yTexto = useTransform(scrollYProgress, [0.6, 0.72], [16, 0]);

  // Indicador de "role" — só faz sentido no início.
  const opacidadeIndicador = useTransform(scrollYProgress, [0, 0.06, 0.18], [0, 1, 0]);

  return (
    <div ref={containerRef} className="relative h-[170vh]">
      <motion.div style={{ opacity: opacidadeCena }} className="sticky top-0 h-screen w-full overflow-hidden bg-[#08080a]">
        {/* grade neon sutil de fundo */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(230,57,70,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(230,57,70,0.6) 1px, transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, rgba(230,57,70,0.14), transparent 60%)" }}
        />

        {/* ícones espalhados, convergindo pro centro */}
        {ICONES.map((config, i) => (
          <IconeConvergindo key={i} scrollYProgress={scrollYProgress} config={config} />
        ))}

        {/* glow por trás do logo, cresce junto com ele */}
        <motion.div
          aria-hidden
          style={{ opacity: glowLogo }}
          className="absolute inset-0 z-10 flex items-center justify-center"
        >
          <div
            className="h-40 w-40 rounded-full blur-3xl sm:h-56 sm:w-56"
            style={{ background: "radial-gradient(circle, rgba(230,57,70,0.45), transparent 70%)" }}
          />
        </motion.div>

        {/* logo, montado pelos ícones */}
        <motion.div
          style={{ scale: escalaLogo, opacity: opacidadeLogo }}
          className="absolute inset-0 z-20 flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Instaby" className="h-10 w-auto sm:h-14" />
        </motion.div>

        {/* texto de abertura, entra depois do logo formado */}
        <motion.div
          style={{ opacity: opacidadeTexto, y: yTexto }}
          className="absolute inset-x-0 top-[64%] z-20 flex flex-col items-center gap-3 px-6 text-center"
        >
          <h1 className="max-w-xs text-xl font-semibold leading-tight text-white sm:max-w-2xl sm:text-3xl">
            {titulo || "Tudo pela sua marca, num só lugar."}
          </h1>
          <p className="max-w-[280px] text-sm text-white/60 sm:max-w-md sm:text-base">
            {subtitulo || "Conteúdo, captação e tráfego pago — cada peça, trabalhando junto pelo seu resultado."}
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: opacidadeIndicador }}
          className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 text-[11px] uppercase tracking-widest text-white/40"
        >
          role pra continuar
        </motion.div>
      </motion.div>
    </div>
  );
}
