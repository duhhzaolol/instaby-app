"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { CATEGORIAS_FINANCEIRAS, visualDaCategoriaFinanceira } from "@/lib/categoriasFinanceiras";
import { diaFinanceiro } from "@/lib/datasFinanceiro";

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
  const [recorrente, setRecorrente] = useState(false);
  const [erro, setErro] = useState("");

  const infoCategoria = visualDaCategoriaFinanceira(categoriaFinanceira);
  const ehInvestimento = categoriaFinanceira === "investimento";
  const podeRepetir = !ehInvestimento && categoriaFinanceira !== "transferencia";

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando || !descricao.trim() || valor <= 0) return;
    setErro("");
    if (recorrente && podeRepetir && !vencimento) {
      setErro("Escolha o primeiro vencimento para repetir a conta no mesmo dia de cada mês.");
      return;
    }
    setEnviando(true);
    try {
      const resposta = await fetch("/api/despesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao,
          valor,
          tipo: categoriaFinanceira === "despesa_fixa" ? "fixa" : "flexivel",
          status: "pendente",
          vencimento: vencimento || null,
          categoriaFinanceira,
          categoria: categoria || null,
          clienteId: clienteId || null,
          data: vencimento || diaFinanceiro(new Date(), false),
          recorrente: recorrente && podeRepetir,
          adicionarAoPatrimonio: ehInvestimento && adicionarAoPatrimonio,
        }),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null);
        setErro(dados?.erro || "Não consegui salvar a conta. Confira os dados e tente novamente.");
        return;
      }
      setDescricao("");
      setValor(0);
      setVencimento("");
      setCategoria("");
      setClienteId("");
      setAdicionarAoPatrimonio(false);
      setRecorrente(false);
      setAberto(false);
      router.refresh();
    } catch {
      setErro("Não consegui salvar a conta. Confira a conexão e tente novamente; seus dados foram mantidos.");
    } finally {
      setEnviando(false);
    }
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
    <form onSubmit={salvar} aria-busy={enviando} className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Nova conta a pagar</p>
        <button type="button" aria-label="Fechar nova conta" disabled={enviando} onClick={() => setAberto(false)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40">
          <X size={16} />
        </button>
      </div>

      <fieldset disabled={enviando} className="min-w-0">
      <legend className="sr-only">Dados da conta a pagar</legend>
      <label htmlFor="nova-conta-descricao" className="mb-1 block text-xs text-muted">Descrição da conta</label>
      <input
        id="nova-conta-descricao"
        autoFocus
        required
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="ex: Aluguel, cartão de crédito, fornecedor..."
        disabled={enviando}
        className="mb-3 min-h-11 w-full rounded-xl border border-border bg-base/60 px-3.5 text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      />

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted">Valor
          <div className="mt-1"><CurrencyInput value={valor} onChange={setValor} className="min-h-11" /></div>
        </label>
        <div role="group" aria-label="Primeiro vencimento">
          <p className="mb-1 text-xs text-muted">Vencimento</p>
          <DatePicker value={vencimento} onChange={setVencimento} placeholder="Escolher data" limpavel />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted">Classificação
        <select
          value={categoriaFinanceira}
          onChange={(e) => {
            setCategoriaFinanceira(e.target.value);
            setCategoria("");
            if (["investimento", "transferencia"].includes(e.target.value)) setRecorrente(false);
          }}
          disabled={enviando}
          className="mt-1 min-h-11 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {CATEGORIAS_FINANCEIRAS.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.label}
            </option>
          ))}
        </select>
        </label>
        <label className="block text-xs text-muted">Categoria (opcional)
          <input
            list="sugestoes-conta-pagar"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Categoria (opcional)"
            disabled={enviando}
            className="mt-1 min-h-11 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
          <datalist id="sugestoes-conta-pagar">
            {infoCategoria?.sugestoes.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
      </div>

      {podeRepetir && <label className="mb-4 flex min-h-11 cursor-pointer items-start gap-2.5 py-2 text-sm text-text">
        <input type="checkbox" checked={recorrente} disabled={enviando} onChange={e => setRecorrente(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-accent" />
        <span>Repetir todo mês
          <span className="mt-1 block text-xs text-muted">Cria a próxima conta automaticamente. Cada mês tem seu próprio pagamento; o valor pode ser ajustado.</span>
        </span>
      </label>}

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
        <label className="mb-4 block text-xs text-muted">Cliente (opcional)
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          disabled={enviando}
          className="mt-1 min-h-11 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <option value="">Sem cliente (custo da agência)</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        </label>
      )}

      {erro && <p role="alert" className="mb-3 text-sm text-red-300">{erro}</p>}

      <button
        type="submit"
        disabled={enviando || !descricao.trim() || valor <= 0}
        className="min-h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
      >
        {enviando ? "Salvando..." : "Salvar como pendente"}
      </button>
      </fieldset>
    </form>
  );
}
