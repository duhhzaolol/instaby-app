import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

// Mesmo motivo do app/page.tsx: sem isso a página fica estática e não reflete
// edições feitas em Configurações → Site & Link na bio sem um novo deploy.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const c = await prisma.caseTrabalho.findUnique({ where: { id: params.id } });
  if (!c) return { title: "Case não encontrado — Instaby Agência" };
  return {
    title: `${c.nome} — Portfólio Instaby Agência`,
    description: c.descricao || c.descricaoCompleta || undefined,
  };
}

export default async function CaseDetalhePage({ params }: { params: { id: string } }) {
  const [c, config] = await Promise.all([
    prisma.caseTrabalho.findUnique({ where: { id: params.id } }),
    prisma.configuracao.findUnique({ where: { id: "config" } }),
  ]);

  if (!c || !c.ativo) notFound();

  const resultados = (c.resultados as { valor: string; legenda: string }[] | null) || null;
  const whatsappAgencia = config?.whatsappAgencia || null;
  const linkWhatsapp = whatsappAgencia
    ? `https://wa.me/${whatsappAgencia}?text=${encodeURIComponent(`Olá! Vi o case "${c.nome}" no site da Instaby e queria saber mais.`)}`
    : null;

  return (
    <div className="min-h-screen bg-base text-text">
      <header className="border-b border-border/60 bg-base/85 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
          </Link>
          <Link href="/#portfolio" className="flex items-center gap-1.5 text-xs text-muted hover:text-text">
            <ArrowLeft size={13} /> Voltar ao portfólio
          </Link>
        </div>
      </header>

      <section className="relative w-full overflow-hidden">
        {c.imagemUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.imagemUrl}
              alt={c.nome}
              className="h-[46vh] w-full object-cover sm:h-[56vh]"
              style={{ objectPosition: c.imagemFoco || "50% 50%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="h-[30vh] w-full bg-gradient-to-br from-accent/15 via-[#0d0d0f] to-[#0d0d0f]" />
        )}
        <div className="absolute bottom-0 left-0 w-full px-6 py-8">
          <div className="mx-auto max-w-5xl">
            {c.categoria && <p className="mb-2 text-xs font-medium uppercase tracking-wider text-accent">{c.categoria}</p>}
            <h1 className="text-2xl font-semibold text-white sm:text-4xl">{c.nome}</h1>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">Sobre o projeto</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted sm:text-base">
              {c.descricaoCompleta || c.descricao || "Em breve, mais detalhes sobre este case."}
            </p>

            <div className="mt-8">
              {linkWhatsapp ? (
                <a
                  href={linkWhatsapp}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02]"
                >
                  <MessageCircle size={16} /> Quero um resultado assim
                </a>
              ) : (
                <Link
                  href="/link"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02]"
                >
                  Ver nossos contatos
                </Link>
              )}
            </div>
          </div>

          {resultados && resultados.length > 0 && (
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-accent">Resultados</p>
              {resultados.map((r, i) => (
                <div key={i}>
                  <p className="text-2xl font-semibold text-text">{r.valor}</p>
                  <p className="text-xs text-muted">{r.legenda}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border/40 px-6 py-8 text-center">
        <p className="text-xs text-muted/60">
          {config?.siteRodapeDireitos || `© ${new Date().getFullYear()} Instaby Agência. Todos os direitos reservados.`}
        </p>
      </footer>
    </div>
  );
}
