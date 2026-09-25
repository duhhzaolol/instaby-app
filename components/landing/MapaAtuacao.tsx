"use client";

// Seção "onde a gente atende" — inspirada no mapa "perto de você" do site de
// referência, mas sem nenhuma API de mapa de verdade por trás: é uma
// ilustração (SVG + CSS), não uma localização geográfica real. O primeiro
// item da lista é sempre a base (Araras) e fica no centro, brilhando mais
// forte; os demais orbitam ao redor, ligados por uma linha. Depois dos locais
// reais, sempre sobra 1-2 "slots" vazios tracejados — só pra sugerir
// visualmente que tem espaço pra mais clientes, sem escrever isso em lugar
// nenhum.
//
// As posições (x, y) dos pinos são fixas no código (uma tabela de "slots"),
// não guardadas no banco — o que se guarda é só o nome de cada local, na
// ordem. Isso evita pedir pra pessoa preencher coordenadas geográficas.

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

type Local = { nome: string };

// Coordenadas dentro de um viewBox 400×250 (proporção 8:5, igual ao
// container). Índice 0 da lista de locais cai sempre no SLOT_PRINCIPAL,
// centralizado; os demais preenchem SLOTS_SECUNDARIOS em ordem.
const SLOT_PRINCIPAL = { x: 200, y: 125 };
const SLOTS_SECUNDARIOS = [
  { x: 88, y: 68 },
  { x: 322, y: 56 },
  { x: 66, y: 192 },
  { x: 330, y: 196 },
  { x: 200, y: 26 },
  { x: 200, y: 228 },
];

const LOCAIS_PADRAO: Local[] = [{ nome: "Araras, SP" }, { nome: "Limeira, SP" }, { nome: "Estados Unidos" }];

export function MapaAtuacao({
  titulo,
  texto,
  locais,
}: {
  titulo?: string | null;
  texto?: string | null;
  locais?: Local[] | null;
}) {
  const lista = locais && locais.length > 0 ? locais : LOCAIS_PADRAO;
  const principal = lista[0];
  const secundarios = lista.slice(1);
  const secundariosPosicionados = secundarios.slice(0, SLOTS_SECUNDARIOS.length).map((local, i) => ({
    local,
    pos: SLOTS_SECUNDARIOS[i],
  }));
  // 1-2 slots vazios logo depois dos locais reais, só pra sugerir espaço sobrando
  const vagos = SLOTS_SECUNDARIOS.slice(secundariosPosicionados.length, secundariosPosicionados.length + 2);

  return (
    <section className="bg-[#08080a] py-16 sm:py-20">
      <div className="mx-auto mb-10 max-w-6xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-2 text-xs font-medium uppercase tracking-wider text-accent"
        >
          Onde a gente atende
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="max-w-lg text-2xl font-semibold text-white sm:text-3xl"
        >
          {titulo || "Perto de você, ou do outro lado do mapa."}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-2 max-w-xl text-sm leading-relaxed text-white/60"
        >
          {texto || "Trabalho remoto, sem fronteira: a base é em Araras, mas o atendimento já passou disso."}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto aspect-[8/5] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0f]"
      >
        {/* textura de fundo tipo "curvas de nível" — puramente decorativa */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 34px, rgba(255,255,255,0.035) 35px, rgba(255,255,255,0.035) 36px)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(230,57,70,0.16), transparent 65%)" }}
        />

        <svg aria-hidden viewBox="0 0 400 250" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {secundariosPosicionados.map(({ pos }, i) => (
            <motion.line
              key={i}
              x1={SLOT_PRINCIPAL.x}
              y1={SLOT_PRINCIPAL.y}
              x2={pos.x}
              y2={pos.y}
              stroke="rgba(230,57,70,0.45)"
              strokeWidth={1}
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.15 }}
            />
          ))}
        </svg>

        {/* pino principal — base da agência */}
        <div
          className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
          style={{ left: `${(SLOT_PRINCIPAL.x / 400) * 100}%`, top: `${(SLOT_PRINCIPAL.y / 250) * 100}%` }}
        >
          <span className="absolute h-12 w-12 animate-ping rounded-full bg-accent/30 sm:h-14 sm:w-14" />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-accent bg-accent/20 text-accent shadow-[0_0_20px_rgba(230,57,70,0.5)] sm:h-11 sm:w-11">
            <MapPin size={16} />
          </span>
          <span className="whitespace-nowrap rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm sm:text-xs">
            {principal.nome}
          </span>
        </div>

        {/* pinos secundários — clientes atendidos fora da base */}
        {secundariosPosicionados.map(({ local, pos }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.15 }}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
            style={{ left: `${(pos.x / 400) * 100}%`, top: `${(pos.y / 250) * 100}%` }}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white/80 backdrop-blur-sm sm:h-7 sm:w-7">
              <MapPin size={12} />
            </span>
            <span className="whitespace-nowrap rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-white/70 backdrop-blur-sm sm:text-[10px]">
              {local.nome}
            </span>
          </motion.div>
        ))}

        {/* slots vagos — sugerem espaço sobrando pra mais clientes */}
        {vagos.map((pos, i) => (
          <div
            key={i}
            aria-hidden
            className="absolute z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/15 sm:h-6 sm:w-6"
            style={{ left: `${(pos.x / 400) * 100}%`, top: `${(pos.y / 250) * 100}%` }}
          />
        ))}
      </motion.div>
    </section>
  );
}
