"use client";

// Abertura do site: ícones espalhados (conteúdo, redes, tráfego) convergem pro
// centro e "viram" o logo da Instaby — automático, assim que a página carrega,
// sem precisar rolar (referência: o efeito de entrada do site Creator Hub, que
// o Duhzao mandou de exemplo). Curto de propósito — é só uma virada de chave,
// ~1,4s do início ao fim, não uma cena longa.
//
// Antes (v126-v131) isso era ligado ao scroll (useScroll/scrollYProgress),
// precisando de um espaçador de 70vh só pra dar distância de rolagem — o
// visitante tinha que rolar pra abertura acontecer. Agora é por tempo
// (initial/animate padrão do framer-motion, com delay em cada elemento),
// disparado uma vez no carregamento. Sem scroll envolvido, não existe mais
// espaçador nenhum: o cabeçalho e o Hero já ficam nas posições finais deles
// desde o primeiro frame, só encobertos pela cena `fixed` até ela terminar.
//
// A saída é uma "abertura de cortina": depois que o logo se forma, a cena
// inteira sobe e esmaece; ao mesmo tempo, duas metades sólidas (uma cobrindo
// a metade de cima da tela, outra a de baixo) se separam — a de cima sai por
// cima, a de baixo por baixo — revelando o site por trás, crescendo a partir
// do meio da tela.
//
// Cada ícone tem sua própria trajetória (posição inicial → centro), por isso
// vira um sub-componente (IconeConvergindo) — mesmo padrão de qualquer lista
// de componentes com animação própria.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Instagram, Youtube, Play, TrendingUp, Heart, Film } from "lucide-react";
import { SvgRec } from "./FloatingGear";

type ConfigIcone = {
  Icon: React.ElementType;
  x: number;
  y: number;
  rotate: number;
  // alguns só aparecem em telas maiores, pra não lotar um celular estreito
  soDesktop?: boolean;
};

// Posições ~30% mais espalhadas que antes, pra acompanhar o ícone maior
// (pedido: "pode aumentar o tamanho, que eles estão pequenos").
const ICONES: ConfigIcone[] = [
  { Icon: Instagram, x: -195, y: -155, rotate: -14 },
  { Icon: Youtube, x: 195, y: -180, rotate: 12 },
  { Icon: Play, x: -235, y: 115, rotate: 9, soDesktop: true },
  { Icon: TrendingUp, x: 220, y: 145, rotate: -10, soDesktop: true },
  { Icon: Heart, x: -80, y: -240, rotate: -6 },
  { Icon: Film, x: 90, y: 225, rotate: 14 },
];

// Timeline (segundos, a partir do carregamento da página):
const DURACAO_ICONES = 0.65; // ícones convergem, encolhem e somem
const ATRASO_GLOW = 0.3;
const DURACAO_GLOW = 0.28;
const ATRASO_LOGO = 0.32;
const DURACAO_LOGO = 0.28;
const ATRASO_QUADRO = 0.46;
const DURACAO_QUADRO = 0.2;
const ATRASO_REC = 0.56;
const DURACAO_REC = 0.16;
const ATRASO_TEXTO = 0.58;
const DURACAO_TEXTO = 0.18;
const ATRASO_SUBIDA = 0.76; // cena (logo formado) sobe e esmaece
const DURACAO_SUBIDA = 0.22;
// Começa ANTES da subida terminar (não depois) — testado em vídeo: com um
// atraso maior aqui, a tela ficava um instante todo preta entre a cena sumir
// e a cortina começar a se mexer, um "buraco" feio. Sobrepondo os dois, a
// cortina já está rachando no momento em que a cena termina de esmaecer —
// um movimento só, contínuo, sem pausa morta no meio.
const ATRASO_CORTINA = 0.8;
const DURACAO_CORTINA = 0.48; // termina em ~1.28s
const DESMONTAR_MS = 1500; // um pouco depois da cortina terminar

