"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { visualDaRede } from "@/lib/redesSociais";
import { RelatorioResumo } from "@/components/dashboard/RelatorioCard";

function formatarMesAno(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function HistoricoRelatorios({ relatorios }: { relatorios: RelatorioResumo[] }) {
  const porRede: Record<string, RelatorioResumo[]> = {};
  relatorios.forEach((r) => {
    (porRede[r.rede] ||= []).push(r);
  });

  const redesComHistorico = Object.entries(porRede).filter(([, lista]) => lista.length >= 2);

  if (redesComHistorico.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-4">
      {redesComHistorico.map(([rede, lista]) => {
        const { icone: Icon, cor, label, paga } = visualDaRede(rede);
        const ordenada = [...lista].sort((a, b) => new Date(a.fim).getTime() - new Date(b.fim).getTime());
        const dados = ordenada.map((r) => ({
          periodo: formatarMesAno(r.fim),
          seguidores: r.seguidoresFim ?? undefined,
          investimento: r.investimento ?? undefined,
          leads: r.leads ?? undefined,
        }));

        const chave = paga ? "leads" : "seguidores";
        const temDado = dados.some((d) => d[chave] !== undefined);
        if (!temDado) return null;

        return (
          <div key={rede} className="rounded-2xl border border-border bg-card/60 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
              <Icon size={14} style={{ color: cor }} /> Evolução — {label}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={dados} margin={{ left: -20, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="periodo" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#1C2028",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#F9FAFB",
                  }}
                  formatter={(v: number) => [v.toLocaleString("pt-BR"), paga ? "Leads" : "Seguidores"]}
                />
                <Line type="monotone" dataKey={chave} stroke={cor} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
