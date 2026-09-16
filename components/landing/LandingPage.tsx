"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Instagram,
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
} from "lucide-react";

const SERVICOS = [
  { nome: "Social Media", desc: "Planejamento, conteúdo e gestão de redes sociais no dia a dia.", icone: Instagram },
  { nome: "Tráfego Pago", desc: "Campanhas no Meta Ads e Google Ads com foco em resultado real.", icone: Megaphone },
  { nome: "Captação de vídeo", desc: "Produção em estúdio ou externa, com equipamento e direção.", icone: Video },
  { nome: "Edição de vídeo", desc: "Cortes, Reels e vídeos institucionais com identidade da marca.", icone: Film },
  { nome: "Landing Pages / Sites", desc: "Páginas rápidas, responsivas e pensadas pra converter.", icone: LayoutTemplate },
  { nome: "Google Meu Negócio", desc: "Presença local otimizada — avaliações, fotos e posicionamento.", icone: MapPin },
  { nome: "Consultoria", desc: "Diagnóstico e direção estratégica pro marketing do seu negócio.", icone: Lightbulb },
  { nome: "Apps e soluções digitais", desc: "Ferramentas e sistemas sob medida pra necessidades específicas.", icone: Smartphone },
];

const DIFERENCIAIS = [
  { titulo: "Time enxuto, resposta rápida", texto: "Sem burocracia de agência grande — você fala direto com quem executa." },
  { titulo: "Estratégia antes de execução", texto: "Cada ação tem um porquê, alinhado ao momento do seu negócio." },
  { titulo: "Transparência nos resultados", texto: "Relatórios claros, sem enrolação — você sabe exatamente onde está o investimento." },
  { titulo: "Feito sob medida", texto: "Nada de pacote engessado — o serviço se molda ao que seu negócio precisa." },
];

