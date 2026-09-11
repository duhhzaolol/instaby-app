"use client";

import { useState } from "react";
import { Check, MessageSquareWarning } from "lucide-react";

export function AcoesAprovacao({ token }: { token: string }) {
  const [modo, setModo] = useState<"nada" | "aprovar" | "alterar" | "feito">("nada");
  const [nome, setNome] = useState("");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function aprovar() {
    setEnviando(true);
    await fetch(`/api/aprovacao/${token}/aprovar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome || null }),
    });
    setEnviando(false);
    setModo("feito");
  }

  async function solicitarAlteracao() {
    if (!comentario.trim()) return;
    setEnviando(true);
    await fetch(`/api/aprovacao/${token}/solicitar-alteracao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comentario }),
    });
    setEnviando(false);
    setModo("feito");
  }

  if (modo === "feito") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
        <p className="text-sm text-emerald-300">Recebido! A Instaby já foi avisada.</p>
      </div>
    );
  }

  if (modo === "aprovar") {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#111827]/50 p-5">
        <p className="mb-2 text-sm text-[#F9FAFB]">Seu nome (opcional, pra registrar quem aprovou)</p>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mb-3 h-10 w-full rounded-xl border border-white/10 bg-[#0B0D12] px-3 text-sm text-[#F9FAFB] outline-none"
        />
        <button
          onClick={aprovar}
          disabled={enviando}
          className="h-10 w-full rounded-xl bg-emerald-500 text-sm font-medium text-white disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Confirmar aprovação"}
        </button>
      </div>
    );
  }

  if (modo === "alterar") {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#111827]/50 p-5">
        <p className="mb-2 text-sm text-[#F9FAFB]">O que precisa mudar?</p>
        <textarea
          autoFocus
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
          placeholder="ex: trocar a cena dos 00:12"
          className="mb-3 w-full rounded-xl border border-white/10 bg-[#0B0D12] px-3 py-2 text-sm text-[#F9FAFB] outline-none"
        />
        <button
          onClick={solicitarAlteracao}
          disabled={enviando || !comentario.trim()}
          className="h-10 w-full rounded-xl bg-[#E63946] text-sm font-medium text-white disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar pedido de alteração"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setModo("aprovar")}
        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-sm font-medium text-white hover:opacity-90"
      >
        <Check size={16} /> Aprovar
      </button>
      <button
        onClick={() => setModo("alterar")}
        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 text-sm font-medium text-[#F9FAFB] hover:bg-white/5"
      >
        <MessageSquareWarning size={16} /> Pedir alteração
      </button>
    </div>
  );
}