function IconeConvergindo({ config }: { config: ConfigIcone }) {
  const Icon = config.Icon;
  return (
    <motion.div
      initial={{ x: config.x, y: config.y, rotate: config.rotate, scale: 1, opacity: 1 }}
      animate={{
        x: [config.x, 0, 0],
        y: [config.y, 0, 0],
        rotate: [config.rotate, 0, 0],
        scale: [1, 0.9, 0.3],
        opacity: [1, 1, 0],
      }}
      transition={{ duration: DURACAO_ICONES, times: [0, 0.6, 1], ease: "easeInOut" }}
      className={`absolute left-1/2 top-1/2 z-10 -ml-8 -mt-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] text-white/70 backdrop-blur-sm sm:-ml-10 sm:-mt-10 sm:h-20 sm:w-20 ${
        config.soDesktop ? "hidden sm:flex" : ""
      }`}
    >
      <Icon size={26} />
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
  // depois que a cortina termina de abrir, desmonta a cena de vez — as duas
  // metades já saíram da tela, então isso não muda nada visualmente, só evita
  // deixar um overlay fixed (mesmo que inofensivo) penduradо pro resto da visita.
  const [ativo, setAtivo] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setAtivo(false), DESMONTAR_MS);
    return () => clearTimeout(t);
  }, []);

  if (!ativo) return null;

  return (
    // fixed, não sticky/scroll: cobre a tela inteira sempre no mesmo lugar;
    // cabeçalho e Hero, por trás, já estão nas posições finais deles desde o
    // início — quando a cortina abre, eles simplesmente aparecem no lugar.
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* as duas metades da cortina — cobrem a tela inteira até se separarem */}
      <motion.div
        initial={{ y: "0%" }}
        animate={{ y: "-100%" }}
        transition={{ delay: ATRASO_CORTINA, duration: DURACAO_CORTINA, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-x-0 top-0 z-0 h-1/2 bg-[#08080a]"
      />
      <motion.div
        initial={{ y: "0%" }}
        animate={{ y: "100%" }}
        transition={{ delay: ATRASO_CORTINA, duration: DURACAO_CORTINA, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-x-0 bottom-0 z-0 h-1/2 bg-[#08080a]"
      />

      {/* ícones espalhados, convergindo pro centro — ficam por cima da cortina,
          fora do grupo que sobe/esmaece (eles já cuidam do próprio sumiço) */}
      {ICONES.map((config, i) => (
        <IconeConvergindo key={i} config={config} />
      ))}

      {/* cena formada: grade neon, glow, logo, quadro de mira, REC e texto —
          tudo junto num grupo só, que sobe e esmaece de uma vez no final */}
      <motion.div
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: -50, opacity: 0 }}
        transition={{ delay: ATRASO_SUBIDA, duration: DURACAO_SUBIDA, ease: "easeIn" }}
        className="absolute inset-0 z-10"
      >
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

        {/* glow por trás do logo, cresce junto com ele */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: ATRASO_GLOW, duration: DURACAO_GLOW }}
          className="absolute inset-0 z-10 flex items-center justify-center"
        >
          <div
            className="h-40 w-40 rounded-full blur-3xl sm:h-56 sm:w-56"
            style={{ background: "radial-gradient(circle, rgba(230,57,70,0.45), transparent 70%)" }}
          />
        </motion.div>

        {/* logo, montado pelos ícones */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: ATRASO_LOGO, duration: DURACAO_LOGO, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-20 flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Instaby" className="h-10 w-auto sm:h-14" />
        </motion.div>

        {/* quadro de mira (estilo visor de câmera) fechando em volta do logo,
            como se a cena tivesse acabado de "gravar" ele se formando */}
        <motion.div
          aria-hidden
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: ATRASO_QUADRO, duration: DURACAO_QUADRO }}
          className="absolute inset-0 z-20 flex items-center justify-center"
        >
          <div className="relative h-[190px] w-[260px] sm:h-[260px] sm:w-[360px]">
            <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-white/50 sm:h-8 sm:w-8" />
            <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-white/50 sm:h-8 sm:w-8" />
            <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-white/50 sm:h-8 sm:w-8" />
            <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-white/50 sm:h-8 sm:w-8" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: ATRASO_REC, duration: DURACAO_REC }}
          className="absolute inset-x-0 top-[27%] z-20 flex justify-center sm:top-[24%]"
        >
          <SvgRec />
        </motion.div>

        {/* texto de abertura, entra depois do logo formado */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ATRASO_TEXTO, duration: DURACAO_TEXTO }}
          className="absolute inset-x-0 top-[64%] z-20 flex flex-col items-center gap-3 px-6 text-center"
        >
          <h1 className="max-w-xs text-xl font-semibold leading-tight text-white sm:max-w-2xl sm:text-3xl">
            {titulo || "Tudo pela sua marca, num só lugar."}
          </h1>
          <p className="max-w-[280px] text-sm text-white/60 sm:max-w-md sm:text-base">
            {subtitulo || "Conteúdo, captação e tráfego pago — cada peça, trabalhando junto pelo seu resultado."}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
