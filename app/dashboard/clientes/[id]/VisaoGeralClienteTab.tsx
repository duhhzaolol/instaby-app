"use client";

import { Wallet, FileSignature, CalendarClock, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { useOcultarValores, ValorSensivel } from "@/components/ui/OcultarValores";
import { formatarTempoRenovacao } from "@/lib/formatarTempoRenovacao";

type Item = { texto: string; data: string; tipo: string };

const ICONE_TIMELINE: Record<string, any> = {
  pagamento: Wallet,
  contrato: FileSignature,
  orcamento: FileSignature,
};

function fmtData(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function VisaoGeralClienteTab({
  mensalidade,
  proximaCobranca,
  contratoVigente,
  proximaRenovacao,
  diasParaRenovar,
  receitaMes,
  despesasMes,
  horasMes,
  custoHoraPadrao,
  proximaAtividade,
  situacaoRelatorio,
  timeline,
}: {
  mensalidade: number;
  proximaCobranca: { valor: number; vencimento: string | null } | null;
  contratoVigente: boolean;
  proximaRenovacao: string | null;
  diasParaRenovar: number | null;
  receitaMes: number;
  despesasMes: number;
  horasMes: number;
  custoHoraPadrao: number;
  proximaAtividade: { titulo: string; prazo: string | null } | null;
  situacaoRelatorio: string | null;
  timeline: Item[];
}) {
  const { oculto } = useOcultarValores();
  const custoHoras = horasMes * custoHoraPadrao;
  const rentabilidade = receitaMes - despesasMes - custoHoras;

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <Wallet size={12} /> Mensalidade
          </p>
          <p className="text-lg font-medium text-text">
            <ValorSensivel oculto={oculto}>R$ {mensalidade.toFixed(0)}</ValorSensivel>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <CalendarClock size={12} /> Próxima cobrança
          </p>
          <p className="text-sm font-medium text-text">
            {proximaCobranca ? (
              <>
                <ValorSensivel oculto={oculto}>R$ {proximaCobranca.valor.toFixed(0)}</ValorSensivel> ·{" "}
                {fmtData(proximaCobranca.vencimento)}
              </>
            ) : (
              "Nada pendente"
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <FileSignature size={12} /> Contrato
          </p>
          <p className="text-sm font-medium text-text">{contratoVigente ? "Assinado" : "Sem contrato assinado"}</p>
          {proximaRenovacao && diasParaRenovar !== null && (
            <p className={`text-[11px] ${diasParaRenovar <= 30 ? "text-amber-400" : "text-muted"}`}>
              {diasParaRenovar < 0 ? "Renovação " : "Renova em "}
              {formatarTempoRenovacao(diasParaRenovar)}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <Clock size={12} /> Horas esse mês
          </p>
          <p className="text-lg font-medium text-text">{horasMes.toFixed(1)}h</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-accent/10 pb-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-text">
            <TrendingUp size={14} className="text-accent" /> Resultado do mês
          </p>
          <div className="text-right">
            <p className="text-[11px] text-muted">Rentabilidade</p>
            <p className={`text-2xl font-semibold leading-tight ${rentabilidade >= 0 ? "text-accent" : "text-red-400"}`}>
              <ValorSensivel oculto={oculto}>R$ {rentabilidade.toFixed(0)}</ValorSensivel>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted">Receita</p>
            <p className="text-base font-medium text-emerald-400">
              <ValorSensivel oculto={oculto}>R$ {receitaMes.toFixed(0)}</ValorSensivel>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Despesas diretas</p>
            <p className="text-base font-medium text-red-400">
              <ValorSensivel oculto={oculto}>R$ {despesasMes.toFixed(0)}</ValorSensivel>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Custo das horas</p>
            <p className="text-base font-medium text-red-400">
              <ValorSensivel oculto={oculto}>R$ {custoHoras.toFixed(0)}</ValorSensivel>
            </p>
          </div>
        </div>
        {custoHoraPadrao === 0 && (
          <p className="mt-2 text-[11px] text-amber-400">
            Custo por hora não configurado — Configurações → "Custo por hora". Sem isso, o custo das horas fica
            zerado e a rentabilidade não desconta o seu tempo trabalhado.
          </p>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card/60 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text">
          <BarChart3 size={14} className="text-accent" /> Relatório
        </p>
        <p className="text-sm text-muted">{situacaoRelatorio ? `Último período até ${situacaoRelatorio}` : "Nenhum relatório lançado ainda"}</p>
      </div>

      {proximaAtividade && (
        <div className="mb-6 rounded-xl border border-border bg-card/60 p-4">
          <p className="mb-1 text-xs text-muted">Próxima atividade</p>
          <p className="text-sm text-text">
            {proximaAtividade.titulo} — {fmtData(proximaAtividade.prazo)}
          </p>
        </div>
      )}

      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Linha do tempo</p>
      {timeline.length === 0 ? (
        <p className="text-sm text-muted">Nada por aqui ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {timeline.map((item, i) => {
            const Icon = ICONE_TIMELINE[item.tipo] || Wallet;
            return (
              <div key={i} className="flex items-center gap-2.5 rounded-lg bg-card/40 px-3 py-2">
                <Icon size={13} className="shrink-0 text-muted" />
                <p className="flex-1 text-xs text-text">{item.texto}</p>
                <p className="text-[11px] text-muted">{fmtData(item.data)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
