"use client";

import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

export function HistoricoPublico({
  dados,
  cor,
  rotulo,
}: {
  dados: { periodo: string; valor: number }[];
  cor: string;
  rotulo: string;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-white/[0.06] bg-[#111827]/50 p-5 print:hidden">
      <p className="mb-3 text-xs uppercase tracking-wide text-[#9CA3AF]">Tendência — últimos períodos</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={dados} margin={{ left: 0, right: 8, top: 4 }}>
          <XAxis dataKey="periodo" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "#1C2028",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              fontSize: 12,
              color: "#F9FAFB",
            }}
            formatter={(v: number) => [v.toLocaleString("pt-BR"), rotulo]}
          />
          <Line type="monotone" dataKey="valor" stroke={cor} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
