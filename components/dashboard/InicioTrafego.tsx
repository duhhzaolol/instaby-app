import Link from "next/link";
import { DollarSign, Target, Percent, Trophy, AlertTriangle, FileBarChart, Palette, Gauge } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { visualDaCategoriaTarefa } from "@/lib/categoriaTarefaVisual";

function compactar(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${(abs / 1_000).toFixed(1).replace(".", ",")}K`;
  return `${Math.round(abs).toLocaleString("pt-BR")}`;
}
function moeda(v: number) {
  return `R$ ${compactar(v)}`;
}

export type CampanhaRitmo = {
  id: string;
  nome: string;
  clienteNome: string;
  clienteCor: string | null;
  verbaMensal: number;
  investidoMes: number;
  ritmo: number | null;
};

export type AlertaTrafego = { label: string; contagem: number; href: string; cor: string };
export type RelatorioResumo = { id: string; clienteNome: string; rede: string; inicio: string; fim: string };
export type TarefaCriativo = {
  id: string;
  titulo: string;
  categoria: string | null;
  prazo: string | null;
  clienteNome: string | null;
  clienteCor: string | null;
};

function BarraRitmo({ campanha }: { campanha: CampanhaRitmo }) {
  const percentualInvestido = campanha.verbaMensal > 0 ? Math.min(100, (campanha.investidoMes / campanha.verbaMensal) * 100) : 0;
  // Onde o investimento "deveria" estar hoje, como % da verba mensal — derivado de
  // ritmo = investido/esperado, então esperado(%) = investido(%) / ritmo.
  const marcaEsperada = campanha.ritmo != null && campanha.ritmo > 0 ? Math.min(100, percentualInvestido / campanha.ritmo) : null;
  const corRitmo = campanha.ritmo == null ? "#9CA3AF" : campanha.ritmo < 0.7 ? "#F59E0B" : campanha.ritmo > 1.3 ? "#EF4444" : "#22C55E";

  return (
    <div className="rounded-xl border border-border bg-base/40 p-3">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-text">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: campanha.clienteCor || "#9CA3AF" }} />
          {campanha.clienteNome} <span className="text-muted">— {campanha.nome}</span>
        </span>
        <span className="text-muted">
          {moeda(campanha.investidoMes)} de {moeda(campanha.verbaMensal)}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-base">
        <div className="h-full rounded-full transition-all" style={{ width: `${percentualInvestido}%`, backgroundColor: corRitmo }} />
        {marcaEsperada != null && (
          <div className="absolute top-0 h-full w-px bg-white/40" style={{ left: `${Math.min(100, marcaEsperada)}%` }} title="Onde deveria estar hoje" />
        )}
      </div>
      {campanha.ritmo != null && (
        <p className="mt-1 text-[11px] text-muted">
          {campanha.ritmo < 0.7
            ? "Bem abaixo do ritmo esperado pra essa altura do mês"
            : campanha.ritmo > 1.3
            ? "Investindo bem mais rápido que o esperado"
            : "No ritmo esperado"}
        </p>
      )}
    </div>
  );
}

export default function InicioTrafego({
  totais,
  campanhas,
  alertas,
  relatorios,
  criativosPedidos,
}: {
  totais: { investido: number; resultados: number; custoPorResultado: number | null; retorno: number };
  campanhas: CampanhaRitmo[];
  alertas: AlertaTrafego[];
  relatorios: RelatorioResumo[];
  criativosPedidos: TarefaCriativo[];
}) {
  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icone={<DollarSign size={12} className="text-accent" />} label="Investido no mês" valor={moeda(totais.investido)} />
        <StatTile icone={<Target size={12} className="text-accent" />} label="Resultados" valor={compactar(totais.resultados)} />
        <StatTile
          icone={<Percent size={12} className="text-accent" />}
          label="Custo/resultado"
          valor={totais.custoPorResultado != null ? moeda(totais.custoPorResultado) : "—"}
        />
        <StatTile icone={<Trophy size={12} className="text-accent" />} label="Retorno gerado" valor={totais.retorno > 0 ? moeda(totais.retorno) : "—"} />
      </div>

      {alertas.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-card/60 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
            <AlertTriangle size={14} className="text-amber-400" /> Precisa da sua atenção
          </p>
          <div className="flex flex-col gap-1.5">
            {alertas.map((a) => (
              <Link key={a.label} href={a.href} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm hover:bg-hover">
                <span className="text-text">{a.label}</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${a.cor}1A`, color: a.cor }}>
                  {a.contagem}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {campanhas.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
            <Gauge size={14} className="text-accent" /> Ritmo de gasto da verba
          </p>
          <div className="flex flex-col gap-2">
            {campanhas.map((c) => (
              <BarraRitmo key={c.id} campanha={c} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {criativosPedidos.length > 0 && (
          <Card hoverable={false} className="p-4">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
              <Palette size={14} className="text-accent" /> Criativos pedidos ao editor
            </p>
            <div className="flex flex-col gap-2">
              {criativosPedidos.map((t) => {
                const { icone: Icon, cor } = visualDaCategoriaTarefa(t.categoria);
                return (
                  <div key={t.id} className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${cor}1A`, color: cor }}>
                      <Icon size={13} />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-xs text-text">
                      {t.titulo}
                      {t.clienteNome && <span className="text-muted"> — {t.clienteNome}</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {relatorios.length > 0 && (
          <Card hoverable={false} className="p-4">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
              <FileBarChart size={14} className="text-accent" /> Relatórios do mês
            </p>
            <div className="flex flex-col gap-2">
              {relatorios.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span className="text-text">
                    {r.clienteNome} <span className="text-muted">— {r.rede}</span>
                  </span>
                  <span className="text-muted">
                    {new Date(r.inicio).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}–
                    {new Date(r.fim).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
