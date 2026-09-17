"use client";

import { useRouter } from "next/navigation";
import { CATEGORIAS_FINANCEIRAS } from "@/lib/categoriasFinanceiras";

const FILTROS_CATEGORIA = [
  { valor: "", label: "Todas as categorias" },
  { valor: "sem_classificacao", label: "⚠️ Sem classificação" },
  ...CATEGORIAS_FINANCEIRAS.map((c) => ({ valor: c.valor, label: c.label })),
];

const FILTROS_PERIODO = [
  { valor: "", label: "Qualquer período" },
  { valor: "mes_atual", label: "Mês atual" },
  { valor: "mes_anterior", label: "Mês anterior" },
];

export function FiltrosContasAPagar({
  aba,
  categoria,
  periodo,
}: {
  aba: string;
  categoria: string;
  periodo: string;
}) {
  const router = useRouter();

  function irPara(novaCategoria: string, novoPeriodo: string) {
    const params = new URLSearchParams();
    params.set("aba", aba);
    if (novaCategoria) params.set("categoria", novaCategoria);
    if (novoPeriodo) params.set("periodo", novoPeriodo);
    router.push(`/dashboard/financeiro/contas-a-pagar?${params.toString()}`);
  }

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      <select
        value={categoria}
        onChange={(e) => irPara(e.target.value, periodo)}
        className="h-9 rounded-xl border border-border bg-card/60 px-3 text-xs text-text"
      >
        {FILTROS_CATEGORIA.map((f) => (
          <option key={f.valor} value={f.valor}>
            {f.label}
          </option>
        ))}
      </select>
      <select
        value={periodo}
        onChange={(e) => irPara(categoria, e.target.value)}
        className="h-9 rounded-xl border border-border bg-card/60 px-3 text-xs text-text"
      >
        {FILTROS_PERIODO.map((f) => (
          <option key={f.valor} value={f.valor}>
            {f.label}
          </option>
        ))}
      </select>
    </div>
  );
}
