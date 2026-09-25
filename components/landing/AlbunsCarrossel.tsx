"use client";

// Álbuns — reaproveita os trabalhos já cadastrados em Configurações → Site →
// Portfólio (mesmo model CaseTrabalho de sempre), só que exibidos num banner
// deslizante contínuo (mesmo padrão de "marquee" em CSS já usado no orçamento em
// PDF pros logos de clientes) em vez da grade estática. Cresce sozinho conforme
// mais trabalhos são cadastrados — nada aqui é fixo no código.

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Video } from "lucide-react";

type CaseItem = {
  id: string;
  nome: string;
  categoria: string | null;
  imagemUrl: string | null;
  imagemFoco: string | null;
  link: string | null;
};

// Tira de filme — perfuração em cima e embaixo do carrossel. Furos de verdade
// (retângulos com canto arredondado, bem nítidos, sobre uma base preta bem mais
// escura que o fundo da seção) em vez de um degradê radial suave — que ficava
// perto demais do tom de fundo e sumia de tão sutil. Repete um número alto de
// furos com largura fixa (não "esticando" pra preencher a largura) pra sempre
// tampar a tela inteira, do celular ao monitor mais largo, sem precisar
// calcular quantos cabem em cada tamanho.
function TiraDeFilme() {
  return (
    <div aria-hidden className="h-6 w-full overflow-hidden bg-black sm:h-7">
      <div className="flex h-full w-max items-center gap-3.5 px-2 sm:gap-4">
        {Array.from({ length: 100 }).map((_, i) => (
          <span key={i} className="h-3 w-5 shrink-0 rounded-[3px] bg-white/80 sm:h-3.5 sm:w-7" />
        ))}
      </div>
    </div>
  );
}

export function AlbunsCarrossel({
  cases,
  titulo,
  texto,
}: {
  cases: CaseItem[];
  titulo?: string | null;
  texto?: string | null;
}) {
  const comImagem = cases.filter((c) => c.imagemUrl);

  return (
    <section id="portfolio" className="bg-base py-16 sm:py-20">
      <div className="mx-auto mb-8 max-w-6xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-2 text-xs font-medium uppercase tracking-wider text-accent"
        >
          Álbuns
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="max-w-lg text-2xl font-semibold sm:text-3xl"
        >
          {titulo || "Trabalhos que falam por nós."}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-2 max-w-xl text-sm leading-relaxed text-muted"
        >
          {texto || "Cada projeto é uma parceria. Mais que posts, entregamos posicionamento, conteúdo e resultado."}
        </motion.p>
      </div>

      {comImagem.length === 0 ? (
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/30 text-center"
              >
                <Video size={20} className="text-muted/50" />
                <p className="px-6 text-xs text-muted/60">Em breve</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="group overflow-hidden">
          {/* tira de filme — perfuração em cima e embaixo do carrossel, pra reforçar
              a ideia de "rolo de filme" que os álbuns já sugerem */}
          <TiraDeFilme />
          <div
            className="flex w-max gap-4 px-6 animate-marquee-esquerda group-hover:[animation-play-state:paused]"
            style={{ animationDuration: `${Math.max(comImagem.length * 7, 26)}s` }}
          >
            {[...comImagem, ...comImagem].map((c, i) => {
              const destino = c.link || `/portfolio/${c.id}`;
              const externo = !!c.link;
              const cartao = (
                <div className="group/card relative aspect-[3/4] w-[220px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card/30 sm:w-[268px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.imagemUrl!}
                    alt={c.nome}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.06]"
                    style={{ objectPosition: c.imagemFoco || "50% 50%" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                  <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{c.nome}</p>
                      {c.categoria && <p className="truncate text-[10px] text-white/60">{c.categoria}</p>}
                    </div>
                    <ArrowUpRight size={14} className="shrink-0 text-white/70" />
                  </div>
                </div>
              );
              // key inclui o índice pq a lista é duplicada (mesma id aparece 2x, lado a lado)
              return externo ? (
                <a key={`${c.id}-${i}`} href={destino} target="_blank" className="shrink-0">
                  {cartao}
                </a>
              ) : (
                <Link key={`${c.id}-${i}`} href={destino} className="shrink-0">
                  {cartao}
                </Link>
              );
            })}
          </div>
          <TiraDeFilme />
        </div>
      )}
    </section>
  );
}
