"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CIDADES_REGIAO } from "@/lib/cidadesRegiao";

type Local = { nome: string };

const BASE = "Araras, SP";

export default function MapaForm({
  mapaTitulo,
  mapaTexto,
  mapaLocais,
}: {
  mapaTitulo: string | null;
  mapaTexto: string | null;
  mapaLocais: Local[] | null;
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(mapaTitulo || "");
  const [texto, setTexto] = useState(mapaTexto || "");
  // Araras é sempre a base (primeiro item, em destaque no mapa) — o restante
  // da lista salva é o conjunto de cidades marcadas aqui.
  const marcadosIniciais = new Set(
    (mapaLocais && mapaLocais.length > 0 ? mapaLocais : [{ nome: BASE }, { nome: "Limeira, SP" }, { nome: "Rio Claro, SP" }])
      .map((l) => l.nome)
      .filter((n) => n !== BASE)
  );
  const [marcados, setMarcados] = useState<Set<string>>(marcadosIniciais);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function alternar(nome: string) {
    setMarcados((prev) => {
      const novo = new Set(prev);
      if (novo.has(nome)) novo.delete(nome);
      else novo.add(nome);
      return novo;
    });
  }

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    const locais: Local[] = [{ nome: BASE }, ...Array.from(marcados).map((nome) => ({ nome }))];
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteMapaTitulo: titulo || null,
        siteMapaTexto: texto || null,
        siteMapaLocais: locais,
      }),
    });
    setSalvando(false);
    setSalvo(true);
    router.refresh();
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-5">
      <p className="text-[11px] text-muted">
        Seção "Onde a gente atende" — agora é um mapa de verdade (Leaflet, sem custo). A base (Araras) sempre aparece
        em destaque no centro; marque abaixo quais outras cidades da região devem aparecer também, ligadas à base por
        uma linha. Alguma cidade que falta na lista? É só pedir que eu adiciono.
      </p>
      <div>
        <Label>Título da seção</Label>
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Perto de você, ou do outro lado do mapa."
          className="mb-2"
        />
        <Label>Texto de apoio</Label>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={2}
          placeholder="Trabalho remoto, sem fronteira: a base é em Araras, mas o atendimento já passou disso."
        />
      </div>

      <div>
        <Label>Cidades atendidas</Label>
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
          <MapPin size={13} /> {BASE} — base, sempre marcada
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {CIDADES_REGIAO.filter((c) => c.nome !== BASE).map((c) => {
            const ativo = marcados.has(c.nome);
            return (
              <button
                key={c.nome}
                type="button"
                onClick={() => alternar(c.nome)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${
                  ativo
                    ? "border-accent/50 bg-accent/15 text-text"
                    : "border-border bg-base/40 text-muted hover:border-border/80 hover:text-text"
                }`}
              >
                <span
                  className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                    ativo ? "border-accent bg-accent" : "border-muted/50"
                  }`}
                >
                  {ativo && <Check size={9} className="text-white" />}
                </span>
                {c.nome}
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={salvar} disabled={salvando} className="w-full">
        {salvo ? <Check size={14} /> : null} {salvando ? "Salvando..." : salvo ? "Salvo!" : "Salvar mapa"}
      </Button>
    </div>
  );
}
