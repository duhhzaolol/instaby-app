"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, ExternalLink, Instagram } from "lucide-react";

type LinkItem = { titulo: string; url: string; imagemUrl: string | null };

function iconePara(titulo: string) {
  if (titulo.toLowerCase().includes("instagram")) return Instagram;
  return ExternalLink;
}

export function LinkPage({
  links,
  whatsappAgencia,
  introTexto,
  rodapeTexto,
}: {
  links: LinkItem[];
  whatsappAgencia: string | null;
  introTexto?: string | null;
  rodapeTexto?: string | null;
}) {
  const linkWhatsapp = whatsappAgencia
    ? `https://wa.me/${whatsappAgencia}?text=${encodeURIComponent("Olá! Vim pela página de links da Instaby.")}`
    : null;

  const disponiveis = links;

  return (
    <div className="flex min-h-screen flex-col items-center bg-base px-6 py-16 text-text">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] opacity-30"
        style={{ background: "radial-gradient(ellipse at top, rgba(230,57,70,0.2), transparent 70%)" }}
      />

      <motion.img
        src="/logo.png"
        alt="Instaby"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-3 h-8 w-auto"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-10 whitespace-pre-line text-center text-sm text-muted"
      >
        {introTexto || "Marketing digital com resultado de verdade"}
      </motion.p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {linkWhatsapp && (
          <motion.a
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            href={linkWhatsapp}
            target="_blank"
            className="flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-4 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.01]"
          >
            <MessageCircle size={16} /> Falar no WhatsApp
          </motion.a>
        )}

        {disponiveis.map((l, i) => {
          const Icon = iconePara(l.titulo);
          const externo = l.url.startsWith("http");
          const conteudo = (
            <>
              {l.imagemUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.imagemUrl} alt={l.titulo} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
              ) : (
                <Icon size={16} className="shrink-0 text-muted" />
              )}
              <span className="flex-1 text-center">{l.titulo}</span>
              {l.imagemUrl && <span className="w-8 shrink-0" />}
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
                  className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-5 py-4 text-sm font-medium text-text transition-colors hover:border-accent/30"
                >
                  {conteudo}
                </a>
              ) : (
                <Link
                  href={l.url}
                  className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-5 py-4 text-sm font-medium text-text transition-colors hover:border-accent/30"
                >
                  {conteudo}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="mt-16 whitespace-pre-line text-center text-xs text-muted/50">
        {rodapeTexto || `© ${new Date().getFullYear()} Instaby Agência`}
      </p>
    </div>
  );
}
