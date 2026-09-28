"use client";

// Seção "onde a gente atende" — mapa real (Leaflet + tiles escuros gratuitos
// da CARTO, sem chave de API nenhuma), trocando a versão v124 que era só uma
// ilustração (SVG com posições fixas, sem geografia de verdade) — ele
// reportou que a versão antiga "não parecia os Estados Unidos" (o local de
// exemplo do padrão), ou seja, não lia como um mapa real.
//
// O que continua igual: o primeiro item de `locais` é sempre a base (Araras),
// vem maior/em destaque com anel pulsante; os demais são pinos secundários
// menores, ligados à base por uma linha tracejada vermelha. O que muda: a
// posição de cada pino agora é a coordenada real da cidade (lib/cidadesRegiao.ts),
// não mais um "slot" decorativo — por isso o mapa lê como geografia de
// verdade (dá pra reconhecer a região de Campinas/Araras de cara).
//
// Continuamos só guardando o NOME de cada local no banco (Configuracao.
// siteMapaLocais, sem mudança de schema) — a coordenada vem do casamento
// desse nome com a tabela curada. Ícones de pino são feitos na mão (L.divIcon)
// em vez do ícone padrão do Leaflet, que depende de arquivos de imagem que
// não resolvem certo dentro do bundler do Next — assim também fica com a
// cara da marca (vermelho, brilho) em vez do pino genérico azul do Leaflet.

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";
import { coordenadaDe } from "@/lib/cidadesRegiao";

type Local = { nome: string };

const LOCAIS_PADRAO: Local[] = [{ nome: "Araras, SP" }, { nome: "Limeira, SP" }, { nome: "Rio Claro, SP" }];

// Tiles escuros gratuitos (CARTO Dark Matter) — sem necessidade de chave de
// API, atribuição obrigatória (linha pequena, discreta, exigida pelos termos
// de uso gratuito da CARTO/OpenStreetMap).
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';

function pinoHtml(destaque: boolean, nome: string) {
  // divIcon aceita só HTML puro (não é React) — replica o visual dos pinos
  // vermelho (base) / branco translúcido (secundário) que já existiam na
  // versão ilustrativa, agora sobre coordenada real.
  if (destaque) {
    return `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;transform:translateY(-6px)">
        <span style="position:absolute;top:0;height:44px;width:44px;border-radius:9999px;background:rgba(230,57,70,0.35);animation:instaby-ping 2s cubic-bezier(0,0,0.2,1) infinite"></span>
        <span style="position:relative;display:flex;height:34px;width:34px;align-items:center;justify-content:center;border-radius:9999px;border:2px solid #E63946;background:rgba(230,57,70,0.25);box-shadow:0 0 20px rgba(230,57,70,0.55)">
          <span style="height:9px;width:9px;border-radius:9999px;background:#E63946"></span>
        </span>
        <span style="white-space:nowrap;border-radius:9999px;background:rgba(0,0,0,0.72);padding:3px 9px;font-size:11px;font-weight:600;color:#fff;backdrop-filter:blur(4px)">${nome}</span>
      </div>`;
  }
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:5px;transform:translateY(-4px)">
      <span style="display:flex;height:22px;width:22px;align-items:center;justify-content:center;border-radius:9999px;border:1px solid rgba(255,255,255,0.45);background:rgba(255,255,255,0.12);backdrop-filter:blur(3px)">
        <span style="height:6px;width:6px;border-radius:9999px;background:rgba(255,255,255,0.85)"></span>
      </span>
      <span style="white-space:nowrap;border-radius:9999px;background:rgba(0,0,0,0.65);padding:2px 7px;font-size:10px;color:rgba(255,255,255,0.75);backdrop-filter:blur(3px)">${nome}</span>
    </div>`;
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const camadaRef = useRef<any>(null);

  // Cria o mapa uma única vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelado = false;
    import("leaflet").then((L) => {
      if (cancelado || !containerRef.current || mapRef.current) return;
      const mapa = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
        dragging: true,
      }).setView([-22.45, -47.45], 9);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19, subdomains: "abcd" }).addTo(mapa);
      L.control.zoom({ position: "bottomright" }).addTo(mapa);
      mapRef.current = mapa;
      // dispara o desenho inicial dos pinos assim que o mapa existir
      desenhar(L);
    });
    return () => {
      cancelado = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redesenha pinos/linhas sempre que a lista de locais mudar.
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => desenhar(L));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(lista)]);

  function desenhar(L: any) {
    const mapa = mapRef.current;
    if (!mapa) return;
    if (camadaRef.current) {
      camadaRef.current.remove();
    }
    const grupo = L.layerGroup().addTo(mapa);
    camadaRef.current = grupo;

    const pontos = lista
      .map((local, i) => ({ local, coord: coordenadaDe(local.nome), destaque: i === 0 }))
      .filter((p): p is { local: Local; coord: { lat: number; lng: number }; destaque: boolean } => !!p.coord);

    if (pontos.length === 0) return;

    const base = pontos.find((p) => p.destaque) || pontos[0];

    pontos.forEach((p) => {
      if (!p.destaque) {
        L.polyline(
          [
            [base.coord.lat, base.coord.lng],
            [p.coord.lat, p.coord.lng],
          ],
          { color: "#E63946", weight: 1.5, opacity: 0.45, dashArray: "4 6" }
        ).addTo(grupo);
      }
    });

    pontos.forEach((p) => {
      const icone = L.divIcon({
        html: pinoHtml(p.destaque, p.local.nome),
        className: "",
        iconSize: [0, 0],
      });
      L.marker([p.coord.lat, p.coord.lng], { icon: icone, zIndexOffset: p.destaque ? 1000 : 0 }).addTo(grupo);
    });

    if (pontos.length === 1) {
      mapa.setView([pontos[0].coord.lat, pontos[0].coord.lng], 10);
    } else {
      const bounds = L.latLngBounds(pontos.map((p) => [p.coord.lat, p.coord.lng]));
      mapa.fitBounds(bounds, { padding: [48, 48] });
    }
  }

  return (
    <section className="bg-base py-16 sm:py-20">
      <style>{`@keyframes instaby-ping{75%,100%{transform:scale(1.7);opacity:0}}
        .leaflet-control-attribution{background:rgba(0,0,0,0.55) !important;color:rgba(255,255,255,0.45) !important;font-size:9px !important;backdrop-filter:blur(3px)}
        .leaflet-control-attribution a{color:rgba(255,255,255,0.6) !important}
        .leaflet-control-zoom a{background:rgba(0,0,0,0.55) !important;color:#fff !important;border-color:rgba(255,255,255,0.15) !important}`}</style>
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[500]"
          style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)" }}
        />
        <div ref={containerRef} className="absolute inset-0" />
      </motion.div>
    </section>
  );
}
