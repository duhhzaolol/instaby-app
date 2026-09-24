"use client";

import { Wallet, FileSignature, CalendarClock, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useOcultarValores, ValorSensivel } from "@/components/ui/OcultarValores";
import { StatTile } from "@/components/ui/StatTile";
import { AreaTrendChart } from "@/components/ui/AreaTrendChart";
import { formatarTempoRenovacao } from "@/lib/formatarTempoRenovacao";

type Item = { texto: string; data: string; tipo: string };

const ICONE_TIMELINE: Record<string, any> = {
  pagamento: Wallet,
  contrato: FileSignature,
  orcamento: FileSignature,
};

const COR_TIMELINE: Record<string, string> = {
  pagamento: "#22C55E",
  contrato: "#0D9488",
  orcamento: "#F59E0B",
};

function fmtData(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function compactarMoeda(v: number): string {
  const sinal = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${sinal}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${sinal}R$ ${(abs / 1_000).toFixed(1).replace(".", ",")}K`;
  return `${sinal}R$ ${Math.round(abs).toLocaleString("pt-BR")}`;
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
  faturamentoPorMes,
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
  faturamentoPorMes: { mes: string; valor: number }[];
}) {
  const { oculto } = useOcultarValores();
  const custoHoras = horasMes * custoHoraPadrao;
  const rentabilidade = receitaMes - despesasMes - custoHoras;

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          Icon={Wallet}
          cor="#E63946"
          label="Mensalidade"
          valor={<ValorSensivel oculto={oculto}>R$ {mensalidade.toFixed(0)}</ValorSensivel>}
          index={0}
        />
        <StatTile
          Icon={CalendarClock}
          cor="#F59E0B"
          label="Próxima cobrança"
          valor={
            proximaCobranca ? (
              <ValorSensivel oculto={oculto}>R$ {proximaCobranca.valor.toFixed(0)}</ValorSensivel>
            ) : (
              "Nada pendente"
            )
          }
          sub={proximaCobranca ? fmtData(proximaCobranca.vencimento) : undefined}
          index={1}
        />
        <StatTile
          Icon={FileSignature}
          cor={contratoVigente ? "#22C55E" : "#9CA3AF"}
          label="Contrato"
          valor={contratoVigente ? "Assinado" : "Sem contrato assinado"}
          sub={
            proximaRenovacao && diasParaRenovar !== null ? (
              <span className={diasParaRenovar <= 30 ? "text-amber-400" : undefined}>
                {diasParaRenovar < 0 ? "Renovação " : "Renova em "}
                {formatarTempoRenovacao(diasParaRenovar)}
              </span>
            ) : undefined
          }
          index={2}
        />
        <StatTile Icon={Clock} cor="#0D9488" label="Horas esse mês" valor={`${horasMes.toFixed(1)}h`} index={3} />
      </div>

      <AreaTrendChart
        titulo="Faturamento — últimos 6 meses"
        dados={faturamentoPorMes}
        cor="#E63946"
        oculto={oculto}
        formatador={compactarMoeda}
        mensagemVazia="Ainda sem cobranças pagas suficientes pra montar o gráfico."
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4"
      >
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-6 rounded-xl border border-border bg-card/60 p-4"
      >
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text">
          <BarChart3 size={14} className="text-accent" /> Relatório
        </p>
        <p className="text-sm text-muted">
          {situacaoRelatorio ? `Último período até ${situacaoRelatorio}` : "Nenhum relatório lançado ainda"}
        </p>
      </motion.div>

      {proximaAtividade && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-6 rounded-xl border border-border bg-card/60 p-4"
        >
          <p className="mb-1 text-xs text-muted">Próxima atividade</p>
          <p className="text-sm text-text">
            {proximaAtividade.titulo} — {fmtData(proximaAtividade.prazo)}
          </p>
        </motion.div>
      )}

      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Linha do tempo</p>
      {timeline.length === 0 ? (
        <p className="text-sm text-muted">Nada por aqui ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {timeline.map((item, i) => {
            const Icon = ICONE_TIMELINE[item.tipo] || Wallet;
            const cor = COR_TIMELINE[item.tipo] || "#9CA3AF";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.03 }}
                className="flex items-center gap-2.5 rounded-lg bg-card/40 px-3 py-2"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${cor}1A`, color: cor }}
                >
                  <Icon size={12} />
                </span>
                <p className="flex-1 text-xs text-text">{item.texto}</p>
                <p className="text-[11px] text-muted">{fmtData(item.data)}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