const PROCESSO = [
  { passo: "01", titulo: "Diagnóstico", texto: "Entendemos seu negócio, seu público e onde você quer chegar." },
  { passo: "02", titulo: "Estratégia", texto: "Montamos o plano — conteúdo, tráfego, ou os dois — com metas claras." },
  { passo: "03", titulo: "Execução", texto: "Produção, publicação e gestão de campanhas no ritmo combinado." },
  { passo: "04", titulo: "Acompanhamento", texto: "Relatórios periódicos e ajuste de rota conforme os resultados." },
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function LandingPage({
  logos,
  depoimentos,
  whatsappAgencia,
}: {
  logos: { nome: string; logoUrl: string }[];
  depoimentos: { id: string; nomeCliente: string; texto: string }[];
  whatsappAgencia: string | null;
}) {
  const linkWhatsapp = whatsappAgencia
    ? `https://wa.me/${whatsappAgencia}?text=${encodeURIComponent("Olá! Vim pelo site da Instaby e queria saber mais sobre os serviços.")}`
    : null;

  return (
    <div className="min-h-screen bg-base text-text">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-base/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
          <div className="flex items-center gap-4">
            <Link href="/link" className="hidden text-sm text-muted hover:text-text sm:block">
              Links
            </Link>
            <Link
              href="/app"
              className="rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm text-muted transition-colors hover:border-accent/30 hover:text-text"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-40"
          style={{ background: "radial-gradient(ellipse at top, rgba(230,57,70,0.18), transparent 70%)" }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent"
          >
            <Sparkles size={12} /> Marketing digital com resultado de verdade
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
          >
            Sua marca merece mais do que postar por postar.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mb-9 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
          >
            A Instaby cuida de estratégia, conteúdo e tráfego pago pra negócios que querem
            crescer com consistência — sem depender de sorte.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-3"
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
              className="flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-muted transition-colors hover:border-accent/30 hover:text-text"
            >
              Ver serviços <ArrowRight size={14} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Quem somos */}
      <section className="border-t border-border/60 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p {...fadeUp()} className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">
            Quem somos
          </motion.p>
          <motion.h2 {...fadeUp(0.05)} className="mb-5 text-2xl font-semibold sm:text-3xl">
            Uma agência enxuta, feita pra empresas que querem atenção de verdade
          </motion.h2>
          <motion.p {...fadeUp(0.1)} className="mx-auto max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            A Instaby nasceu em Araras, SP, com um jeito direto de trabalhar: entender o negócio
            do cliente antes de qualquer criativo ou campanha, e acompanhar de perto cada
            resultado. Cuidamos de social media, tráfego pago, produção de vídeo e presença
            digital — sempre com a estratégia guiando a execução.
          </motion.p>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="border-t border-border/60 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.p {...fadeUp()} className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-accent">
            Serviços
          </motion.p>
          <motion.h2 {...fadeUp(0.05)} className="mb-12 text-center text-2xl font-semibold sm:text-3xl">
            O que a Instaby faz por você
          </motion.h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICOS.map((s, i) => {
              const Icon = s.icone;
              return (
                <motion.div
                  key={s.nome}
                  {...fadeUp((i % 4) * 0.05)}
                  className="rounded-2xl border border-border bg-card/60 p-5 transition-colors hover:border-accent/20"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon size={18} />
                  </div>
                  <p className="mb-1.5 text-sm font-medium text-text">{s.nome}</p>
                  <p className="text-xs leading-relaxed text-muted">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portfólio — preparado pra receber material de verdade depois */}
      <section className="border-t border-border/60 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.p {...fadeUp()} className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-accent">
            Portfólio
          </motion.p>
          <motion.h2 {...fadeUp(0.05)} className="mb-12 text-center text-2xl font-semibold sm:text-3xl">
            Trabalhos em destaque
          </motion.h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.05)}
                className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/30 text-center"
              >
                <Video size={20} className="text-muted/50" />
                <p className="px-6 text-xs text-muted/60">Em breve</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Clientes / depoimentos */}
      {(logos.length > 0 || depoimentos.length > 0) && (
        <section className="border-t border-border/60 px-6 py-20">
          <div className="mx-auto max-w-6xl">
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

      {/* Diferenciais */}
      <section className="border-t border-border/60 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.p {...fadeUp()} className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-accent">
            Diferenciais
          </motion.p>
          <motion.h2 {...fadeUp(0.05)} className="mb-12 text-center text-2xl font-semibold sm:text-3xl">
            Por que trabalhar com a Instaby
          </motion.h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {DIFERENCIAIS.map((d, i) => (
              <motion.div key={d.titulo} {...fadeUp((i % 2) * 0.08)} className="flex gap-3 rounded-2xl border border-border bg-card/60 p-5">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <p className="mb-1 text-sm font-medium text-text">{d.titulo}</p>
                  <p className="text-xs leading-relaxed text-muted">{d.texto}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Processo de trabalho */}
      <section className="border-t border-border/60 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.p {...fadeUp()} className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-accent">
            Como trabalhamos
          </motion.p>
          <motion.h2 {...fadeUp(0.05)} className="mb-12 text-center text-2xl font-semibold sm:text-3xl">
            Processo simples, sem mistério
          </motion.h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            {PROCESSO.map((p, i) => (
              <motion.div key={p.passo} {...fadeUp(i * 0.08)}>
                <p className="mb-2 text-2xl font-semibold text-accent/40">{p.passo}</p>
                <p className="mb-1.5 text-sm font-medium text-text">{p.titulo}</p>
                <p className="text-xs leading-relaxed text-muted">{p.texto}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-border/60 px-6 py-24">
        <motion.div
          {...fadeUp()}
          className="mx-auto max-w-2xl rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-card p-10 text-center"
        >
          <h2 className="mb-3 text-2xl font-semibold sm:text-3xl">Vamos conversar sobre o seu marketing?</h2>
          <p className="mb-7 text-sm leading-relaxed text-muted sm:text-base">
            Conta um pouco sobre seu negócio e a gente te mostra como pode ajudar.
          </p>
          {linkWhatsapp ? (
            <a
              href={linkWhatsapp}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02]"
            >
              <MessageCircle size={16} /> Chamar no WhatsApp
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
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <img src="/logo.png" alt="Instaby" className="h-5 w-auto opacity-60 grayscale" />
          <div className="flex items-center gap-5 text-xs text-muted">
            <Link href="/link" className="hover:text-text">
              Links
            </Link>
            <Link href="/app" className="hover:text-text">
              Painel administrativo
            </Link>
          </div>
          <p className="text-xs text-muted/60">© {new Date().getFullYear()} Instaby Agência</p>
        </div>
      </footer>
    </div>
  );
}
