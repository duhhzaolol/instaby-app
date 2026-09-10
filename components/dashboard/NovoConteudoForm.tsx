"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { FORMATOS_CONTEUDO } from "@/lib/conteudoVisual";
import { DatePicker } from "@/components/ui/DatePicker";
import { REDES } from "@/lib/redesSociais";

type Cliente = { id: string; nome: string; cor: string | null };

export function NovoConteudoForm({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [formato, setFormato] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [redes, setRedes] = useState<string[]>([]);
  const [dataPublicacao, setDataPublicacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  function alternarRede(r: string) {
    setRedes((atual) => (atual.includes(r) ? atual.filter((x) => x !== r) : [...atual, r]));
  }

  function limpar() {
    setTitulo("");
    setClienteId("");
    setFormato("");
    setObjetivo("");
    setRedes([]);
    setDataPublicacao("");
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setEnviando(true);
    await fetch("/api/conteudos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        clienteId: clienteId || null,
        formato: formato || null,
        objetivo: objetivo || null,
        redes,
        dataPublicacao: dataPublicacao || null,
      }),
    });
    setEnviando(false);
    limpar();
    setAberto(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mb-5 flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus size={15} /> Novo conteúdo
      </button>
    );
  }

  return (
    <form onSubmit={salvar} className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Novo conteúdo</p>
        <button type="button" onClick={() => setAberto(false)} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>

      <input
        autoFocus
        required
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título — ex: Reel — Conheça a SkyFit"
        className="mb-3 h-10 w-full rounded-xl border border-border bg-base/60 px-3.5 text-sm text-text"
      />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          <option value="">Sem cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <select
          value={formato}
          onChange={(e) => setFormato(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          <option value="">Formato</option>
          {FORMATOS_CONTEUDO.map((f) => (
            <option key={f.valor} value={f.valor}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {REDES.map((r) => (
          <button
            key={r.valor}
            type="button"
            onClick={() => alternarRede(r.valor)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              redes.includes(r.valor) ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-muted"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <textarea
        value={objetivo}
        onChange={(e) => setObjetivo(e.target.value)}
        rows={2}
        placeholder="Objetivo (opcional)"
        className="mb-3 w-full rounded-xl border border-border bg-base/60 px-3.5 py-2.5 text-sm text-text"
      />

      <label className="mb-1 block text-xs text-muted">Data de publicação prevista</label>
      <DatePicker value={dataPublicacao} onChange={setDataPublicacao} placeholder="Ainda não sei" className="mb-4" limpavel />

      <button
        type="submit"
        disabled={enviando || !titulo.trim()}
        className="h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        {enviando ? "Criando..." : "Criar conteúdo"}
      </button>
    </form>
  );
}
