"use client";

import { useState } from "react";
import { Navigation, Loader2 } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

export default function DeslocamentoCalc({
  valorAtual,
  onCalcular,
}: {
  valorAtual: number;
  onCalcular: (valor: number) => void;
}) {
  const [cidade, setCidade] = useState("");
  const [km, setKm] = useState(0);
  const [idaEVolta, setIdaEVolta] = useState(true);
  const [valorKm, setValorKm] = useState(0);
  const [calculando, setCalculando] = useState(false);
  const [erro, setErro] = useState("");

  async function calcular() {
    if (!cidade.trim()) return;
    setCalculando(true);
    setErro("");

    try {
      const resposta = await fetch(`/api/distancia?destino=${encodeURIComponent(cidade)}`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Não consegui calcular — digita o KM manualmente abaixo.");
        setCalculando(false);
        return;
      }

      setKm(dados.kmIda);
      aplicar(dados.kmIda, valorKm, idaEVolta);
    } catch {
      setErro("Não consegui calcular — digita o KM manualmente abaixo.");
    }

    setCalculando(false);
  }

  function aplicar(kmNovo: number, valorKmNovo: number, idaVoltaNovo: boolean) {
    const kmTotal = idaVoltaNovo ? kmNovo * 2 : kmNovo;
    onCalcular(Math.round(kmTotal * valorKmNovo * 100) / 100);
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-base/60 p-2.5">
      <div className="mb-2 flex gap-2">
        <input
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Cidade de destino (ex: Piracicaba, SP)"
          className="h-8 flex-1 rounded-lg border border-border bg-card/60 px-2 text-xs text-text outline-none focus:border-accent/50"
        />
        <button
          type="button"
          onClick={calcular}
          disabled={calculando || !cidade.trim()}
          className="flex h-8 items-center gap-1 rounded-lg bg-accent px-2.5 text-xs font-medium text-white disabled:opacity-40"
        >
          {calculando ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
          Calcular
        </button>
      </div>

      {erro && <p className="mb-2 text-[11px] text-red-400">{erro}</p>}

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[10px] text-muted">KM (ida) — desde Araras/SP</label>
          <input
            type="number"
            step="0.1"
            value={km}
            onChange={(e) => {
              const novo = parseFloat(e.target.value) || 0;
              setKm(novo);
              aplicar(novo, valorKm, idaEVolta);
            }}
            className="h-8 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-muted">Valor por KM</label>
          <CurrencyInput
            value={valorKm}
            onChange={(v) => {
              setValorKm(v);
              aplicar(km, v, idaEVolta);
            }}
          />
        </div>
      </div>

      <label className="flex items-center gap-1.5 text-[11px] text-muted">
        <input
          type="checkbox"
          checked={idaEVolta}
          onChange={(e) => {
            setIdaEVolta(e.target.checked);
            aplicar(km, valorKm, e.target.checked);
          }}
        />
        Ida e volta ({idaEVolta ? (km * 2).toFixed(1) : km.toFixed(1)} km no total)
      </label>
    </div>
  );
}
