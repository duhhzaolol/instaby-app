import { Sparkles, Plus, ArrowUpCircle, Wrench, Minus } from "lucide-react";
import { NOVIDADES, ULTIMA_VERSAO_NOVIDADES, type ItemNovidade } from "@/lib/changelog";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import { MarcarNovidadesVistas } from "@/components/dashboard/MarcarNovidadesVistas";

const visualPorTipo: Record<ItemNovidade["tipo"], { icone: any; cor: string }> = {
  adicionado: { icone: Plus, cor: "#22C55E" },
  melhorado: { icone: ArrowUpCircle, cor: "#3B82F6" },
  corrigido: { icone: Wrench, cor: "#F59E0B" },
  removido: { icone: Minus, cor: "#9CA3AF" },
};

export default function NovidadesPage() {
  return (
    <div>
      <MarcarNovidadesVistas versao={ULTIMA_VERSAO_NOVIDADES} />

      <div className="mb-6 flex items-center gap-1.5">
        <p className="flex items-center gap-2 text-lg font-medium text-text">
          <Sparkles size={18} className="text-accent" /> Novidades
        </p>
        <AjudaContextual
          titulo="Novidades"
          texto="Tudo que muda no app, versão por versão, em linguagem simples — sem termo técnico. Toda atualização nova entra aqui."
        />
      </div>
      <p className="mb-6 text-sm text-muted">O que mudou em cada versão do app, da mais recente pra mais antiga.</p>

      <div className="flex flex-col gap-4">
        {NOVIDADES.map((v) => (
          <div key={v.versao} className="overflow-hidden rounded-2xl border border-border bg-card/60 p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                Versão {v.versao}
              </span>
              <p className="text-sm text-muted">{v.resumo}</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {v.itens.map((item, i) => {
                const visual = visualPorTipo[item.tipo];
                const Icon = visual.icone;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${visual.cor}1A`, color: visual.cor }}
                    >
                      <Icon size={11} />
                    </span>
                    <p className="text-sm leading-relaxed text-text">{item.texto}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
