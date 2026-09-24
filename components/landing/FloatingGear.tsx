"use client";

// Elementos decorativos flutuantes (lente, tripé, anéis) usados em várias seções
// do site público, pra reforçar o "universo" de câmera/produção da Instaby sem
// pesar — são só contornos finos, baixa opacidade, animação leve e infinita.
// pointer-events-none: nunca atrapalham clique em nada por trás.

import { motion } from "framer-motion";

export function ElementoFlutuante({
  children,
  className = "",
  duracao = 8,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  duracao?: number;
  delay?: number;
}) {
  return (
    <motion.div
      aria-hidden
      animate={{ y: [0, -16, 0], rotate: [0, 4, -3, 0] }}
      transition={{ duration: duracao, delay, repeat: Infinity, ease: "easeInOut" }}
      className={`pointer-events-none absolute z-[5] text-white/20 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function SvgLenteMini({ className = "" }: { className?: string }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function SvgTripeMini({ className = "" }: { className?: string }) {
  return (
    <svg width="56" height="72" viewBox="0 0 56 72" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M28 8 L10 68" />
      <path d="M28 8 L28 68" />
      <path d="M28 8 L46 68" />
      <circle cx="28" cy="8" r="5" />
    </svg>
  );
}

export function SvgAneisMini({ className = "" }: { className?: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="8" />
      <circle cx="24" cy="24" r="10" />
    </svg>
  );
}

export function SvgAperturaMini({ className = "" }: { className?: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="26" cy="26" r="22" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <path key={deg} d="M26 26 L26 6 L36 10 Z" fill="currentColor" opacity="0.25" transform={`rotate(${deg} 26 26)`} />
      ))}
    </svg>
  );
}

// Selo "REC" (ponto vermelho pulsando + texto) — referência de câmera bem mais
// legível que um contorno abstrato; ninguém confunde isso com "um círculo boiando
// sem explicação". Usa animate-pulse do próprio Tailwind (sem depender de mais
// nenhuma engrenagem de animação).
export function SvgRec({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur-sm ${className}`}
    >
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent" />
      <span className="text-[10px] font-bold tracking-widest text-white/70">REC</span>
    </div>
  );
}

// Versão flutuante mini de qualquer ícone (lucide-react) — usada nas mesmas
// seções que antes tinham lente/tripé/anéis/abertura, agora com ícones
// reconhecíveis (Instagram, vídeo, tráfego...) em vez de formas abstratas.
export function IconeFlutuanteMini({
  Icon,
  className = "",
}: {
  Icon: React.ComponentType<{ size?: number }>;
  className?: string;
}) {
  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/25 backdrop-blur-sm ${className}`}
    >
      <Icon size={18} />
    </div>
  );
}

// Câmera principal, estilo vetor minimalista — inspirada numa mirrorless com lente
// zoom (referência: Sony ZV-E10 II + Tamron 17-70mm), vista de frente, olhando
// direto pra lente — combina com o efeito de "entrar na lente" da abertura.
export function SvgCamera({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 340" fill="none" className={className}>
      <defs>
        <radialGradient id="ig-vidro" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#4a4a54" />
          <stop offset="55%" stopColor="#16161a" />
          <stop offset="100%" stopColor="#050506" />
        </radialGradient>
      </defs>

      {/* corpo da câmera, atrás da lente */}
      <rect x="38" y="88" width="264" height="172" rx="24" fill="#111114" stroke="#2c2c33" strokeWidth="2" />
      <rect x="68" y="56" width="92" height="42" rx="11" fill="#111114" stroke="#2c2c33" strokeWidth="2" />
      <path d="M272 108 Q302 130 290 192 Q282 232 250 252" stroke="#2c2c33" strokeWidth="2" fill="none" />
      <circle cx="252" cy="112" r="5" fill="#E63946" opacity="0.85" />

      {/* anéis da lente, de fora pra dentro */}
      <circle cx="170" cy="180" r="120" fill="#0b0b0d" stroke="#3a3a42" strokeWidth="2" />
      <circle cx="170" cy="180" r="101" fill="none" stroke="#E63946" strokeWidth="2.5" opacity="0.85" />
      <circle cx="170" cy="180" r="85" fill="none" stroke="#4a4a52" strokeWidth="1.5" />
      <circle cx="170" cy="180" r="68" fill="url(#ig-vidro)" stroke="#5a5a64" strokeWidth="1.5" />

      {/* lâminas da íris */}
      <g opacity="0.9">
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <path key={deg} d="M170 180 L170 150 L188 158 Z" fill="#1c1c20" stroke="#3a3a42" strokeWidth="1" transform={`rotate(${deg} 170 180)`} />
        ))}
      </g>
      <circle cx="170" cy="180" r="14" fill="#050506" stroke="#E63946" strokeWidth="1.5" opacity="0.9" />
    </svg>
  );
}
