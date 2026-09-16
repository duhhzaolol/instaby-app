"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, ExternalLink, Instagram } from "lucide-react";

type LinkItem = { label: string; url: string | null };

function iconePara(label: string) {
  if (label.toLowerCase().includes("instagram")) return Instagram;
  return ExternalLink;
}

export function LinkPage({ links, whatsappAgencia }: { links: LinkItem[]; whatsappAgencia: string | null }) {
  const linkWhatsapp = whatsappAgencia
    ? `https://wa.me/${whatsappAgencia}?text=${encodeURIComponent("Olá! Vim pela página de links da Instaby.")}`
    : null;

  const disponiveis = links.filter((l) => !!l.url);

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
        className="mb-10 text-sm text-muted"
      >
        Marketing digital com resultado de verdade
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
          const Icon = iconePara(l.label);
          const externo = l.url!.startsWith("http");
          const conteudo = (
            <>
              <Icon size={16} className="text-muted" />
              <span className="flex-1 text-center">{l.label}</span>
            </>
          );
          return (
            <motion.div
              key={l.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + (i + 1) * 0.05 }}
            >
              {externo ? (
                <a
                  href={l.url!}
                  target="_blank"
                  className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-5 py-4 text-sm font-medium text-text transition-colors hover:border-accent/30"
                >
                  {conteudo}
                </a>
              ) : (
                <Link
                  href={l.url!}
                  className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-5 py-4 text-sm font-medium text-text transition-colors hover:border-accent/30"
                >
                  {conteudo}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="mt-16 text-xs text-muted/50">© {new Date().getFullYear()} Instaby Agência</p>
    </div>
  );
}
