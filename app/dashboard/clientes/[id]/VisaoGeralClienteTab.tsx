import { Wallet, FileSignature, CalendarClock, TrendingUp, TrendingDown, Clock, Film, BarChart3 } from "lucide-react";

type Item = { texto: string; data: string; tipo: string };

const ICONE_TIMELINE: Record<string, any> = {
  pagamento: Wallet,
  contrato: FileSignature,
  orcamento: FileSignature,
  conteudo: Film,
};

function fmtData(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function VisaoGeralClienteTab({
  mensalidade,
  proximaCobranca,
  contratoVigente,
  receitaMes,
  despesasMes,
  horasMes,
  conteudosPublicadosMes,
  conteudosPlanejados,
  itensFaltantes,
  proximaAtividade,
  situacaoRelatorio,
  timeline,
}: {
  mensalidade: number;
  proximaCobranca: { valor: number; vencimento: string | null } | null;
  contratoVigente: boolean;
  receitaMes: number;
  despesasMes: number;
  horasMes: number;
  conteudosPublicadosMes: number;
  conteudosPlanejados: number;
  itensFaltantes: number;
  proximaAtividade: { titulo: string; prazo: string | null } | null;
  situacaoRelatorio: string | null;
  timeline: Item[];
}) {
  const rentabilidade = receitaMes - despesasMes;

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <Wallet size={12} /> Mensalidade
          </p>
          <p className="text-lg font-medium text-text">R$ {mensalidade.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <CalendarClock size={12} /> Próxima cobrança
          </p>
          <p className="text-sm font-medium text-text">
            {proximaCobranca ? `R$ ${proximaCobranca.valor.toFixed(0)} · ${fmtData(proximaCobranca.vencimento)}` : "Nada pendente"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <FileSignature size={12} /> Contrato
          </p>
          <p className="text-sm font-medium text-text">{contratoVigente ? "Assinado" : "Sem contrato assinado"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <Clock size={12} /> Horas esse mês
          </p>
          <p className="text-lg font-medium text-text">{horasMes.toFixed(1)}h</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
          <TrendingUp size={14} className="text-accent" /> Resultado do mês
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted">Receita</p>
            <p className="text-base font-medium text-emerald-400">R$ {receitaMes.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Despesas diretas</p>
            <p className="text-base font-medium text-red-400">R$ {despesasMes.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Rentabilidade</p>
            <p className={`text-base font-medium ${rentabilidade >= 0 ? "text-accent" : "text-red-400"}`}>
              R$ {rentabilidade.toFixed(0)}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted">Ainda não inclui custo de horas — isso é uma próxima fase.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text">
            <Film size={14} className="text-accent" /> Conteúdo
          </p>
          <p className="text-sm text-muted">
            {conteudosPublicadosMes} publicado(s) esse mês · {conteudosPlanejados} planejado(s)
            {itensFaltantes > 0 && <span className="text-amber-400"> · {itensFaltantes} faltando no escopo</span>}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text">
            <BarChart3 size={14} className="text-accent" /> Relatório
          </p>
          <p className="text-sm text-muted">{situacaoRelatorio ? `Último período até ${situacaoRelatorio}` : "Nenhum relatório lançado ainda"}</p>
        </div>
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
