import { notFound } from "next/navigation";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";

function fmt(d: Date) {
  return d.toLocaleDateString("pt-BR");
}

export default async function OnboardingPublicoPage({ params }: { params: { id: string } }) {
  const onboarding = await prisma.onboarding.findUnique({
    where: { id: params.id },
    include: { cliente: true, itens: { orderBy: { ordem: "asc" } } },
  });
  if (!onboarding) notFound();

  const concluidos = onboarding.itens
    .filter((i) => i.status === "concluido" && i.dataConclusao)
    .sort((a, b) => a.dataConclusao!.getTime() - b.dataConclusao!.getTime());

  const registrosIds = onboarding.itens.map((i) => i.registroTempoId).filter(Boolean) as string[];
  const registros = registrosIds.length
    ? await prisma.registroTempo.findMany({ where: { id: { in: registrosIds } } })
    : [];
  const minutosTotais = registros.reduce((s, r) => (r.fim ? s + (r.fim.getTime() - r.inicio.getTime()) / 1000 / 60 : s), 0);
  const horasTotais = (minutosTotais / 60).toFixed(1);

  const bloqueados = onboarding.itens.filter((i) => i.status === "bloqueado");

  const primeiraPublicacao = concluidos.find((i) => i.titulo.toLowerCase().includes("publicad"));
  const dias = primeiraPublicacao
    ? Math.round((primeiraPublicacao.dataConclusao!.getTime() - onboarding.dataInicio.getTime()) / (1000 * 60 * 60 * 24))
    : Math.round((Date.now() - onboarding.dataInicio.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-[#0B0D12]">
      <div className="border-b border-white/[0.06] px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
        </div>
      </div>

      <div className="border-b border-white/[0.06] bg-gradient-to-br from-[#0B0D12] via-[#151822] to-[#0B0D12] px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="inline-block h-[1.5px] w-5 bg-[#E63946]" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-[#E63946]">onboarding</span>
            <span className="inline-block h-[1.5px] w-5 bg-[#E63946]" />
          </div>
          <p className="mb-2 text-3xl font-medium text-[#F9FAFB] sm:text-4xl">{onboarding.cliente.nome}</p>
          <p className="text-sm text-[#6B7280]">
            {primeiraPublicacao
              ? `Levamos ${dias} dias até a primeira publicação.`
              : `${dias} dia(s) desde o início — ainda em andamento.`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-[#111827]/50 p-4 text-center">
            <p className="text-lg font-medium text-[#F9FAFB]">{fmt(onboarding.dataInicio)}</p>
            <p className="text-[11px] text-[#9CA3AF]">Início</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#111827]/50 p-4 text-center">
            <p className="text-lg font-medium text-[#F9FAFB]">
              {concluidos.length}/{onboarding.itens.length}
            </p>
            <p className="text-[11px] text-[#9CA3AF]">Checklist concluído</p>
          </div>
          {Number(horasTotais) > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-[#111827]/50 p-4 text-center">
              <p className="text-lg font-medium text-[#F9FAFB]">{horasTotais}h</p>
              <p className="text-[11px] text-[#9CA3AF]">Tempo da agência</p>
            </div>
          )}
        </div>

        <p className="mb-4 text-xs uppercase tracking-wide text-[#9CA3AF]">Linha do tempo</p>
        <div className="mb-8 flex flex-col gap-3">
          {concluidos.length === 0 ? (
            <p className="text-sm text-[#6B7280]">Nenhuma etapa concluída ainda.</p>
          ) : (
            concluidos.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm text-[#F9FAFB]">{item.titulo}</p>
                  <p className="text-xs text-[#6B7280]">{fmt(item.dataConclusao!)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {bloqueados.length > 0 && (
          <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-300">
              <Clock size={13} /> Aguardando
            </p>
            {bloqueados.map((item) => (
              <p key={item.id} className="text-sm text-amber-100">
                {item.titulo}
                {item.responsavel !== "agencia" && (
                  <span className="text-amber-300"> — responsabilidade {item.responsavel === "cliente" ? "do cliente" : "de terceiro"}</span>
                )}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 pb-8 pt-2 text-[10px] text-[#6B7280]">
        <ShieldCheck size={11} /> Instaby Agência
      </div>
    </div>
  );
}
