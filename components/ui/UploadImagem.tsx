"use client";

import { useState } from "react";
import { UploadCloud, X } from "lucide-react";

export function UploadImagem({
  value,
  onChange,
  pasta,
  tamanhoRecomendado,
  proporcao,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  pasta: string;
  /** ex: "1600 × 900px" — mostrado pra pessoa saber exatamente que tamanho preparar */
  tamanhoRecomendado: string;
  /** ex: "16:9" — opcional, só uma dica visual extra */
  proporcao?: string;
}) {
  const [enviando, setEnviando] = useState(false);

  async function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setEnviando(true);
    const form = new FormData();
    form.append("arquivo", arquivo);
    form.append("pasta", pasta);

    const resposta = await fetch("/api/upload-imagem", { method: "POST", body: form });
    const dados = await resposta.json();
    setEnviando(false);

    if (resposta.ok) onChange(dados.url);
    e.target.value = "";
  }

  return (
    <div>
      <p className="mb-2 text-[11px] text-cyan-300">
        Tamanho recomendado: <strong>{tamanhoRecomendado}</strong>
        {proporcao ? ` (proporção ${proporcao})` : ""}
      </p>

      {value ? (
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Imagem atual" className="h-14 w-14 rounded-lg object-cover" />
          <p className="flex-1 text-xs text-muted">Imagem atual — envie outra pra trocar</p>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-red-400"
            title="Remover imagem"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 text-sm text-muted hover:border-accent/40 hover:text-text">
        {enviando ? (
          "Enviando..."
        ) : (
          <>
            <UploadCloud size={15} /> {value ? "Trocar imagem" : "Escolher imagem"}
          </>
        )}
        <input type="file" accept="image/*" onChange={selecionarArquivo} className="hidden" disabled={enviando} />
      </label>
    </div>
  );
}
