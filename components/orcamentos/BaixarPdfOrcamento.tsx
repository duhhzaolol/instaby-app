"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function BaixarPdfOrcamento({
  slug,
  itens,
  disabled = false,
  publico = false,
  className = "",
}: {
  slug: string;
  itens?: { id: string; quantidade: number }[];
  disabled?: boolean;
  publico?: boolean;
  className?: string;
}) {
  const emAndamento = useRef(false);
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState("");

  async function baixar() {
    if (emAndamento.current || disabled) return;
    emAndamento.current = true;
    setBaixando(true);
    setErro("");
    try {
      const resposta = await fetch(`/api/orcamento/${encodeURIComponent(slug)}/pdf`, itens ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: itens.map(({ id, quantidade }) => ({ id, quantidade })) }),
      } : { cache: "no-store" });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null);
        throw new Error(typeof dados?.erro === "string" ? dados.erro : "Não foi possível gerar o PDF. Tente novamente.");
      }
      if (!resposta.headers.get("Content-Type")?.includes("application/pdf")) {
        throw new Error("A resposta não contém o PDF. Atualize a página e tente novamente.");
      }
      const arquivo = await resposta.blob();
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      link.href = url;
      link.download = resposta.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || "orcamento-instaby.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      // O Safari precisa que o arquivo continue disponível enquanto inicia o download.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (falha) {
      setErro(falha instanceof Error && !(falha instanceof TypeError) ? falha.message : "Não foi possível baixar. Confira sua conexão e tente novamente.");
    } finally {
      emAndamento.current = false;
      setBaixando(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled || baixando}
        aria-busy={baixando}
        onClick={baixar}
        className={publico ? "w-full border border-white/15 bg-transparent text-[#F9FAFB] hover:bg-white/5 focus-visible:outline-white" : ""}
      >
        <Download size={15} aria-hidden="true" />
        {baixando ? "Gerando PDF…" : "Baixar PDF"}
      </Button>
      {erro && <p role="alert" className={`mt-2 max-w-sm text-xs leading-relaxed ${publico ? "text-[#FCA5A5]" : "text-danger-text"}`}>{erro}</p>}
    </div>
  );
}
