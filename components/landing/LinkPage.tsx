"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageCircle,
  ExternalLink,
  Instagram,
  Youtube,
  Linkedin,
  Music2,
  Briefcase,
  Star,
  FileText,
  Megaphone,
  ArrowUpRight,
} from "lucide-react";

type LinkItem = {
  titulo: string;
  descricao: string | null;
  url: string;
  imagemUrl: string | null;
  destaque: boolean;
};

// O ícone de cada link na lista é escolhido pelo título — então "Instagram",
// "TikTok" etc, cadastrados como um link normal em vez de ficarem no bloco
// separado de redes sociais, já saem com o ícone certo automaticamente.
function iconePara(titulo: string) {
  const t = titulo.toLowerCase();
  if (t.includes("whatsapp")) return MessageCircle;
  if (t.includes("instagram")) return Instagram;
  if (t.includes("youtube")) return Youtube;
  if (t.includes("tiktok")) return Music2;
  if (t.includes("linkedin")) return Linkedin;
  if (t.includes("portfólio") || t.includes("portfolio") || t.includes("trabalho")) return Briefcase;
  if (t.includes("case") || t.includes("depoimento") || t.includes("avalia")) return Star;
  if (t.includes("serviço") || t.includes("servico")) return Megaphone;
  if (t.includes("orçamento") || t.includes("orcamento") || t.includes("proposta") || t.includes("contrato")) return FileText;
  return ExternalLink;
}

export function LinkPage({
  links,
  whatsappAgencia,
  introTexto,
  rodapeTexto,
  imagemUrl,
  tagline,
  tags,
}: {
  links: LinkItem[];
  whatsappAgencia: string | null;
  introTexto?: string | null;
  rodapeTexto?: string | null;
  imagemUrl?: string | null;
  tagline?: string | null;
  tags?: string | null;
}) {
  const linkWhatsapp = whatsappAgencia
    ? `https://wa.me/${whatsappAgencia}?text=${encodeURIComponent("Olá! Vim pela página de links da Instaby.")}`
    : null;

  const normais = links.filter((l) => !l.destaque);
  const destaques = links.filter((l) => l.destaque);

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0a0a0c] text-white">
      {/* Hero de topo */}
      <div className="relative flex w-full flex-col justify-end overflow-hidden" style={{ minHeight: imagemUrl ? "56vh" : "auto" }}>
        {imagemUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagemUrl} alt="Instaby Agência" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-[#0a0a0c]" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at top, rgba(230,57,70,0.25), transparent 70%)" }}
          />
        )}

        {tagline && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute right-6 top-8 max-w-[140px] text-right font-serif text-sm italic text-amber-200/90"
          >
            {tagline}
          </motion.p>
        )}

        <div className="relative z-10 flex flex-col items-center px-6 pb-10 pt-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-3 text-[11px] uppercase tracking-[0.3em] text-white/60"
          >
            Araras · SP
          </motion.p>
          <motion.img
            src="/logo.png"
            alt="Instaby"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-2 h-10 w-auto"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-[11px] uppercase tracking-[0.25em] text-white/50"
          >
            Agência de Marketing
          </motion.p>
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col items-center px-6 pb-16 pt-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-3 text-center text-xl font-semibold leading-snug text-white"
        >
          {introTexto || "Estratégia, conteúdo e resultado de verdade."}
          <span className="mx-auto mt-3 block h-[3px] w-14 rounded-full bg-accent" />
        </motion.h1>

        {tags && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8 text-center text-[10px] uppercase tracking-[0.2em] text-white/40"
          >
            {tags}
          </motion.p>
        )}

        <div className="flex w-full flex-col gap-2.5">
          {linkWhatsapp && (
            <motion.a
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              href={linkWhatsapp}
              target="_blank"
              className="flex items-center gap-3 rounded-2xl bg-accent px-4 py-3.5 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.01]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <MessageCircle size={16} />
              </span>
              <span className="flex-1 text-left">
                <span className="block">Falar no WhatsApp</span>
                <span className="block text-xs font-normal text-white/80">Atendimento rápido</span>
              </span>
              <ArrowUpRight size={16} className="shrink-0 opacity-70" />
            </motion.a>
          )}

          {normais.map((l, i) => {
            const Icon = iconePara(l.titulo);
            const externo = l.url.startsWith("http");
            const conteudo = (
              <>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80">
                  {l.imagemUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.imagemUrl} alt={l.titulo} className="h-9 w-9 rounded-xl object-cover" />
                  ) : (
                    <Icon size={16} />
                  )}
                </span>
                <span className="flex-1 text-left">
                  <span className="block text-sm font-medium text-white">{l.titulo}</span>
                  {l.descricao && <span className="block text-xs font-normal text-white/50">{l.descricao}</span>}
                </span>
                <ArrowUpRight size={15} className="shrink-0 text-white/30" />
              </>
            );
            return (
              <motion.div
                key={`${l.titulo}-${l.url}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + (i + 1) * 0.05 }}
              >
                {externo ? (
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 transition-colors hover:border-accent/40 hover:bg-white/[0.07]"
                  >
                    {conteudo}
                  </a>
                ) : (
                  <Link
                    href={l.url}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 transition-colors hover:border-accent/40 hover:bg-white/[0.07]"
                  >
                    {conteudo}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>

        {destaques.map((l, i) => {
          const externo = l.url.startsWith("http");
          const conteudo = (
            <div className="relative flex h-40 w-full items-end overflow-hidden rounded-2xl border border-white/10">
              {l.imagemUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.imagemUrl} alt={l.titulo} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-white/5" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="relative z-10 flex w-full items-end justify-between p-4">
                <div>
                  <p className="text-base font-semibold text-white">{l.titulo}</p>
                  {l.descricao && <p className="text-xs text-white/70">{l.descricao}</p>}
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </div>
          );
          return (
            <motion.div
              key={`destaque-${l.titulo}-${l.url}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 + i * 0.05 }}
              className="mt-4 w-full"
            >
              {externo ? (
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  {conteudo}
                </a>
              ) : (
                <Link href={l.url}>{conteudo}</Link>
              )}
            </motion.div>
          );
        })}

        <div className="mt-12 flex flex-col items-center gap-1 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/30">Araras · Campinas · São Paulo</p>
          <p className="whitespace-pre-line text-xs text-white/40">
            {rodapeTexto || "Marketing digital com resultado de verdade."}
          </p>
        </div>
      </div>
    </div>
  );
}
