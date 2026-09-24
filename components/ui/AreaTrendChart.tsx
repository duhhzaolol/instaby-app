"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/Card";

// Gráfico de área de uma série ao longo de 6 meses — mesmo visual do "Faturamento —
// últimos 6 meses" do Dashboard (gradiente, animado, tooltip), generalizado aqui pra
// qualquer tela que precise da mesma mini-tendência (ex: faturamento por cliente).
export function AreaTrendChart({
  titulo,
  dados,
  cor,
  oculto,
  formatador,
  mensagemVazia,
  altura = 200,
}: {
  titulo: string;
  dados: { mes: string; valor: number }[];
  cor: string;
  oculto?: boolean;
  formatador: (v: number) => string;
  mensagemVazia?: string;
  altura?: number;
}) {
  const temDados = dados.some((d) => d.valor !== 0);
  const gradId = `grad-trend-${titulo.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <Card hoverable={false} className="mb-6 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cor }} />
        {titulo}
      </p>
      {oculto ? (
        <div style={{ height: altura }} className="flex items-center justify-center text-sm tracking-widest text-muted">
          ••••••••••
        </div>
      ) : !temDados ? (
        <p style={{ height: altura }} className="flex items-center justify-center text-center text-xs text-muted">
          {mensagemVazia || "Ainda sem dados suficientes pra montar o gráfico."}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={altura}>
          <AreaChart data={dados} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={cor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v) => formatador(Number(v))}
            />
            <Tooltip
              cursor={{ stroke: cor, strokeWidth: 1, strokeOpacity: 0.35 }}
              contentStyle={{ fontSize: 12, borderRadius: 10, background: "#1C2028", border: "1px solid rgba(255,255,255,.08)" }}
              labelStyle={{ color: "#9CA3AF", marginBottom: 2 }}
              formatter={(v: any) => [formatador(Number(v)), titulo]}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke={cor}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={{ r: 3, fill: cor, stroke: "#1C2028", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: cor, stroke: "#1C2028", strokeWidth: 2 }}
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
