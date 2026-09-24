"use client";

// Os 3 pilares em destaque, logo após o Hero: Tráfego Pago (carro-chefe, bloco
// maior, com espaço pra indicadores/resultados) + Criação de Conteúdo e Captação
// (lado a lado, menores). O restante dos serviços (fotos em estúdio etc.) continua
// na grade completa de Serviços, logo depois desta seção — só não vem primeiro.

import { motion } from "framer-motion";
import { Megaphone, Sparkles, Video, ArrowRight, ArrowUpRight, TrendingUp, Play } from "lucide-react";
import { ElementoFlutuante, IconeFlutuanteMini } from "./FloatingGear";

type Indicador = { valor: string; legenda: string };
type Pilar = { nome: string; texto: string; indicadores?: Indicador[] };

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function PilaresCarroChefe({ pilares, linkContato }: { pilares: Pilar[]; linkContato: string }) {
  const trafego = pilares[0];
  const conteudo = pilares[1];
  const captacao = pilares[2];
  const indicadoresValidos = (trafego?.indicadores || []).filter((i) => i.valor?.trim() && i.legenda?.trim());

  return (
    <section className="relative overflow-hidden bg-[#0b0b0d] px-6 py-16 sm:py-20">
      <ElementoFlutuante className="right-[4%] top-[8%] hidden lg:block" duracao={9}>
        <IconeFlutuanteMini Icon={TrendingUp} />
      </ElementoFlutuante>
      <ElementoFlutuante className="left-[3%] bottom-[10%] hidden lg:block" duracao={7.5} delay={0.8}>
        <IconeFlutuanteMini Icon={Play} />
      </ElementoFlutuante>

      <div className="relative mx-auto max-w-6xl">
        <motion.p {...fadeUp()} className="mb-2 text-xs font-medium uppercase tracking-wider text-accent">
          O que a gente faz de verdade
        </motion.p>
        <motion.h2 {...fadeUp(0.05)} className="mb-10 max-w-lg text-2xl font-semibold sm:text-3xl">
          Três frentes, um único foco: o resultado do seu negócio.
        </motion.h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Tráfego Pago — carro-chefe, bloco maior */}
          <motion.div
            {...fadeUp(0.1)}
            className="group relative overflow-hidden rounded-2xl border border-accent/25 p-7 lg:col-span-3 lg:p-9"
            style={{ background: "linear-gradient(145deg, rgba(230,57,70,0.14), rgba(11,11,13,0.4) 55%)" }}
          >
            <div
              aria-hidden
              className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
              style={{ background: "radial-gradient(circle, rgba(230,57,70,0.5), transparent 70%)" }}
            />
            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white shadow-glow">
                  <Megaphone size={20} />
                </span>
                <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Carro-chefe
                </span>
              </div>
              <h3 className="mb-3 text-2xl font-semibold text-white sm:text-3xl">{trafego?.nome || "Tráfego Pago"}</h3>
              <p className="mb-6 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
                {trafego?.texto ||
                  "Campanhas no Meta Ads e Google Ads com estratégia, teste e otimização constante — o motor que traz cliente novo pro seu negócio todos os dias."}
              </p>

              {indicadoresValidos.length > 0 && (
                <div className="mb-7 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-5">
                  {indicadoresValidos.map((ind, i) => (
                    <div key={i}>
                      <p className="text-xl font-semibold text-white">{ind.valor}</p>
                      <p className="text-xs text-white/50">{ind.legenda}</p>
                    </div>
                  ))}
                </div>
              )}

              <a
                href={linkContato}
                target={linkContato.startsWith("http") ? "_blank" : undefined}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02]"
              >
                Turbinar meu tráfego <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>

          {/* Criação de Conteúdo + Captação — lado a lado, menores */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
            <motion.a
              href="#servicos"
              {...fadeUp(0.15)}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
            >
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors group-hover:bg-accent group-hover:text-white">
                <Sparkles size={17} />
              </span>
              <h3 className="mb-2 text-lg font-medium text-white">{conteudo?.nome || "Criação de Conteúdo"}</h3>
              <p className="mb-3 text-sm leading-relaxed text-white/60">
                {conteudo?.texto || "Planejamento e produção de conteúdo com identidade — o que sua marca fala, mostra e posta no dia a dia."}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Saiba mais <ArrowUpRight size={12} />
              </span>
            </motion.a>

            <motion.a
              href="#servicos"
              {...fadeUp(0.2)}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
            >
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors group-hover:bg-accent group-hover:text-white">
                <Video size={17} />
              </span>
              <h3 className="mb-2 text-lg font-medium text-white">{captacao?.nome || "Captação"}</h3>
              <p className="mb-3 text-sm leading-relaxed text-white/60">
                {captacao?.texto || "Fotos e vídeos com direção e equipamento profissional — em estúdio ou externa, prontos pra virar conteúdo e campanha."}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Saiba mais <ArrowUpRight size={12} />
              </span>
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
}
