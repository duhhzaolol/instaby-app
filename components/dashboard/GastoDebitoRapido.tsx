"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Copy, Smartphone, X } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { CATEGORIAS_FINANCEIRAS } from "@/lib/categoriasFinanceiras";
import { diaFinanceiro } from "@/lib/datasFinanceiro";

const URL_REGISTRAR_GASTO = "https://instaby-app.vercel.app/dashboard/financeiro/registrar-gasto";
const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
type Cliente = { id: string; nome: string };
type Confirmacao = { id: string; descricao: string; valor: number; reutilizado: boolean };

function AjudaLembreteIphone() {
  const [copiado, setCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState("");

  async function copiarLink() {
    setCopiado(false);
    setErroCopia("");
    try {
      await navigator.clipboard.writeText(URL_REGISTRAR_GASTO);
      setCopiado(true);
    } catch {
      setErroCopia("Não foi possível copiar automaticamente. Selecione e copie o link abaixo.");
    }
  }

  return (
    <details className="mt-6 rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-text">
        <Smartphone size={17} className="text-accent" /> Ativar lembrete no iPhone
        <ChevronDown size={16} className="ml-auto text-muted" />
      </summary>
      <div className="mt-4 space-y-4 text-sm text-muted">
        <p>Configure uma vez no seu iPhone para receber um lembrete quando aproximar o cartão de débito no Apple Pay. Toque no lembrete para abrir o cadastro; se a compra for pessoal, basta ignorar. A ativação precisa ser feita no próprio aparelho.</p>
        <div className="rounded-xl border border-border bg-base/60 p-3">
          <p className="mb-2 text-xs font-medium text-text">Link para colocar na automação</p>
          <p className="select-text break-all text-xs leading-5">{URL_REGISTRAR_GASTO}</p>
          <button type="button" onClick={copiarLink} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-xs font-medium text-text hover:bg-hover">
            {copiado ? <Check size={15} /> : <Copy size={15} />}{copiado ? "Link copiado" : "Copiar link"}
          </button>
          {copiado && <p role="status" className="mt-2 text-xs text-emerald-400">O link foi copiado.</p>}
          {erroCopia && <p role="alert" className="mt-2 text-xs text-red-400">{erroCopia}</p>}
        </div>
        <ol className="list-decimal space-y-3 pl-5 leading-6">
          <li>Abra <strong className="font-medium text-text">Atalhos → Automação → +</strong>.</li>
          <li>Escolha <strong className="font-medium text-text">Carteira / Transação</strong> e selecione seu cartão de débito em <strong className="font-medium text-text">Quando eu aproximar</strong>.</li>
          <li>Escolha <strong className="font-medium text-text">Executar após confirmação</strong> ou mantenha <strong className="font-medium text-text">Perguntar Antes de Executar</strong> ligado. Assim você pode ignorar o lembrete sem abrir o aplicativo.</li>
          <li>Avance e escolha <strong className="font-medium text-text">Automação em branco</strong>.</li>
          <li>Adicione a ação <strong className="font-medium text-text">URL</strong> e cole o link acima.</li>
          <li>Adicione <strong className="font-medium text-text">Abrir URLs</strong> depois da ação URL e conclua a automação.</li>
        </ol>
        <p className="text-xs leading-5">Os nomes podem variar conforme a versão do iOS. Se preferir abrir o formulário diretamente, escolha “Executar imediatamente”. Você preenche valor e descrição: a automação não importa o extrato. Ignorar o lembrete não envia nada; no formulário, “Não registrar” descarta os campos.</p>
        <p className="text-xs leading-5">Veja o suporte da Apple sobre <a href="https://support.apple.com/pt-br/guide/shortcuts/apd65c67538a/ios" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">transações por aproximação</a> e <a href="https://support.apple.com/pt-br/guide/shortcuts/apd602971e63/ios" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">execução automática</a>.</p>
      </div>
    </details>
  );
}

export default function GastoDebitoRapido({ clientes, dataInicial }: { clientes: Cliente[]; dataInicial: string }) {
  const [valor, setValor] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(dataInicial);
  const [clienteId, setClienteId] = useState("");
  const [categoriaFinanceira, setCategoriaFinanceira] = useState("despesa_variavel");
  const [categoria, setCategoria] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const [descartado, setDescartado] = useState(false);
  const [confirmacaoPendente, setConfirmacaoPendente] = useState(false);
  const idempotenciaId = useRef<string | null>(null);
  const envioEmAndamento = useRef(false);
  const sugestoes = CATEGORIAS_FINANCEIRAS.find(c => c.valor === categoriaFinanceira)?.sugestoes || [];

  function limparFormulario() {
    setValor(0);
    setDescricao("");
    setData(diaFinanceiro(new Date(), false));
    setClienteId("");
    setCategoriaFinanceira("despesa_variavel");
    setCategoria("");
    setErro("");
    setSessaoExpirada(false);
    setConfirmacao(null);
    idempotenciaId.current = null;
  }

  function descartar() {
    if (envioEmAndamento.current) return;
    limparFormulario();
    setDescartado(true);
  }

  function registrarOutro() {
    limparFormulario();
    setDescartado(false);
    setConfirmacaoPendente(false);
  }

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (envioEmAndamento.current || confirmacao || descartado) return;
    if (!Number.isFinite(valor) || valor <= 0 || !descricao.trim() || !data) {
      setErro("Preencha o valor, a descrição e a data da compra.");
      return;
    }
    envioEmAndamento.current = true;
    setSalvando(true);
    setErro("");
    setSessaoExpirada(false);
    try {
      // A mesma chave permanece até confirmação ou descarte, inclusive se o
      // retorno se perder e o usuário corrigir campos. A API evita outro gasto.
      idempotenciaId.current ||= crypto.randomUUID();
      const resposta = await fetch("/api/despesas/rapida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotenciaId: idempotenciaId.current,
          descricao: descricao.trim(),
          valor,
          data,
          clienteId: clienteId || null,
          categoriaFinanceira,
          categoria: categoria.trim() || null,
        }),
      });
      const dados = await resposta.json().catch(() => null);
      const mensagemApi = typeof dados?.erro === "string" ? dados.erro : "";
      if (!resposta.ok) {
        if (resposta.status === 401) {
          setSessaoExpirada(true);
          setErro("Sua sessão expirou. Entre novamente para registrar o gasto.");
        } else if (resposta.status === 409) {
          setConfirmacaoPendente(true);
          setErro(mensagemApi || "Este envio já foi registrado com outros dados. Confira o Financeiro antes de iniciar outro cadastro.");
        } else {
          if (resposta.status >= 500) setConfirmacaoPendente(true);
          setErro(mensagemApi || "Não foi possível salvar. Confira os dados e tente novamente.");
        }
        return;
      }
      if (!dados || typeof dados.id !== "string" || !dados.id ||
          dados.descricao !== descricao.trim() || typeof dados.valor !== "number" ||
          !Number.isFinite(dados.valor) || dados.valor <= 0 ||
          Math.round(dados.valor * 100) !== Math.round(valor * 100) || dados.data !== data) {
        setConfirmacaoPendente(true);
        setErro("Não consegui confirmar o registro. Tente novamente com os mesmos dados ou confira o Financeiro.");
        return;
      }
      setConfirmacao({ id: dados.id, descricao: dados.descricao, valor: Number(dados.valor), reutilizado: dados.reutilizado === true });
      setConfirmacaoPendente(false);
    } catch {
      setConfirmacaoPendente(true);
      setErro("Não consegui confirmar o registro. Tente novamente com os mesmos dados ou confira o Financeiro.");
    } finally {
      envioEmAndamento.current = false;
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl pb-12">
      <Link href="/dashboard/financeiro" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-text"><ArrowLeft size={16} /> Voltar ao Financeiro</Link>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text sm:text-2xl">Registrar gasto no débito</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Registre apenas gastos da empresa já pagos no débito. Gastos pessoais podem ser ignorados.</p>
        </div>
        {!confirmacao && !descartado && <button type="button" aria-label="Fechar sem registrar" disabled={salvando} onClick={descartar} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted hover:text-text disabled:opacity-40"><X size={18} /></button>}
      </div>

      {confirmacao ? (
        <section className="rounded-2xl border border-emerald-500/30 bg-card/60 p-5 sm:p-6">
          <CheckCircle2 size={28} className="mb-3 text-emerald-400" />
          <h2 role="status" className="text-lg font-medium text-text">{confirmacao.reutilizado ? "Esse gasto já estava registrado" : "Gasto registrado"}</h2>
          <p className="mt-4 text-3xl font-semibold text-text">{moeda(confirmacao.valor)}</p>
          <p className="mt-2 break-words text-sm leading-6 text-muted">{confirmacao.descricao}</p>
          <p className="mt-3 text-xs text-muted">Registrado como pago na data da compra. {confirmacao.reutilizado ? "A tentativa repetida não criou outra despesa." : "Já aparece no Financeiro."}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link href="/dashboard/financeiro" className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white">Ver no Financeiro</Link>
            <button type="button" onClick={registrarOutro} className="min-h-12 flex-1 rounded-xl border border-border px-4 text-sm font-medium text-text hover:bg-hover">Registrar outro</button>
          </div>
        </section>
      ) : descartado ? (
        <section className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6">
          <h2 role="status" className="text-lg font-medium text-text">{confirmacaoPendente ? "Formulário fechado" : "Nenhuma despesa registrada"}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{confirmacaoPendente ? "O retorno da tentativa anterior não foi confirmado. Confira o Financeiro antes de cadastrar o gasto novamente." : "Os campos foram descartados. Você pode fechar esta página."}</p>
          <Link href="/dashboard/financeiro" className="mt-4 flex min-h-12 items-center justify-center rounded-xl border border-border text-sm font-medium text-text hover:bg-hover">Voltar ao Financeiro</Link>
          {!confirmacaoPendente && <button type="button" onClick={registrarOutro} className="mt-3 w-full min-h-11 text-sm text-muted hover:text-text">Abrir outro cadastro</button>}
        </section>
      ) : (
        <form onSubmit={salvar} className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6">
          <fieldset disabled={salvando} className="space-y-5 disabled:opacity-70">
            <label className="block text-sm font-medium text-text">
              Valor da compra
              <div className="mt-2"><CurrencyInput value={valor} onChange={setValor} className="h-14 bg-base/60 text-2xl font-semibold" placeholder="0,00" /></div>
            </label>
            <label className="block text-sm font-medium text-text">
              Descrição
              <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} maxLength={500} placeholder="Ex.: combustível para a captação" autoComplete="off" required className="mt-2 min-h-12 w-full rounded-xl border border-border bg-base/60 px-3.5 text-base text-text outline-none placeholder:text-muted/50 focus:border-accent/50 focus:ring-2 focus:ring-accent/10" />
            </label>
            <label className="block text-sm font-medium text-text">
              Data da compra
              <input type="date" value={data} onChange={e => setData(e.target.value)} required className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-border bg-base/60 px-3.5 text-base text-text outline-none focus:border-accent/50" />
              <span className="mt-1.5 block text-xs font-normal text-muted">Começa no dia de hoje, pelo horário de Brasília.</span>
            </label>
            <details className="rounded-xl border border-border p-3.5">
              <summary className="cursor-pointer text-sm font-medium text-text">Cliente e classificação (opcional)</summary>
              <div className="mt-4 space-y-4">
                <label className="block text-xs text-muted">Cliente
                  <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-base/60 px-3 text-base text-text">
                    <option value="">Despesa geral da empresa</option>
                    {clientes.map(cliente => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
                  </select>
                </label>
                <label className="block text-xs text-muted">Classificação
                  <select value={categoriaFinanceira} onChange={e => { setCategoriaFinanceira(e.target.value); setCategoria(""); }} className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-base/60 px-3 text-base text-text">
                    {CATEGORIAS_FINANCEIRAS.map(c => <option key={c.valor} value={c.valor}>{c.label}</option>)}
                  </select>
                </label>
                <label className="block text-xs text-muted">Categoria (opcional)
                  <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} maxLength={100} list="categorias-gasto-debito" placeholder="Ex.: Transporte" autoComplete="off" className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-base/60 px-3 text-base text-text outline-none focus:border-accent/50" />
                  <datalist id="categorias-gasto-debito">{sugestoes.map(s => <option key={s} value={s} />)}</datalist>
                </label>
              </div>
            </details>
            {erro && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm leading-6 text-red-400">{erro}{sessaoExpirada && <Link href="/login?callbackUrl=%2Fdashboard%2Ffinanceiro%2Fregistrar-gasto" className="mt-2 block font-medium underline">Entrar novamente</Link>}{confirmacaoPendente && <Link href="/dashboard/financeiro" className="mt-2 block font-medium underline">Conferir no Financeiro</Link>}</div>}
            <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-base font-semibold text-white disabled:opacity-40"><Check size={18} />{salvando ? "Salvando..." : "Salvar gasto"}</button>
            <button type="button" onClick={descartar} className="min-h-12 w-full rounded-xl border border-border px-4 text-sm font-medium text-muted hover:bg-hover hover:text-text">Não registrar</button>
          </fieldset>
          <p className="mt-4 text-center text-xs leading-5 text-muted">Somente “Salvar gasto” registra uma despesa. Fechar ou ignorar não envia os campos.</p>
        </form>
      )}
      <AjudaLembreteIphone />
    </div>
  );
}
