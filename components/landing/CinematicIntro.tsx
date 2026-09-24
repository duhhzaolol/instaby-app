"use client";

// Abertura cinematográfica do site: uma seção "grudada" na tela (sticky) por 300vh
// de rolagem — enquanto a pessoa rola, a câmera cresce e se aproxima, até a tela
// "entrar" pela lente (flash) e revelar o Hero logo em seguida. Sem bibliotecas de
// 3D/WebGL (não instaláveis nesse projeto) — só framer-motion (useScroll +
// useTransform), já usado no resto do app, com SVG vetorial pra câmera e pros
// elementos flutuantes.

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ElementoFlutuante, SvgLenteMini, SvgTripeMini, SvgAneisMini, SvgCamera } from "./FloatingGear";

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

  // Câmera: começa em tamanho normal, cresce e "engole" o quadro.
  const escalaCamera = useTransform(scrollYProgress, [0, 0.55, 0.88], [1, 2.4, 8.5]);
  const yCamera = useTransform(scrollYProgress, [0, 0.88], [0, -30]);
  const rotacaoCamera = useTransform(scrollYProgress, [0, 0.88], [-3, 2]);

  // Texto de abertura: entra rápido, some antes da câmera dominar a tela.
  const opacidadeTexto = useTransform(scrollYProgress, [0, 0.1, 0.3, 0.4], [0, 1, 1, 0]);
  const yTexto = useTransform(scrollYProgress, [0, 0.1], [20, 0]);

  // Flash final — a sensação de "entrar na lente", revelando o Hero por trás.
  const opacidadeFlash = useTransform(scrollYProgress, [0.74, 0.93, 1], [0, 1, 1]);

  // Elementos flutuantes desaparecem conforme a câmera cresce.
  const opacidadeFlutuantes = useTransform(scrollYProgress, [0, 0.3, 0.55], [1, 1, 0]);

  // Indicador de "role" — só faz sentido no início.
  const opacidadeIndicador = useTransform(scrollYProgress, [0, 0.06, 0.16], [0, 1, 0]);

  return (
    <div ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#08080a]">
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

        {/* elementos flutuantes decorativos */}
        <motion.div style={{ opacity: opacidadeFlutuantes }} className="absolute inset-0">
          <ElementoFlutuante className="left-[6%] top-[22%] hidden sm:block" duracao={7} delay={0}>
            <SvgLenteMini />
          </ElementoFlutuante>
          <ElementoFlutuante className="right-[8%] top-[64%] hidden sm:block" duracao={9} delay={1.2}>
            <SvgTripeMini />
          </ElementoFlutuante>
          <ElementoFlutuante className="left-[12%] bottom-[16%]" duracao={8} delay={0.6}>
            <SvgAneisMini />
          </ElementoFlutuante>
          <ElementoFlutuante className="right-[14%] top-[18%]" duracao={6.5} delay={0.3}>
            <SvgAneisMini className="h-8 w-8 opacity-70" />
          </ElementoFlutuante>
        </motion.div>

        {/* texto de abertura */}
        <motion.div
          style={{ opacity: opacidadeTexto, y: yTexto }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-6 text-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Instaby" className="h-7 w-auto sm:h-8" />
          <h1 className="max-w-xs text-2xl font-semibold leading-tight text-white sm:max-w-2xl sm:text-4xl">
            {titulo || "Enquadramos a sua marca."}
          </h1>
          <p className="max-w-[280px] text-sm text-white/60 sm:max-w-md sm:text-base">
            {subtitulo || "Criação de conteúdo, captação e tráfego pago — sob o mesmo foco."}
          </p>
        </motion.div>

        {/* câmera central */}
        <motion.div
          style={{ scale: escalaCamera, y: yCamera, rotate: rotacaoCamera }}
          className="absolute inset-0 z-10 flex items-center justify-center"
        >
          <SvgCamera className="h-[42vh] w-[42vh] max-h-[380px] max-w-[380px] sm:h-[50vh] sm:w-[50vh]" />
        </motion.div>

        {/* flash / íris final */}
        <motion.div aria-hidden style={{ opacity: opacidadeFlash }} className="absolute inset-0 z-30 bg-[#08080a]" />

        <motion.div
          style={{ opacity: opacidadeIndicador }}
          className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 text-[11px] uppercase tracking-widest text-white/40"
        >
          role pra entrar
        </motion.div>
      </div>
    </div>
  );
}
