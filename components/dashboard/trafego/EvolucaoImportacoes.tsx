"use client";

import { useId } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatarDataRelatorio } from "@/lib/dataRelatorio";

type ResultadoPorIndicador = { indicador: string; label: string; total: number };

export type MarcoImportacao = {
  data: string;
  gasto: number;
  impressoes: number | null;
  impressoesParciais?: boolean;
  alcance: number | null;
  resultados: number | null;
  resultadosLabel?: string;
  resultadosPorIndicador?: ResultadoPorIndicador[];
};

type Metrica = "gasto" | "impressoes" | "resultados";
type SerieResultado = { indicador: string; label: string; chave: string; cor: string };
const METRICAS = {
  gasto: { titulo: "Gasto acumulado", cor: "#E63946" },
  impressoes: { titulo: "Impressões acumuladas", cor: "#38BDF8" },
  resultados: { titulo: "Resultados acumulados", cor: "#14B8A6" },
};
const CORES_RESULTADOS = ["#14B8A6", "#A78BFA", "#FBBF24", "#FB923C", "#60A5FA", "#F472B6"];
const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const numero = (v: number | null) => v == null ? "—" : v.toLocaleString("pt-BR");
const dataCurta = (data: string) => formatarDataRelatorio(data, { day: "2-digit", month: "2-digit" });

function labelResultado(label: string): string {
  if (!label || label.includes(":") || label.includes("_")) return "Resultado informado no arquivo";
  return label === "(sem indicador)" ? "Indicador não informado" : label;
}

function gruposDoMarco(marco: MarcoImportacao): ResultadoPorIndicador[] {
  if (marco.resultadosPorIndicador !== undefined) {
    return marco.resultadosPorIndicador
      .filter((grupo) => Number.isFinite(grupo.total) && !(
        grupo.total === 0 && (!grupo.indicador || grupo.indicador === "(sem indicador)")
      ))
      .map((grupo) => ({ ...grupo, label: !grupo.indicador || grupo.indicador === "(sem indicador)" ? "Indicador não informado" : labelResultado(grupo.label) }));
  }
  // Compatibilidade com a tela anterior: um total único já exige indicadores compatíveis.
  return marco.resultados == null ? [] : [{ indicador: "resultado", label: "Resultados", total: marco.resultados }];
}

function resumoResultados(marco: MarcoImportacao) {
  const grupos = gruposDoMarco(marco);
  if (!grupos.length) return <span className="text-muted">Sem resultado identificado</span>;
  return <div className="space-y-1">{grupos.map((grupo) => <p key={grupo.indicador}>
    <span className="font-medium">{numero(grupo.total)}</span>{" "}<span className="text-muted">{grupo.label}</span>
  </p>)}</div>;
}

