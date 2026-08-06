import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AceitarButton from "./AceitarButton";

export default async function OrcamentoPublicoPage({
  params,
}: {
  params: { slug: string };
}) {
  const orcamento = await prisma.orcamento.findUnique({
    where: { slug: params.slug },
    include: {
      cliente: true,
      itens: { include: { servico: true } },
    },
  });

  if (!orcamento) notFound();

  const total = orcamento.itens.reduce((soma, item) => soma + Number(item.valor), 0);

  return (
    <div className="min-h-screen bg-[#09090B] px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-white/[0.06] bg-[#09090B] p-7">
        <div className="mb-5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-[#9CA3AF]">
              instaby · proposta
            </span>
          </span>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <span className="inline-block h-[1.5px] w-5 bg-[#FACC15]" />
          <span className="font-mono text-[11px] uppercase tracking-wide text-[#FACC15]">
            proposta comercial
          </span>
        </div>

        <p className="text-3xl font-medium leading-tight text-[#F9FAFB]">gestão pensada</p>
        <p className="mb-3 text-3xl font-medium leading-tight text-[#FACC15]">
          pra {orcamento.cliente.nome} crescer.
        </p>
        <p className="mb-8 max-w-[95%] text-sm leading-relaxed text-[#9CA3AF]">
          Conteúdo, tráfego e produção trabalhando juntos, com clareza de valor em cada etapa.
        </p>

        <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-[#9CA3AF]">
          o que está incluso
        </p>

        <div className="mb-6 flex flex-col gap-2.5">
          {orcamento.itens.map((item) => (
            <div key={item.id} className="rounded-xl bg-[#111827] p-4">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-[#F9FAFB]">{item.servico.nome}</p>
                <span className="text-sm font-medium text-[#FACC15]">
                  R$ {Number(item.valor).toFixed(0)}
                </span>
              </div>
              {item.servico.descricao && (
                <p className="mt-1.5 text-xs leading-relaxed text-[#9CA3AF]">
                  {item.servico.descricao}
                </p>
              )}
              {item.quantidade > 1 && (
                <p className="mt-1 text-xs text-[#9CA3AF]">Quantidade: {item.quantidade}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mb-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="text-sm font-medium text-[#F9FAFB]">Total mensal</span>
          <span className="text-xl font-medium text-[#FACC15]">R$ {total.toFixed(0)}</span>
        </div>

        <AceitarButton slug={orcamento.slug} status={orcamento.status} />
      </div>
    </div>
  );
}
