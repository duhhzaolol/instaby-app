"use client";

import { useState, useId } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatarDataRelatorio } from "@/lib/dataRelatorio";

export type MarcoImportacao = {
  data: string;
  gasto: number;
  impressoes: number | null;
  alcance: number | null;
  resultados: number | null;
  resultadosLabel?: string;
};
const METRICAS = { gasto: "Gasto acumulado", impressoes: "Impressões", alcance: "Alcance", resultados: "Resultados" };
type Metrica = keyof typeof METRICAS;
const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const numero = (v: number | null) => v == null ? "—" : v.toLocaleString("pt-BR");

export function EvolucaoImportacoes({ marcos }: { marcos: MarcoImportacao[] }) {
  const [metrica, setMetrica] = useState<Metrica>("gasto");
  const disponiveis = (Object.keys(METRICAS) as Metrica[]).filter((key) => key === "gasto" || marcos.some((m) => m[key] != null));
  const escolhida = disponiveis.includes(metrica) ? metrica : "gasto";
  const id = useId().replace(/:/g, "");
  const formatar = (v: number) => escolhida === "gasto" ? moeda(v) : numero(v);
  const dados = marcos.map((m) => ({ ...m, dataLabel: formatarDataRelatorio(m.data, { day: "2-digit", month: "2-digit" }) }));
  if (!marcos.length) return null;
  return <div className="my-4 rounded-2xl border border-border bg-card/60 p-4">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-medium text-text">Evolução nas importações do mês</p>
      <select aria-label="Métrica do gráfico" value={escolhida} onChange={(e) => setMetrica(e.target.value as Metrica)} className="rounded-lg border border-border bg-base px-2 py-1.5 text-xs text-text">
        {disponiveis.map((key) => <option key={key} value={key}>{METRICAS[key]}</option>)}
      </select>
    </div>
    <p className="mb-3 text-[11px] text-muted">Cada ponto mostra o acumulado do dia 1 até a data do relatório. O total do mês é o último ponto; os pontos anteriores ficam como marcos.</p>
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={dados} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E63946" stopOpacity={0.25}/><stop offset="100%" stopColor="#E63946" stopOpacity={0.02}/></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)"/>
        <XAxis dataKey="dataLabel" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} minTickGap={16}/>
        <YAxis width={escolhida === "gasto" ? 90 : 70} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={formatar}/>
        <Tooltip formatter={(v: any) => [formatar(Number(v)), METRICAS[escolhida]]} contentStyle={{ background: "#1C2028", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 12 }}/>
        <Area type="stepAfter" dataKey={escolhida} stroke="#E63946" fill={`url(#${id})`} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls={false}/>
      </AreaChart>
    </ResponsiveContainer>
    <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs">
      <thead className="text-muted"><tr><th className="p-2 font-medium">Até</th><th className="p-2 font-medium">Acumulado</th><th className="p-2 font-medium">Variação desde o marco anterior</th><th className="p-2 font-medium">Impressões</th><th className="p-2 font-medium">Resultados</th>{marcos.some((m) => m.alcance != null) && <th className="p-2 font-medium">Alcance</th>}</tr></thead>
      <tbody>{marcos.map((m, i) => <tr key={m.data} className="border-t border-border/60 text-text"><td className="p-2">{formatarDataRelatorio(m.data)}</td><td className="p-2">{moeda(m.gasto)}</td><td className="p-2">{i ? moeda(m.gasto - marcos[i - 1].gasto) : "Primeiro marco"}</td><td className="p-2">{numero(m.impressoes)}</td><td className="p-2">{m.resultadosLabel || numero(m.resultados)}</td>{marcos.some((m) => m.alcance != null) && <td className="p-2">{numero(m.alcance)}</td>}</tr>)}</tbody>
    </table></div>
  </div>;
}
