"use client";

import { useState } from "react";
import { Download, MessageCircle, Check } from "lucide-react";

export function BotaoBaixarPdf() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-[#F9FAFB] hover:bg-white/5"
    >
      <Download size={14} /> Baixar PDF
    </button>
  );
}

export function ComentarioCliente({ relatorioId, comentarioAtual }: { relatorioId: string; comentarioAtual: string }) {
  const [comentario, setComentario] = useState(comentarioAtual);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    setSalvando(true);
    await fetch(`/api/relatorios/${relatorioId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comentarioCliente: comentario }),
    });
    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111827]/50 p-5 print:hidden">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#F9FAFB]">
        <MessageCircle size={14} className="text-[#E63946]" /> O que você achou desse período?
      </p>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        rows={2}
        placeholder="Escreva seu comentário aqui..."
        className="mb-2 w-full rounded-xl border border-white/10 bg-[#0B0D12] px-3 py-2 text-sm text-[#F9FAFB] outline-none placeholder:text-[#6B7280] focus:border-[#E63946]/50"
      />
      <button
        onClick={salvar}
        disabled={salvando}
        className="flex items-center gap-1.5 rounded-lg bg-[#E63946] px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
      >
        {salvo ? <Check size={12} /> : null}
        {salvo ? "Salvo" : salvando ? "Salvando..." : "Enviar comentário"}
      </button>
    </div>
  );
}
