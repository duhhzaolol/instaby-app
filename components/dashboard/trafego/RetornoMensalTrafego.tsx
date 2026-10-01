"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  calcularRetornoTrafego,
  type RetornoTrafegoView,
  type VendaTrafego,
} from "@/lib/retornoTrafego";
import { formatarDataRelatorio } from "@/lib/dataRelatorio";
const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function RetornoMensalTrafego({
  clienteId,
  mes,
  dataRelatorio,
  gasto,
  inicial,
}: {
  clienteId: string;
  mes: string;
  dataRelatorio: string;
  gasto: number;
  inicial: RetornoTrafegoView | null;
}) {
  const router = useRouter();
  const [salvo, setSalvo] = useState(inicial);
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState<VendaTrafego[]>(inicial?.itens || []);
  const [apuradoAte, setApuradoAte] = useState(
    inicial?.apuradoAte || dataRelatorio.slice(0, 10),
  );
  const [observacoes, setObservacoes] = useState(inicial?.observacoes || "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const resumo = salvo?.itens.length
    ? calcularRetornoTrafego(salvo.itens, gasto)
    : null;
  const datasIguais = salvo?.apuradoAte === dataRelatorio.slice(0, 10);
  function alterar(id: string, campos: Partial<VendaTrafego>) {
    setItens((lista) =>
      lista.map((item) => (item.id === id ? { ...item, ...campos } : item)),
    );
  }
  function adicionar() {
    setItens((lista) => [
      ...lista,
      {
        id: crypto.randomUUID(),
        descricao: "",
        quantidade: 1,
        valorUnitario: 0,
        valorTotal: 0,
        custos: null,
      },
    ]);
  }
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      const resp = await fetch(`/api/clientes/${clienteId}/retorno-trafego`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, apuradoAte, itens, observacoes }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.erro || "Não foi possível salvar.");
      setSalvo(json);
      setItens(json.itens);
      setAberto(false);
      router.refresh();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }
  return (
    <section className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-text">
            Vendas e retorno do mês
          </p>
          <p className="text-xs text-muted">
            Registre as vendas confirmadas do cliente. Esses dados ficam salvos
            e entram nos próximos relatórios desse mês.
          </p>
        </div>
        <button
          onClick={() => setAberto(!aberto)}
          className="rounded-lg bg-accent px-3 py-2 text-xs text-white"
        >
          {aberto
            ? "Fechar edição"
            : salvo
              ? "Editar vendas"
              : "Registrar vendas"}
        </button>
      </div>
      {resumo && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-muted">
            Vendas apuradas até {formatarDataRelatorio(salvo!.apuradoAte)} ·{" "}
            {resumo.quantidade} vendas
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted">Receita das vendas</p>
              <p className="font-semibold text-text">{moeda(resumo.receita)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Ticket médio</p>
              <p className="font-semibold text-text">
                {resumo.ticketMedio == null ? "—" : moeda(resumo.ticketMedio)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">
                Retorno por real em anúncios (ROAS)
              </p>
              <p className="font-semibold text-text">
                {datasIguais && resumo.roas != null
                  ? `${resumo.roas.toFixed(2)}x`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">
                Receita menos mídia, antes de outros custos
              </p>
              <p className="font-semibold text-text">
                {datasIguais ? moeda(resumo.receitaMenosMidia) : "—"}
              </p>
            </div>
          </div>
          {datasIguais && resumo.lucroEstimado != null && (
            <p className="mt-2 text-sm text-text">
              Lucro estimado após custos informados e mídia:{" "}
              {moeda(resumo.lucroEstimado)} · margem{" "}
              {resumo.margemEstimada?.toFixed(1)}%
            </p>
          )}
          {!datasIguais && (
            <p className="mt-2 text-xs text-amber-400">
              Para comparar receita e anúncios, atualize a apuração de vendas e
              importe o relatório até a mesma data.
            </p>
          )}
          <div className="mt-2 text-xs text-muted">
            {salvo!.itens.map((i) => (
              <p key={i.id}>
                {i.descricao} · {i.quantidade} vendas · {moeda(i.valorTotal)}
              </p>
            ))}
          </div>
        </div>
      )}
      {aberto && (
        <form onSubmit={salvar} className="mt-4 space-y-3">
          <label className="block text-xs text-muted">
            Vendas acumuladas do dia 1 até
            <DatePicker value={apuradoAte} onChange={setApuradoAte} />
          </label>
          {itens.map((i) => (
            <div key={i.id} className="rounded-xl border border-border p-3">
              <input
                aria-label="Descrição da venda"
                value={i.descricao}
                onChange={(e) => alterar(i.id, { descricao: e.target.value })}
                placeholder="Ex.: Plano de 3 meses ou pedidos de lanches"
                className="mb-2 h-10 w-full rounded-lg border border-border bg-base px-3 text-sm text-text"
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-muted">
                  Quantidade vendida
                  <input
                    aria-label="Quantidade vendida"
                    type="number"
                    min={1}
                    step={1}
                    value={i.quantidade}
                    onChange={(e) =>
                      alterar(i.id, { quantidade: Number(e.target.value) })
                    }
                    className="h-10 w-full rounded-lg border border-border bg-base px-3 text-sm text-text"
                  />
                </label>
                <label className="text-xs text-muted">
                  Como informar o valor
                  <select
                    value={i.valorUnitario == null ? "variavel" : "fixo"}
                    onChange={(e) =>
                      alterar(i.id, {
                        valorUnitario: e.target.value === "fixo" ? 0 : null,
                      })
                    }
                    className="h-10 w-full rounded-lg border border-border bg-base px-2 text-xs text-text"
                  >
                    <option value="fixo">Mesmo preço por venda</option>
                    <option value="variavel">
                      Valores variados — informar total
                    </option>
                  </select>
                </label>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-xs text-muted">
                  {i.valorUnitario == null
                    ? "Total recebido pelas vendas"
                    : "Preço de cada venda"}
                  <CurrencyInput
                    value={i.valorUnitario ?? i.valorTotal}
                    onChange={(v) =>
                      alterar(
                        i.id,
                        i.valorUnitario == null
                          ? { valorTotal: v }
                          : { valorUnitario: v },
                      )
                    }
                  />
                </label>
                <div className="text-xs text-muted">
                  Receita calculada
                  <p className="mt-3 text-sm font-medium text-text">
                    {moeda(
                      i.valorUnitario == null
                        ? i.valorTotal
                        : i.quantidade * i.valorUnitario,
                    )}
                  </p>
                </div>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={i.custos != null}
                  onChange={(e) =>
                    alterar(i.id, { custos: e.target.checked ? 0 : null })
                  }
                />
                Informar custo total dessas vendas para estimar lucro
              </label>
              {i.custos != null && (
                <CurrencyInput
                  value={i.custos}
                  onChange={(v) => alterar(i.id, { custos: v })}
                  placeholder="Custo total das vendas"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      "Remover este tipo de venda? A remoção será aplicada ao salvar.",
                    )
                  )
                    setItens((lista) => lista.filter((x) => x.id !== i.id));
                }}
                className="mt-2 text-xs text-red-400"
              >
                Remover linha
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={adicionar}
            className="rounded-lg border border-border px-3 py-2 text-xs text-text"
          >
            Adicionar tipo de venda
          </button>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Descrição da promoção e observações sobre as vendas"
            rows={2}
            className="w-full rounded-lg border border-border bg-base px-3 py-2 text-sm text-text"
          />
          <p className="text-xs text-muted">
            Informe o acumulado completo do mês. Editar substitui as vendas
            salvas desse mês; importar CSV não altera essas informações.
          </p>
          {erro && (
            <p role="alert" className="text-xs text-red-400">
              {erro}
            </p>
          )}
          <button
            disabled={enviando}
            className="rounded-lg bg-accent px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            {enviando ? "Salvando..." : "Salvar vendas e retorno"}
          </button>
        </form>
      )}
    </section>
  );
}
