"use client";

import { useState } from "react";
import {
  Minus,
  Plus,
  Video,
  Camera,
  Instagram,
  Target,
  Globe,
  Sparkles,
  Award,
  Star,
  Zap,
  BarChart3,
  MessageCircle,
} from "lucide-react";
import AceitarButton from "./AceitarButton";

type Item = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  unidade: string | null;
  quantidade: number;
  valor: number;
};

const ICONE_POR_CATEGORIA: Record<string, { Icon: any; cor: string }> = {
  "📱 Social Media": { Icon: Instagram, cor: "#3B82F6" },
  "🎥 Produção de Conteúdo": { Icon: Video, cor: "#E63946" },
  "📸 Captação": { Icon: Camera, cor: "#A855F7" },
  "🎯 Tráfego Pago": { Icon: Target, cor: "#22C55E" },
  "🌐 Desenvolvimento Web": { Icon: Globe, cor: "#06B6D4" },
  "🎬 Cobertura de Eventos": { Icon: Sparkles, cor: "#F59E0B" },
};

function iconePara(categoria: string) {
  return ICONE_POR_CATEGORIA[categoria] || { Icon: Zap, cor: "#E63946" };
}

const PORQUES = [
  "Estratégias personalizadas",
  "Foco em resultados reais",
  "Equipe especializada",
  "Acompanhamento próximo",
  "Relatórios e análises claras",
];

export default function OrcamentoInterativo({
  slug,
  status,
  clienteNome,
  validoAte,
  whatsappAgencia,
  depoimentos,
  itensIniciais,
}: {
  slug: string;
  status: string;
  clienteNome: string;
  validoAte: string;
  whatsappAgencia: string | null;
  depoimentos: { nomeCliente: string; texto: string }[];
  itensIniciais: Item[];
}) {
  const [itens, setItens] = useState(
    itensIniciais.map((i) => ({ ...i, valorUnitario: i.quantidade > 0 ? i.valor / i.quantidade : i.valor }))
  );

  function mudarQuantidade(id: string, delta: number) {
    setItens((atual) =>
      atual.map((item) => {
        if (item.id !== id) return item;
        const novaQtd = Math.max(0, item.quantidade + delta);
        return { ...item, quantidade: novaQtd, valor: Math.round(novaQtd * item.valorUnitario * 100) / 100 };
      })
    );
  }

  const total = itens.reduce((soma, i) => soma + i.valor, 0);

  const linkWhatsapp = whatsappAgencia
    ? `https://wa.me/${whatsappAgencia}?text=${encodeURIComponent(
        `Olá! Vim pela proposta ${clienteNome}, queria conversar sobre os valores antes de fechar.`
      )}`
    : null;

  return (
    <div className="px-4 py-10">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Coluna dos itens */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#111827]/50 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-[#F9FAFB]">O que está incluso</p>
              <p className="text-xs text-[#9CA3AF]">Serviços e entregas previstas para o mês.</p>
            </div>
            <p className="hidden text-right text-[10px] text-[#6B7280] sm:block">
              Ajuste as quantidades
              <br />
              se quiser personalizar
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {itens.map((item) => {
              const { Icon, cor } = iconePara(item.categoria);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#111827]/50 p-4 transition-opacity ${
                    item.quantidade === 0 ? "opacity-40" : ""
                  }`}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${cor}1A`, color: cor }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#F9FAFB]">{item.nome}</p>
                    {item.descricao && (
                      <p className="mt-0.5 text-xs leading-relaxed text-[#9CA3AF]">{item.descricao}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => mudarQuantidade(item.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-[#F9FAFB] hover:bg-white/5"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-5 text-center text-xs text-[#F9FAFB]">{item.quantidade}</span>
                      <button
                        onClick={() => mudarQuantidade(item.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-[#F9FAFB] hover:bg-white/5"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#E63946]">R$ {item.valor.toFixed(0)}</p>
                      {item.unidade && <p className="text-[10px] text-[#6B7280]">por {item.unidade}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {depoimentos.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-[#F9FAFB]">
                <Star size={14} className="text-[#E63946]" /> Quem confia, recomenda
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {depoimentos.map((d, i) => (
                  <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#111827]/50 p-4">
                    <p className="mb-2 text-xs leading-relaxed text-[#c2c0b6]">"{d.texto}"</p>
                    <p className="text-xs font-medium text-[#F9FAFB]">{d.nomeCliente}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-white/[0.06] bg-[#111827]/70 p-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">
              <BarChart3 size={12} /> Resumo do investimento
            </p>
            <div className="mb-3 flex flex-col gap-2">
              {itens
                .filter((i) => i.quantidade > 0)
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="truncate pr-2 text-[#9CA3AF]">{item.nome}</span>
                    <span className="shrink-0 text-[#F9FAFB]">R$ {item.valor.toFixed(0)}</span>
                  </div>
                ))}
            </div>
            <div className="mb-3 border-t border-white/[0.06] pt-3">
              <p className="text-xs text-[#9CA3AF]">Total mensal</p>
              <p className="text-2xl font-medium text-[#E63946]">R$ {total.toFixed(0)}</p>
            </div>
            <p className="rounded-lg bg-white/5 px-3 py-2 text-center text-[11px] text-[#9CA3AF]">
              Válido até {validoAte}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#111827]/70 p-5">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-[#F9FAFB]">
              <Award size={14} className="text-[#E63946]" /> Por que a Instaby?
            </p>
            <div className="flex flex-col gap-2">
              {PORQUES.map((p) => (
                <p key={p} className="flex items-center gap-2 text-xs text-[#c2c0b6]">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    ✓
                  </span>
                  {p}
                </p>
              ))}
            </div>
          </div>

          {linkWhatsapp && (
            <a
              href={linkWhatsapp}
              target="_blank"
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#111827]/70 p-4 hover:bg-[#111827]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <MessageCircle size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-[#F9FAFB]">Dúvidas?</p>
                <p className="text-[11px] text-[#9CA3AF]">Fale com a gente antes de decidir</p>
              </div>
            </a>
          )}
        </div>
      </div>

      {/* CTA final */}
      <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-white/[0.06] bg-gradient-to-r from-[#111827] to-[#1a0e10] p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xl font-medium text-[#F9FAFB]">
              Vamos <span className="text-[#E63946]">crescer juntos?</span>
            </p>
            <p className="text-xs text-[#9CA3AF]">Proposta segura e confidencial.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {linkWhatsapp && (
              <a
                href={linkWhatsapp}
                target="_blank"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-5 py-3 text-sm font-medium text-[#F9FAFB] hover:bg-white/5"
              >
                <MessageCircle size={14} /> Marcar uma conversa
              </a>
            )}
            <AceitarButton
              slug={slug}
              status={status}
              itensParaSalvar={itens.map((i) => ({ id: i.id, quantidade: i.quantidade, valor: i.valor }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
