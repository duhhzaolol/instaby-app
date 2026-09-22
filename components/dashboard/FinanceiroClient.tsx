"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, Wallet, AlertTriangle, MessageCircle, Landmark, Gem, ArrowRightLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { CountUp } from "@/components/ui/CountUp";
import { DespesaRow, DespesaRowData } from "@/components/dashboard/DespesaRow";
import { CATEGORIAS_FINANCEIRAS, STATUS_DESPESA, visualDaCategoriaFinanceira } from "@/lib/categoriasFinanceiras";
import { CalendarioFinanceiro } from "@/components/dashboard/CalendarioFinanceiro";
import { AjudaContextual } from "@/components/ui/AjudaContextual";

type Cliente = { id: string; nome: string };
type CobrancaPendente = {
  id: string;
  cliente: string;
  clienteWhatsapp: string | null;
  valor: number;
  status: string;
  vencimento: string | null;
};

import { PERIODOS_FINANCEIRO } from "@/lib/periodoFinanceiro";

function diasParaVencer(vencimento: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(vencimento);
  venc.setHours(0, 0, 0, 0);
  return Math.round((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default function FinanceiroClient({
  periodo,
  resumo,
  grafico,
  graficoDiario,
  cobrancasPendentes,
  custosFixos,
  custosFlexiveis,
  clientes,
  resumoPorCliente,
  movimentosMes,
  mesAtual,
  anoAtual,
  caixa,
}: {
  periodo: string;
  resumo: { entradas: number; despesasFixas: number; despesasFlexiveis: number; lucro: number };
  grafico: { mes: string; entradas: number; despesasFixas: number; despesasFlexiveis: number }[];
  graficoDiario: { dia: number; entradas: number; lucro: number }[] | null;
  cobrancasPendentes: CobrancaPendente[];
  custosFixos: DespesaRowData[];
  custosFlexiveis: DespesaRowData[];
  clientes: Cliente[];
  resumoPorCliente: { nome: string; cor: string | null; entradas: number; despesas: number; lucro: number }[];
  movimentosMes: { dia: number; tipo: "entrada" | "saida"; valor: number; descricao: string; cliente: string | null }[];
  mesAtual: number;
  anoAtual: number;
  caixa?: { saldoAtual: number; resultadoDoMes: number; variacaoCaixaMes: number; patrimonioTotal: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formAberto, setFormAberto] = useState<"fixa" | "flexivel" | null>(null);
  const [formRapidoAberto, setFormRapidoAberto] = useState(searchParams.get("nova") === "despesa");
  const [personDesde, setPersonDesde] = useState("");
  const [personAte, setPersonAte] = useState("");

  function mudarPeriodo(novo: string) {
    if (novo === "personalizado") return; // espera preencher as datas
    router.push(`/dashboard/financeiro?periodo=${novo}`);
  }

  function aplicarPersonalizado() {
    if (!personDesde || !personAte) return;
    router.push(`/dashboard/financeiro?periodo=personalizado&desde=${personDesde}&ate=${personAte}`);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-lg font-medium text-text">
            Financeiro
            <AjudaContextual
              titulo="Financeiro"
              texto="Visão geral de entradas, custos e lucro no período escolhido. O calendário mostra dia a dia o que entrou e saiu. Cobranças e despesas ficam abaixo, separadas por tipo."
              exemplo="Ex.: clique num dia do calendário pra ver todos os recebimentos e pagamentos daquele dia."
            />
          </p>
          <p className="text-xs text-muted">Visão geral · a DRE está no menu ao lado</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODOS_FINANCEIRO.map((p) => (
            <button
              key={p.valor}
              onClick={() => mudarPeriodo(p.valor)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                periodo === p.valor ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
              }`}
            >
              {p.label}
            </button>
          ))}
          {periodo === "personalizado" && (
            <div className="flex items-center gap-1.5">
              <DatePicker value={personDesde} onChange={setPersonDesde} className="w-36" />
              <span className="text-xs text-muted">até</span>
              <DatePicker value={personAte} onChange={setPersonAte} className="w-36" />
              <button
                onClick={aplicarPersonalizado}
                className="h-8 rounded-lg bg-accent px-3 text-xs font-medium text-white"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setFormRapidoAberto((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-accent/30 bg-accent/5 py-3 text-sm font-medium text-accent hover:bg-accent/10"
        >
          <Plus size={15} /> Lançar despesa
        </button>
        {formRapidoAberto && (
          <div className="mt-3">
            <NovaDespesaForm tipo="flexivel" clientes={clientes} onSalvo={() => setFormRapidoAberto(false)} />
          </div>
        )}
      </div>

      {/* Alerta de cobranças vencendo/vencidas */}
      {cobrancasPendentes.some((c) => c.vencimento && diasParaVencer(c.vencimento) <= 0) && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-medium text-text">Tem cobrança vencendo hoje ou atrasada</p>
            <p className="text-xs text-muted">Confira a lista de pendentes embaixo e considera lembrar o cliente.</p>
          </div>
        </div>
      )}

      {caixa && (
        <div className="mb-6">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-text">
            Panorama financeiro
            <AjudaContextual
              titulo="Panorama financeiro"
              texto="Saldo atual e Patrimônio são acumulados desde sempre. Resultado do mês vem da DRE (lucro/prejuízo da operação). Variação de caixa é quanto o dinheiro realmente entrou ou saiu no mês, incluindo compras de equipamento — por isso pode ser diferente do resultado da DRE."
              exemplo="Ex.: lucro de R$ 5.000 na DRE + compra de câmera de R$ 4.000 à vista = variação de caixa de R$ 1.000 no mês."
            />
          </p>
          <p className="mb-3 text-xs text-muted">Saldo e patrimônio são acumulados; resultado e variação são do mês atual.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Card index={0} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-muted">Saldo atual</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Landmark size={14} />
                </div>
              </div>
              <p className="text-2xl font-medium text-text">
                <CountUp value={caixa.saldoAtual} prefix="R$ " />
              </p>
              <p className="mt-1 text-[11px] text-muted">Quanto existe disponível nas contas da empresa.</p>
            </Card>
            <Card index={1} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-muted">Resultado do mês</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  {caixa.resultadoDoMes >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                </div>
              </div>
              <p className={`text-2xl font-medium ${caixa.resultadoDoMes >= 0 ? "text-text" : "text-red-400"}`}>
                <CountUp
                  value={Math.abs(caixa.resultadoDoMes)}
                  prefix={caixa.resultadoDoMes >= 0 ? "+R$ " : "−R$ "}
                />
              </p>
              <p className="mt-1 text-[11px] text-muted">Lucro apresentado pela DRE.</p>
            </Card>
            <Card index={2} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-muted">Variação de caixa</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ArrowRightLeft size={14} />
                </div>
              </div>
              <p className={`text-2xl font-medium ${caixa.variacaoCaixaMes >= 0 ? "text-text" : "text-red-400"}`}>
                <CountUp
                  value={Math.abs(caixa.variacaoCaixaMes)}
                  prefix={caixa.variacaoCaixaMes >= 0 ? "+R$ " : "−R$ "}
                />
              </p>
              <p className="mt-1 text-[11px] text-muted">Quanto seu dinheiro realmente mudou no mês.</p>
            </Card>
            <Card index={3} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-muted">Patrimônio</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <Gem size={14} />
                </div>
              </div>
              <p className="text-2xl font-medium text-text">
                <CountUp value={caixa.patrimonioTotal} prefix="R$ " />
              </p>
              <Link href="/dashboard/financeiro/patrimonio" className="mt-1 block text-[11px] text-accent hover:underline">
                Valor estimado dos ativos cadastrados →
              </Link>
            </Card>
          </div>
        </div>
      )}

      <p className="mb-2 text-xs text-muted">
        Só considera o que já foi recebido/pago de fato — pode ser diferente da soma das listas aqui embaixo, que
        mostram também cobrança e despesa ainda pendente ou atrasada.
      </p>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Card index={0} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">Entradas</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={14} />
            </div>
          </div>
          <p className="text-2xl font-medium text-text">
            <CountUp value={resumo.entradas} prefix="R$ " />
          </p>
        </Card>
        <Card index={1} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">Custos fixos</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
              <TrendingDown size={14} />
            </div>
          </div>
          <p className="text-2xl font-medium text-text">
            <CountUp value={resumo.despesasFixas} prefix="R$ " />
          </p>
        </Card>
        <Card index={2} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">Custos flexíveis</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <TrendingDown size={14} />
            </div>
          </div>
          <p className="text-2xl font-medium text-text">
            <CountUp value={resumo.despesasFlexiveis} prefix="R$ " />
          </p>
        </Card>
        <Card index={3} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">Lucro</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Wallet size={14} />
            </div>
          </div>
          <p className="text-2xl font-medium text-text">
            <CountUp value={resumo.lucro} prefix="R$ " />
          </p>
        </Card>
      </div>

      {resumoPorCliente.length > 0 && (
        <Card index={4} hoverable={false} className="mb-6 p-5">
          <p className="mb-1 text-sm font-medium text-text">Resumo por cliente</p>
          <p className="mb-4 text-xs text-muted">
            O que entrou, o que saiu com despesas dele, e o lucro — no período selecionado.
          </p>
          <div className="flex flex-col gap-2">
            {resumoPorCliente.map((c) => (
              <div key={c.nome} className="flex items-center justify-between rounded-xl bg-base/60 px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-sm text-text">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.cor || "#9CA3AF" }} />
                  {c.nome}
                </span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-emerald-400">+R$ {c.entradas.toFixed(0)}</span>
                  {c.despesas > 0 && <span className="text-red-400">−R$ {c.despesas.toFixed(0)}</span>}
                  <span
                    className={`min-w-[70px] text-right font-medium ${c.lucro >= 0 ? "text-accent" : "text-red-400"}`}
                  >
                    R$ {c.lucro.toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card index={5} hoverable={false} className="mb-6 p-5">
        <p className="mb-1 text-sm font-medium text-text">Calendário financeiro</p>
        <p className="mb-4 text-xs text-muted">Recebimentos e pagamentos já lançados no mês — clique num dia pra ver o detalhe.</p>
        <CalendarioFinanceiro movimentos={movimentosMes} mes={mesAtual} ano={anoAtual} />
      </Card>

      <Card index={5} hoverable={false} className="mb-6 p-5">
        <p className="mb-4 text-sm font-medium text-text">Cobranças pendentes</p>
        <div className="flex flex-col gap-2">
          {cobrancasPendentes.length === 0 && <p className="text-sm text-muted">Nada pendente — tudo em dia.</p>}
          {cobrancasPendentes.map((c) => {
            const dias = c.vencimento ? diasParaVencer(c.vencimento) : null;
            const vencido = dias !== null && dias < 0;
            const venceHoje = dias === 0;
            const linkWhatsapp = c.clienteWhatsapp
              ? `https://wa.me/${c.clienteWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                  dias === null
                    ? `Oi ${c.cliente}! Passando pra falar sobre o pagamento em aberto.`
                    : vencido
                    ? `Oi ${c.cliente}! Passando pra lembrar que seu boleto está atrasado há ${Math.abs(dias)} dia(s).`
                    : venceHoje
                    ? `Oi ${c.cliente}! Passando pra lembrar que seu boleto vence hoje.`
                    : `Oi ${c.cliente}! Passando pra lembrar que seu boleto vencerá em ${dias} dia(s).`
                )}`
              : null;

            return (
              <div
                key={c.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 ${
                  vencido || venceHoje ? "bg-red-500/5" : "bg-base/60"
                }`}
              >
                <div>
                  <p className="text-sm text-text">
                    {c.cliente} · R$ {c.valor.toFixed(0)}
                  </p>
                  <p className={`text-xs ${vencido || venceHoje ? "text-red-400" : "text-muted"}`}>
                    {dias === null
                      ? "sem data"
                      : vencido
                      ? `atrasado há ${Math.abs(dias)} dia(s)`
                      : venceHoje
                      ? "vence hoje"
                      : `faltam ${dias} dia(s)`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={c.status === "atrasado" || vencido ? "red" : "yellow"}>
                    {c.status === "atrasado" ? "Atrasado" : "Pendente"}
                  </Badge>
                  {linkWhatsapp && (
                    <a
                      href={linkWhatsapp}
                      target="_blank"
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <MessageCircle size={12} /> Lembrar
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card index={6} hoverable={false} className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Custos operacionais</p>
              <p className="text-xs text-muted">Aluguel, água, luz, internet, ferramentas...</p>
            </div>
            <button
              onClick={() => setFormAberto(formAberto === "fixa" ? null : "fixa")}
              className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <Plus size={12} /> Novo
            </button>
          </div>
          {formAberto === "fixa" && (
            <NovaDespesaForm tipo="fixa" clientes={clientes} onSalvo={() => setFormAberto(null)} />
          )}
          <div className="flex flex-col gap-2">
            {custosFixos.length === 0 && <p className="text-sm text-muted">Nenhum custo fixo lançado ainda.</p>}
            {custosFixos.map((d, i) => (
              <DespesaRow key={d.id} despesa={d} index={i} />
            ))}
          </div>
        </Card>

        <Card index={7} hoverable={false} className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Custos flexíveis</p>
              <p className="text-xs text-muted">Retiradas avulsas — material, equipamento, comida...</p>
            </div>
            <button
              onClick={() => setFormAberto(formAberto === "flexivel" ? null : "flexivel")}
              className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <Plus size={12} /> Novo
            </button>
          </div>
          {formAberto === "flexivel" && (
            <NovaDespesaForm tipo="flexivel" clientes={clientes} onSalvo={() => setFormAberto(null)} />
          )}
          <div className="flex flex-col gap-2">
            {custosFlexiveis.length === 0 && <p className="text-sm text-muted">Nenhum custo flexível lançado ainda.</p>}
            {custosFlexiveis.map((d, i) => (
              <DespesaRow key={d.id} despesa={d} index={i} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function NovaDespesaForm({
  tipo,
  clientes,
  onSalvo,
}: {
  tipo: "fixa" | "flexivel";
  clientes: Cliente[];
  onSalvo: () => void;
}) {
  const router = useRouter();
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [clienteId, setClienteId] = useState("");
  // Data local do navegador (não UTC) — depois das 21h (horário de Brasília),
  // toISOString() já cai no dia seguinte e o formulário abria com a data errada.
  const [data, setData] = useState(new Date().toLocaleDateString("en-CA"));
  const [recorrente, setRecorrente] = useState(tipo === "fixa");
  const [categoriaFinanceira, setCategoriaFinanceira] = useState(
    tipo === "fixa" ? "despesa_fixa" : "despesa_variavel"
  );
  const [categoria, setCategoria] = useState("");
  const [status, setStatus] = useState("pago");
  const [vencimento, setVencimento] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [adicionarAoPatrimonio, setAdicionarAoPatrimonio] = useState(false);

  const infoCategoria = visualDaCategoriaFinanceira(categoriaFinanceira);
  const ehInvestimento = categoriaFinanceira === "investimento";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    await fetch("/api/despesas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao,
        valor,
        clienteId: tipo === "fixa" ? null : clienteId || null,
        data,
        tipo,
        categoriaFinanceira,
        categoria: categoria || null,
        status,
        vencimento: vencimento || null,
        dataPagamento: status === "pago" ? dataPagamento || data : null,
        recorrente: tipo === "fixa" ? recorrente : false,
        adicionarAoPatrimonio: ehInvestimento && adicionarAoPatrimonio,
      }),
    });

    setEnviando(false);
    onSalvo();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-xl border border-border bg-base/60 p-3">
      <Label>Descrição</Label>
      <Input
        required
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder={tipo === "fixa" ? "Aluguel, internet, ferramenta..." : "Papel, equipamento, comida..."}
        className="mb-2"
      />

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <Label>Classificação</Label>
          <select
            value={categoriaFinanceira}
            onChange={(e) => {
              setCategoriaFinanceira(e.target.value);
              setCategoria("");
            }}
            className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          >
            {CATEGORIAS_FINANCEIRAS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Categoria</Label>
          <input
            list={`sugestoes-${categoriaFinanceira}`}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="ex: Aluguel"
            className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          />
          <datalist id={`sugestoes-${categoriaFinanceira}`}>
            {infoCategoria?.sugestoes.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      {categoriaFinanceira === "transferencia" && (
        <p className="mb-2 text-[11px] text-muted">
          Retiradas e transferências não entram na conta de lucro/despesa — ficam registradas só pra
          controle.
        </p>
      )}

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <Label>Status</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          >
            {STATUS_DESPESA.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {(status === "pendente" || status === "atrasado") && (
          <div>
            <Label>Vencimento</Label>
            <DatePicker value={vencimento} onChange={setVencimento} />
          </div>
        )}
        {status === "pago" && (
          <div>
            <Label>Data do pagamento (se diferente)</Label>
            <DatePicker value={dataPagamento} onChange={setDataPagamento} />
          </div>
        )}
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <CurrencyInput value={valor} onChange={setValor} />
        <div>
          <label className="mb-1 block text-[11px] text-muted">Data de competência</label>
          <DatePicker value={data} onChange={setData} />
        </div>
      </div>
      {ehInvestimento && (
        <label className="mb-3 flex items-start gap-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5 text-xs text-cyan-100">
          <input
            type="checkbox"
            checked={adicionarAoPatrimonio}
            onChange={(e) => setAdicionarAoPatrimonio(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-cyan-500"
          />
          <span>Adicionar este item ao patrimônio da empresa?</span>
        </label>
      )}
      {tipo === "fixa" ? (
        <label className="mb-3 flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2.5 text-xs text-text">
          <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} />
          Ativar cobrança recorrente — aparece sozinha todo mês, sem precisar preencher de novo
        </label>
      ) : (
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="mb-2 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
        >
          <option value="">Sem cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      )}
      <Button type="submit" size="sm" disabled={enviando || valor <= 0} className="w-full">
        {enviando ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