export function EvolucaoImportacoes({ marcos }: { marcos: MarcoImportacao[] }) {
  const id = useId().replace(/:/g, "");
  if (!marcos.length) return null;

  const ultimo = marcos[marcos.length - 1];
  const anterior = marcos.length > 1 ? marcos[marcos.length - 2] : undefined;
  const temAlcance = marcos.some((marco) => marco.alcance != null);
  const indicadores = new Map<string, string>();
  marcos.forEach((marco) => gruposDoMarco(marco).forEach((grupo) => indicadores.set(grupo.indicador, grupo.label)));
  const seriesResultados: SerieResultado[] = Array.from(indicadores, ([indicador, label], i) => ({
    indicador,
    label,
    chave: `resultado_${i}`,
    cor: CORES_RESULTADOS[i % CORES_RESULTADOS.length],
  }));
  const dados = marcos.map((marco) => {
    const grupos = gruposDoMarco(marco);
    const resultado: Record<string, number | null> = {};
    seriesResultados.forEach((serie) => {
      resultado[serie.chave] = grupos.find((grupo) => grupo.indicador === serie.indicador)?.total ?? null;
    });
    return { ...marco, ...resultado, dataLabel: dataCurta(marco.data) };
  });

  function variacao(metrica: Metrica): string {
    if (!anterior) return "Primeira importação do mês";
    if (metrica === "resultados") {
      const atuais = gruposDoMarco(ultimo);
      if (atuais.length > 1) return "Cada tipo de resultado aparece separadamente";
      if (!atuais.length) return "O último arquivo não identifica um resultado";
      const grupoAnterior = gruposDoMarco(anterior).find((grupo) => grupo.indicador === atuais[0].indicador);
      if (!grupoAnterior) return "Primeiro marco deste tipo de resultado";
      return `${numero(atuais[0].total - grupoAnterior.total)} desde a importação anterior`;
    }
    const atual = ultimo[metrica];
    const antes = anterior[metrica];
    if (atual == null) return "Não informado no último arquivo";
    if (metrica === "impressoes" && (ultimo.impressoesParciais || anterior.impressoesParciais)) return "Sem comparação completa com a importação anterior";
    if (antes == null) return "Sem comparação com a importação anterior";
    return `${metrica === "gasto" ? moeda(atual - antes) : numero(atual - antes)} desde a importação anterior`;
  }

  return <section aria-label="Evolução nas importações do mês" className="my-4 rounded-2xl border border-border bg-card/60 p-4">
    <p className="text-sm font-medium text-text">Evolução nas importações do mês</p>
    <p className="mt-1 text-xs leading-relaxed text-muted">Cada ponto mostra o acumulado do dia 1 até a data do relatório. O total do mês é o último ponto; as importações anteriores ficam como marcos.</p>
    {marcos.some((marco) => marco.impressoesParciais) && <p className="mt-2 text-[11px] leading-relaxed text-amber-300">Impressões marcadas como parciais são o subtotal informado: alguma campanha com gasto ficou sem essa métrica no arquivo.</p>}

    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {(["gasto", "impressoes", "resultados"] as Metrica[]).map((metrica) => {
        const config = METRICAS[metrica];
        const gruposFinais = gruposDoMarco(ultimo);
        const temDados = metrica === "resultados" ? seriesResultados.length > 0 : dados.some((marco) => marco[metrica] != null);
        const formatar = (valor: number) => metrica === "gasto" ? moeda(valor) : numero(valor);
        const formatoEixo = (valor: number) => {
          if (Math.abs(valor) >= 10000) return `${metrica === "gasto" ? "R$ " : ""}${valor.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 })}`;
          return formatar(valor);
        };
        return <article key={metrica} aria-label={config.titulo} className="min-w-0 rounded-xl border border-border bg-base/40 p-3">
          <div className="mb-3 min-h-[106px]">
            <p className="flex items-center gap-2 text-xs font-medium text-muted"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: config.cor }}/>{metrica === "impressoes" && ultimo.impressoesParciais ? "Impressões informadas" : config.titulo}</p>
            {metrica === "resultados" ? <div className="mt-2 space-y-2">
              {gruposFinais.length ? gruposFinais.map((grupo) => <div key={grupo.indicador}>
                <p className="text-2xl font-semibold text-text">{numero(grupo.total)}</p>
                <p className="text-xs leading-relaxed text-muted">{grupo.label}</p>
              </div>) : <p className="text-lg font-medium text-muted">Sem resultado identificado</p>}
            </div> : <p className="mt-2 text-2xl font-semibold text-text">{ultimo[metrica] == null ? "—" : formatar(ultimo[metrica]!)}</p>}
            <p className="mt-1 text-[11px] leading-relaxed text-muted">Até {dataCurta(ultimo.data)} · {variacao(metrica)}</p>
          </div>

          {temDados ? <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dados} margin={{ top: 10, right: 12, left: 0, bottom: 5 }}>
              <defs>{(metrica === "resultados" ? seriesResultados.map((serie) => ({ chave: serie.chave, cor: serie.cor })) : [{ chave: metrica, cor: config.cor }]).map((serie) => <linearGradient key={serie.chave} id={`${id}-${serie.chave}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={serie.cor} stopOpacity={0.22}/><stop offset="100%" stopColor={serie.cor} stopOpacity={0.02}/>
              </linearGradient>)}</defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)"/>
              <XAxis dataKey="dataLabel" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} minTickGap={18} tickMargin={8}/>
              <YAxis width={metrica === "gasto" ? 82 : 54} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={formatoEixo} allowDecimals={metrica === "gasto"} domain={[0, "auto"]}/>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const marco = payload[0].payload as MarcoImportacao;
                return <div className="max-w-[280px] rounded-xl border border-border bg-[#1C2028] p-3 text-xs shadow-xl">
                  <p className="mb-2 font-medium text-text">Acumulado até {formatarDataRelatorio(marco.data)}</p>
                  {metrica === "resultados" ? resumoResultados(marco) : <p className="text-text">{config.titulo}: <strong>{marco[metrica] == null ? "Não informado" : formatar(marco[metrica]!)}</strong>{metrica === "impressoes" && marco.impressoesParciais && <span className="ml-1 text-amber-300">(parcial)</span>}</p>}
                </div>;
              }}/>
              {metrica === "resultados" ? seriesResultados.map((serie) => <Area key={serie.chave} name={serie.label} type="stepAfter" dataKey={serie.chave} stroke={serie.cor} fill={`url(#${id}-${serie.chave})`} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false}/>) : <Area name={config.titulo} type="stepAfter" dataKey={metrica} stroke={config.cor} fill={`url(#${id}-${metrica})`} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false}/>}
            </AreaChart>
          </ResponsiveContainer> : <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border px-5 text-center text-xs leading-relaxed text-muted">{metrica === "resultados" ? "Os arquivos deste mês ainda não identificam um tipo de resultado. Os valores aparecem quando o relatório informar essa métrica." : "Esta métrica não foi informada nos arquivos deste mês."}</div>}
          {metrica === "resultados" && seriesResultados.length > 0 && <div className="mt-2 flex max-h-24 flex-wrap gap-x-3 gap-y-2 overflow-y-auto text-[11px] text-muted">
            {seriesResultados.map((serie) => <span key={serie.indicador} className="inline-flex items-start gap-1.5"><span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: serie.cor }}/><span>{serie.label}</span></span>)}
          </div>}
        </article>;
      })}
    </div>

    <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-xs">
      <caption className="mb-2 text-left font-medium text-text">Marcos registrados nas importações</caption>
      <thead className="text-muted"><tr><th className="whitespace-nowrap p-2 font-medium">Até</th><th className="whitespace-nowrap p-2 font-medium">Gasto acumulado</th><th className="p-2 font-medium">Variação desde o marco anterior</th><th className="p-2 font-medium">Impressões</th><th className="p-2 font-medium">Resultados por tipo</th>{temAlcance && <th className="p-2 font-medium">Alcance</th>}</tr></thead>
      <tbody>{marcos.map((marco, i) => <tr key={marco.data} className="border-t border-border/60 text-text">
        <td className="whitespace-nowrap p-2">{formatarDataRelatorio(marco.data)}</td><td className="whitespace-nowrap p-2">{moeda(marco.gasto)}</td><td className="p-2">{i ? moeda(marco.gasto - marcos[i - 1].gasto) : "Primeiro marco"}</td><td className="p-2">{numero(marco.impressoes)}{marco.impressoesParciais && <span className="ml-1 text-[11px] text-amber-300">(parcial)</span>}</td><td className="min-w-[180px] p-2">{resumoResultados(marco)}</td>{temAlcance && <td className="p-2">{numero(marco.alcance)}</td>}
      </tr>)}</tbody>
    </table></div>
  </section>;
}
