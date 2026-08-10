"use client";

import { useState } from "react";
import { UploadCloud, Check } from "lucide-react";
import { removerFundoSolido, dataUrlParaFile } from "@/lib/removerFundo";

export function UploadLogo({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [processando, setProcessando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [original, setOriginal] = useState<string | null>(null);
  const [semFundo, setSemFundo] = useState<string | null>(null);
  const [escolha, setEscolha] = useState<"original" | "semFundo">("semFundo");
  const [verCinza, setVerCinza] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState("logo.png");

  function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setNomeArquivo(arquivo.name);
    setProcessando(true);
    setSemFundo(null);

    const urlObjeto = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      const resultado = removerFundoSolido(img);
      setSemFundo(resultado);
      setEscolha(resultado ? "semFundo" : "original");
      setProcessando(false);
      URL.revokeObjectURL(urlObjeto);
    };
    img.src = urlObjeto;

    const reader = new FileReader();
    reader.onload = () => setOriginal(reader.result as string);
    reader.readAsDataURL(arquivo);
  }

  async function confirmar() {
    const dataUrl = escolha === "semFundo" ? semFundo : original;
    if (!dataUrl) return;

    setEnviando(true);
    const file = dataUrlParaFile(dataUrl, nomeArquivo.replace(/\.[^.]+$/, "") + ".png");
    const form = new FormData();
    form.append("arquivo", file);

    const resposta = await fetch("/api/upload-logo", { method: "POST", body: form });
    const dados = await resposta.json();

    setEnviando(false);
    if (resposta.ok) {
      onChange(dados.url);
      setOriginal(null);
      setSemFundo(null);
    }
  }

  return (
    <div>
      {value && !original && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Logo atual" className="h-10 w-10 rounded-lg object-contain" />
          <p className="text-xs text-muted">Logo atual — envie outro arquivo pra trocar</p>
        </div>
      )}

      <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 text-sm text-muted hover:border-accent/40 hover:text-text">
        <UploadCloud size={15} />
        {processando ? "Processando..." : "Escolher arquivo de imagem"}
        <input type="file" accept="image/*" onChange={selecionarArquivo} className="hidden" />
      </label>

      {original && (
        <div className="mt-3 rounded-xl border border-border bg-card/60 p-3">
          <p className="mb-2 text-xs text-muted">
            {semFundo && semFundo !== original
              ? "Detectei um fundo sólido e já tentei remover — escolha qual usar:"
              : "Não achei um fundo sólido uniforme pra remover — pode usar assim mesmo:"}
          </p>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEscolha("original")}
              className={`flex flex-col items-center gap-2 rounded-lg border p-3 ${
                escolha === "original" ? "border-accent/50 bg-accent/5" : "border-border"
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded bg-[repeating-conic-gradient(#2a2a2a_0_25%,transparent_0_50%)] bg-[length:10px_10px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={original}
                  alt="Original"
                  className={`max-h-14 max-w-14 object-contain ${verCinza ? "grayscale" : ""}`}
                />
              </div>
              <span className="text-[10px] text-muted">Original</span>
            </button>
            {semFundo && (
              <button
                type="button"
                onClick={() => setEscolha("semFundo")}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 ${
                  escolha === "semFundo" ? "border-accent/50 bg-accent/5" : "border-border"
                }`}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded bg-[repeating-conic-gradient(#2a2a2a_0_25%,transparent_0_50%)] bg-[length:10px_10px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={semFundo}
                    alt="Sem fundo"
                    className={`max-h-14 max-w-14 object-contain ${verCinza ? "grayscale" : ""}`}
                  />
                </div>
                <span className="text-[10px] text-muted">Fundo removido</span>
              </button>
            )}
          </div>

          <label className="mb-3 flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={verCinza} onChange={(e) => setVerCinza(e.target.checked)} />
            Ver como fica em cinza (vitrine dos orçamentos)
          </label>

          <button
            type="button"
            onClick={confirmar}
            disabled={enviando}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-accent text-sm font-medium text-white disabled:opacity-50"
          >
            <Check size={14} /> {enviando ? "Enviando..." : "Usar este logo"}
          </button>
        </div>
      )}
    </div>
  );
}
