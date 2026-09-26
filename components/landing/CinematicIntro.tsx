"use client";

// Abertura do site: ícones espalhados (conteúdo, redes, tráfego) convergem pro
// centro e "viram" o logo da Instaby — automático, assim que a página carrega,
// sem precisar rolar (referência: o efeito de entrada do site Creator Hub, que
// o Duhzao mandou de exemplo). 3 tempos, do jeito que ele pediu depois de ver
// a 1ª versão (essa era rápida demais, ~1,4s no total): 2s de "apresentação"
// (ícones convergindo, brilho, logo se formando), 1s de logo sozinho parado
// na tela, e só depois a revelação do site — ~3,5s do início ao fim.
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

// Espalhados o bastante pro tamanho maior dos ícones (2ª rodada de aumento —
// pedido explícito de novo: "aumente esses elementos").
const ICONES: ConfigIcone[] = [
  { Icon: Instagram, x: -235, y: -185, rotate: -14 },
  { Icon: Youtube, x: 235, y: -215, rotate: 12 },
  { Icon: Play, x: -280, y: 140, rotate: 9, soDesktop: true },
  { Icon: TrendingUp, x: 265, y: 175, rotate: -10, soDesktop: true },
  { Icon: Heart, x: -95, y: -290, rotate: -6 },
  { Icon: Film, x: 110, y: 270, rotate: 14 },
];

// Timeline (segundos, a partir do carregamento da página). A "apresentação"
// (ícones → glow → logo → quadro → REC → texto) preenche os primeiros 2s —
// são os mesmos tempos da 1ª versão (que cabiam em 0,76s), só esticados na
// mesma proporção pra caber em 2s certinho. Depois disso, tudo fica parado
// (o logo formado, "sozinho na tela") até completar 3s, e só então começa a
// revelação do site.
const DURACAO_ICONES = 1.7; // ícones convergem, encolhem e somem
const ATRASO_GLOW = 0.8;
const DURACAO_GLOW = 0.75;
const ATRASO_LOGO = 0.85;
const DURACAO_LOGO = 0.75;
const ATRASO_QUADRO = 1.2;
const DURACAO_QUADRO = 0.55;
const ATRASO_REC = 1.45;
const DURACAO_REC = 0.4;
const ATRASO_TEXTO = 1.5;
const DURACAO_TEXTO = 0.5; // termina em 2,0s — início do 1s de logo parado
const ATRASO_SUBIDA = 3.0; // 2s de apresentação + 1s parado = 3s, só então sobe
const DURACAO_SUBIDA = 0.22;
// Começa ANTES da subida terminar (não depois) — testado em vídeo: com um
// atraso maior aqui, a tela ficava um instante todo preta entre a cena sumir
// e a cortina começar a se mexer, um "buraco" feio. Sobrepondo os dois, a
// cortina já está rachando no momento em que a cena termina de esmaecer —
// um movimento só, contínuo, sem pausa morta no meio.
const ATRASO_CORTINA = 3.04;
const DURACAO_CORTINA = 0.48; // termina em ~3,52s
const DESMONTAR_MS = 3800; // um pouco depois da cortina terminar

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
      className={`absolute left-1/2 top-1/2 z-10 -ml-10 -mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] text-white/70 backdrop-blur-sm sm:-ml-12 sm:-mt-12 sm:h-24 sm:w-24 ${
        config.soDesktop ? "hidden sm:flex" : ""
      }`}
    >
      <Icon size={32} />
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
          <img src="/logo.png" alt="Instaby" className="h-20 w-auto sm:h-28" />
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
