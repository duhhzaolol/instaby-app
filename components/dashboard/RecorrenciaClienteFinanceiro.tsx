"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Repeat2 } from "lucide-react";
import { chaveDiaSaoPaulo } from "@/lib/dataHora";

export function RecorrenciaClienteFinanceiro({
  clienteId,
  nome,
  mensalidade,
  ativa,
  inicio,
  diaVencimento,
  podeEditar = true,
}: {
  clienteId: string;
  nome: string;
  mensalidade: number;
  ativa: boolean;
  inicio: string | null;
  diaVencimento: number;
  podeEditar?: boolean;
}) {
  const router = useRouter();
  const [habilitada, setHabilitada] = useState(ativa);
  const [mesInicial, setMesInicial] = useState(
    inicio || chaveDiaSaoPaulo(new Date()).slice(0, 7),
  );
  const [dia, setDia] = useState(String(diaVencimento));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  useEffect(() => {
    setHabilitada(ativa);
    setMesInicial(inicio || chaveDiaSaoPaulo(new Date()).slice(0, 7));
    setDia(String(diaVencimento));
  }, [ativa, inicio, diaVencimento]);
  function alterou() {
    setErro("");
    setSalvo(false);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEditar || salvando) return;
    const numeroDia = Number(dia);
    if (
      !Number.isInteger(numeroDia) ||
      numeroDia < 1 ||
      numeroDia > 31 ||
      (habilitada && !/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(mesInicial))
    ) {
      setErro("Escolha o mês inicial e um dia de vencimento entre 1 e 31.");
      return;
    }
    setSalvando(true);
    setErro("");
    setSalvo(false);
    try {
      const res = await fetch(`/api/clientes/${clienteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cobrancaRecorrenteAtiva: habilitada,
          cobrancaRecorrenteInicio: mesInicial || null,
          cobrancaDiaVencimento: numeroDia,
        }),
      });
      const resposta = await res.json().catch(() => null);
      if (!res.ok) {
        setErro(resposta?.erro || "Não consegui salvar a recorrência.");
        return;
      }
      setSalvo(true);
      router.refresh();
    } catch {
      setErro("Não consegui salvar. Confira a conexão e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }
  const valorMensal = mensalidade.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <form
      onSubmit={salvar}
      aria-label={`Recorrência financeira de ${nome}`}
      className="rounded-xl border border-border bg-card/40 p-4"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-text">
            <Repeat2 size={14} /> {nome}
          </p>
          <p className="mt-1 text-xs text-muted">
            Mensalidade atual: <span className="text-text">{valorMensal}</span>
          </p>
          <Link
            href={`/dashboard/clientes/${clienteId}?aba=servicos`}
            className="mt-1 inline-block text-xs text-accent hover:underline"
          >
            Alterar serviços e valor da mensalidade
          </Link>
        </div>
        <label className="flex min-h-9 cursor-pointer items-center gap-2 text-xs text-text">
          <input
            type="checkbox"
            checked={habilitada}
            disabled={!podeEditar || salvando}
            onChange={(e) => {
              setHabilitada(e.target.checked);
              alterou();
            }}
            className="h-4 w-4 accent-accent"
            aria-label={`Cobrança mensal automática de ${nome}`}
          />{" "}
          Cobrança mensal automática
        </label>
      </div>
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted">
          Começar no mês
          <input
            type="month"
            value={mesInicial}
            disabled={!podeEditar || salvando}
            onChange={(e) => {
              setMesInicial(e.target.value);
              alterou();
            }}
            aria-label={`Mês inicial da cobrança de ${nome}`}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-base px-3 text-sm text-text disabled:opacity-60"
          />
        </label>
        <label className="text-xs text-muted">
          Dia do vencimento
          <input
            type="number"
            min={1}
            max={31}
            step={1}
            value={dia}
            disabled={!podeEditar || salvando}
            onChange={(e) => {
              setDia(e.target.value);
              alterou();
            }}
            aria-label={`Dia do vencimento de ${nome}`}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-base px-3 text-sm text-text disabled:opacity-60"
          />
        </label>
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        Uma cobrança por mês, sem duplicar. Quando o dia escolhido não existe no
        mês, o vencimento fica no último dia. Desativar a recorrência interrompe
        as próximas gerações e preserva as cobranças já registradas.
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        O valor vem dos serviços ativos, com acréscimo e desconto. Alterar esses
        valores ajusta a cobrança automática do mês atual enquanto não houver
        pagamento. Cobranças anteriores, manuais ou com pagamentos registrados
        mantêm seus valores.
      </p>
      {habilitada && mensalidade <= 0 && (
        <p className="mt-2 text-xs text-amber-300">
          Defina o valor da mensalidade nos serviços para gerar as cobranças.
        </p>
      )}
      {erro && (
        <p role="alert" className="mt-3 text-xs text-red-400">
          {erro}
        </p>
      )}
      {salvo && (
        <p role="status" className="mt-3 text-xs text-emerald-400">
          Recorrência salva.
        </p>
      )}
      {podeEditar && (
        <button
          type="submit"
          disabled={salvando}
          className="mt-3 min-h-10 rounded-xl bg-accent px-4 text-xs font-medium text-white disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar recorrência"}
        </button>
      )}
    </form>
  );
}
