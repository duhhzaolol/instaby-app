"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Local = { nome: string };

const LOCAIS_PADRAO: Local[] = [{ nome: "Araras, SP" }, { nome: "Limeira, SP" }, { nome: "Estados Unidos" }];

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
  const [locais, setLocais] = useState<Local[]>(mapaLocais && mapaLocais.length > 0 ? mapaLocais : LOCAIS_PADRAO);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function atualizarNome(i: number, valor: string) {
    setLocais((prev) => prev.map((item, idx) => (idx === i ? { nome: valor } : item)));
  }

  function adicionar() {
    setLocais((prev) => [...prev, { nome: "" }]);
  }

  function remover(i: number) {
    setLocais((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteMapaTitulo: titulo || null,
        siteMapaTexto: texto || null,
        siteMapaLocais: locais.filter((l) => l.nome.trim()),
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
        Seção "Onde a gente atende" — um mapa ilustrativo (não é um mapa real, não precisa de endereço completo), com
        um pino pra cada cidade ou cliente. O primeiro da lista é sempre a base e aparece em destaque, no centro; os
        outros orbitam ao redor, ligados por uma linha. Dá pra adicionar quantos quiser conforme a carteira cresce.
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

      <div className="flex flex-col gap-2">
        {locais.map((local, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1">
              <Label>{i === 0 ? "Base (fica no centro do mapa)" : `Local ${i + 1}`}</Label>
              <Input
                value={local.nome}
                onChange={(e) => atualizarNome(i, e.target.value)}
                placeholder={i === 0 ? "Araras, SP" : 'Cidade, ou "Estados Unidos", por exemplo'}
              />
            </div>
            {i > 0 && (
              <Button variant="danger" size="sm" onClick={() => remover(i)} className="shrink-0" title="Remover local">
                <Trash2 size={13} />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button variant="secondary" onClick={adicionar} className="w-full">
        <Plus size={14} /> Adicionar local
      </Button>

      <Button onClick={salvar} disabled={salvando} className="w-full">
        {salvo ? <Check size={14} /> : null} {salvando ? "Salvando..." : salvo ? "Salvo!" : "Salvar mapa"}
      </Button>
    </div>
  );
}
