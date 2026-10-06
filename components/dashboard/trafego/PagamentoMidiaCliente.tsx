"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Check } from "lucide-react";
import { FORMAS_PAGAMENTO_TRAFEGO, formaPagamentoTrafegoValida } from "@/lib/pagamentoTrafego";

export function PagamentoMidiaCliente({
  clienteId,
  formaPagamento,
}: {
  clienteId: string;
  formaPagamento: string | null;
}) {
  const router = useRouter();
  const id = useId();
  const [valor, setValor] = useState(formaPagamento || "");
  const [valorSalvo, setValorSalvo] = useState(formaPagamento || "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    setValor(formaPagamento || "");
    setValorSalvo(formaPagamento || "");
  }, [formaPagamento, clienteId]);

  async function salvar() {
    if (salvando || valor === valorSalvo) return;
    setSalvando(true);
    setErro("");
    setSucesso("");
    try {
      const resposta = await fetch(`/api/clientes/${clienteId}/pagamento-trafego`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formaPagamentoTrafego: valor || null }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setErro(dados.erro || "Não foi possível salvar a forma de pagamento. Tente novamente.");
        return;
      }
      if (!Object.prototype.hasOwnProperty.call(dados, "formaPagamentoTrafego") || (dados.formaPagamentoTrafego !== null && !formaPagamentoTrafegoValida(dados.formaPagamentoTrafego))) {
        setErro("Não foi possível confirmar o salvamento. Atualize a página e confira a forma de pagamento.");
        return;
      }
      const salvo = dados.formaPagamentoTrafego || "";
      setValor(salvo);
      setValorSalvo(salvo);
      setSucesso("Forma de pagamento salva. Nenhum valor foi lançado.");
      router.refresh();
    } catch {
      setErro("Não foi possível conectar para salvar. Confira a conexão e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-1 flex items-center gap-2">
        <CreditCard size={16} className="text-accent" />
        <h3 className="text-sm font-medium text-text">Pagamento dos anúncios</h3>
      </div>
      <p className="mb-3 text-xs text-muted">Defina como o cliente paga a plataforma de anúncios. Essa configuração é separada da mensalidade da agência.</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label htmlFor={id} className="flex-1 text-xs text-muted">
          Forma de pagamento
          <select
            id={id}
            value={valor}
            disabled={salvando}
            onChange={(e) => {
              setValor(e.target.value);
              setErro("");
              setSucesso("");
            }}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text disabled:opacity-50"
          >
            <option value="">Não informado</option>
            {FORMAS_PAGAMENTO_TRAFEGO.map((forma) => (
              <option key={forma.value} value={forma.value}>{forma.label}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || valor === valorSalvo}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 text-xs font-semibold text-white disabled:opacity-40"
        >
          <Check size={14} /> {salvando ? "Salvando..." : "Salvar forma de pagamento"}
        </button>
      </div>
      <p className="mt-3 text-xs text-muted">
        {valor === "cartao_credito"
          ? "Os anúncios são cobrados diretamente no cartão. O gasto importado mostra o uso dos anúncios; não confirma o pagamento da fatura."
          : valor === "pix" || valor === "boleto"
            ? "O pagamento antecipado libera saldo para os anúncios. Registre o valor confirmado em Nova movimentação. O saldo disponível continua entre os meses, sem precisar lançar um novo transporte. Importar um relatório não confirma o pagamento."
            : "Escolha cartão de crédito, Pix ou boleto para organizar o acompanhamento dos gastos e da verba do cliente."}
      </p>
      {erro && <p role="alert" className="mt-3 text-xs text-red-400">{erro}</p>}
      {sucesso && <p role="status" className="mt-3 text-xs text-emerald-400">{sucesso}</p>}
    </section>
  );
}
