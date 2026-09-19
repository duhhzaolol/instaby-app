"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { CATEGORIAS_FINANCEIRAS, visualDaCategoriaFinanceira } from "@/lib/categoriasFinanceiras";

type Cliente = { id: string; nome: string };

export function NovaContaPagarForm({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [vencimento, setVencimento] = useState("");
  const [categoriaFinanceira, setCategoriaFinanceira] = useState("despesa_fixa");
  const [categoria, setCategoria] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [adicionarAoPatrimonio, setAdicionarAoPatrimonio] = useState(false);

  const infoCategoria = visualDaCategoriaFinanceira(categoriaFinanceira);
  const ehInvestimento = categoriaFinanceira === "investimento";

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim() || valor <= 0) return;
    setEnviando(true);
    await fetch("/api/despesas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao,
        valor,
        status: "pendente",
        vencimento: vencimento || null,
        categoriaFinanceira,
        categoria: categoria || null,
        clienteId: clienteId || null,
        // Data local do navegador (não UTC) — depois das 21h (horário de Brasília),
        // toISOString() já cai no dia seguinte e a despesa nascia com a data errada.
        data: vencimento || new Date().toLocaleDateString("en-CA"),
        adicionarAoPatrimonio: ehInvestimento && adicionarAoPatrimonio,
      }),
    });
    setEnviando(false);
    setDescricao("");
    setValor(0);
    setVencimento("");
    setCategoria("");
    setClienteId("");
    setAdicionarAoPatrimonio(false);
    setAberto(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mb-5 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-accent/30 bg-accent/5 py-3 text-sm font-medium text-accent hover:bg-accent/10"
      >
        <Plus size={15} /> Nova conta a pagar
      </button>
    );
  }

  return (
    <form onSubmit={salvar} className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Nova conta a pagar</p>
        <button type="button" onClick={() => setAberto(false)} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>

      <input
        autoFocus
        required
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="ex: Aluguel, cartão de crédito, fornecedor..."
        className="mb-3 h-10 w-full rounded-xl border border-border bg-base/60 px-3.5 text-sm text-text"
      />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <CurrencyInput value={valor} onChange={setValor} />
        <DatePicker value={vencimento} onChange={setVencimento} placeholder="Vencimento" limpavel />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <select
          value={categoriaFinanceira}
          onChange={(e) => {
            setCategoriaFinanceira(e.target.value);
            setCategoria("");
          }}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          {CATEGORIAS_FINANCEIRAS.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.label}
            </option>
          ))}
        </select>
        <div>
          <input
            list="sugestoes-conta-pagar"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Categoria (opcional)"
            className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
          />
          <datalist id="sugestoes-conta-pagar">
            {infoCategoria?.sugestoes.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      {ehInvestimento && (
        <label className="mb-4 flex items-start gap-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-100">
          <input
            type="checkbox"
            checked={adicionarAoPatrimonio}
            onChange={(e) => setAdicionarAoPatrimonio(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-cyan-500"
          />
          <span>
            Adicionar este item ao patrimônio da empresa?{" "}
            <span className="text-cyan-200/70">
              Cria um bem em Financeiro → Patrimônio com valor de aquisição R$ {valor.toFixed(0) || "0"}.
            </span>
          </span>
        </label>
      )}

      {clientes.length > 0 && (
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="mb-4 h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          <option value="">Sem cliente (custo da agência)</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      )}

      <button
        type="submit"
        disabled={enviando || !descricao.trim() || valor <= 0}
        className="h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        {enviando ? "Salvando..." : "Salvar como pendente"}
      </button>
    </form>
  );
}
