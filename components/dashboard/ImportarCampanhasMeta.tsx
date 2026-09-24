"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, X, Check, AlertTriangle } from "lucide-react";
import { importarCampanhasMeta, type ResultadoImportacaoMeta } from "@/lib/parseCampanhasMeta";

type Cliente = { id: string; nome: string };

export default function ImportarCampanhasMeta({
  clientes,
  clienteFixo,
}: {
  clientes: Cliente[];
  clienteFixo?: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [clienteId, setClienteId] = useState(clienteFixo || "");
  const [lendo, setLendo] = useState(false);
  const [importando, setImportando] = useState(false);
  const [dados, setDados] = useState<ResultadoImportacaoMeta | null>(null);
  const [resultado, setResultado] = useState<{ campanhasCriadas: number; resultadosImportados: number } | null>(null);
  const [erroArquivo, setErroArquivo] = useState("");

  async function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setLendo(true);
    setResultado(null);
    setErroArquivo("");

    try {
      const lido = await importarCampanhasMeta(arquivo);
      if (!lido || lido.linhas.length === 0) {
        setErroArquivo("Não consegui reconhecer campanhas nesse arquivo — confere se é o export do Gerenciador de Anúncios.");
        setDados(null);
      } else {
        setDados(lido);
      }
    } catch {
      setErroArquivo("Não consegui processar esse arquivo — confere se é CSV ou Excel exportado direto do Meta.");
      setDados(null);
    }

    setLendo(false);
    e.target.value = "";
  }

  async function importar() {
    if (!dados || !clienteId) return;
    setImportando(true);
    const resp = await fetch("/api/campanhas/importar-meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId, linhas: dados.linhas }),
    });
    setImportando(false);
    if (resp.ok) {
      const json = await resp.json();
      setResultado(json);
      setDados(null);
      router.refresh();
    } else {
      setErroArquivo("Não consegui importar — tenta de novo em alguns segundos.");
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/40 py-2.5 text-xs text-muted hover:border-accent/40 hover:text-text"
      >
        <UploadCloud size={13} /> Importar do Meta Ads
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Importar campanhas do Meta Ads</p>
        <button
          onClick={() => {
            setAberto(false);
            setDados(null);
            setResultado(null);
            setErroArquivo("");
          }}
          className="text-muted hover:text-text"
        >
          <X size={16} />
        </button>
      </div>

      {!clienteFixo && (
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="mb-3 h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          <option value="">Selecione o cliente desse arquivo</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      )}

      <label className="mb-2 flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-base/60 text-xs text-muted hover:border-accent/40 hover:text-text">
        <UploadCloud size={13} />
        {lendo ? "Lendo arquivo..." : "Escolher CSV ou Excel exportado do Gerenciador de Anúncios"}
        <input type="file" accept=".csv,.xlsx,.xls" onChange={selecionarArquivo} className="hidden" />
      </label>

      <p className="mb-2 text-[11px] text-muted">
        Exporta em "Relatórios" &gt; Exportar, de preferência com o detalhamento por{" "}
        <span className="font-medium text-text">Dia</span> ativado — assim reimportar depois nunca conta o mesmo
        gasto duas vezes, mesmo com períodos que se sobrepõem.
      </p>

      {erroArquivo && (
        <p className="mb-2 flex items-center gap-1 text-[11px] text-red-400">
          <AlertTriangle size={11} /> {erroArquivo}
        </p>
      )}

      {dados && (
        <div className="mb-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
          <p className="flex items-center gap-1 text-[11px] text-emerald-400">
            <Check size={11} />
            {dados.linhas.length} linha(s) reconhecida(s)
            {dados.linhasIgnoradas > 0 && `, ${dados.linhasIgnoradas} ignorada(s)`}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            {dados.diaADia
              ? "Detalhamento por dia detectado — import 100% seguro contra duplicação."
              : "Esse arquivo parece ser um resumo por período (sem detalhamento por dia). Reimportar o mesmo período exato substitui, mas períodos diferentes que se sobrepõem podem somar gasto em dobro."}
          </p>
          <button
            onClick={importar}
            disabled={importando || !clienteId}
            className="mt-2 h-9 w-full rounded-xl bg-accent text-xs font-semibold text-white disabled:opacity-40"
          >
            {importando ? "Importando..." : !clienteId ? "Selecione o cliente" : "Confirmar importação"}
          </button>
        </div>
      )}

      {resultado && (
        <p className="flex items-center gap-1 text-[11px] text-emerald-400">
          <Check size={11} />
          Importado: {resultado.campanhasCriadas} campanha(s) nova(s), {resultado.resultadosImportados} período(s)
          de resultado atualizado(s).
        </p>
      )}
    </div>
  );
}
