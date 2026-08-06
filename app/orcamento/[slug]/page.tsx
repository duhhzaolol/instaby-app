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
    <div className="min-h-screen bg-base px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-[#262626] bg-base p-7">
        <div className="mb-5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
              instaby · proposta
            </span>
          </span>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <span className="inline-block h-[1.5px] w-5 bg-accent" />
          <span className="font-mono text-[11px] uppercase tracking-wide text-accent">
            proposta comercial
          </span>
        </div>

        <p className="text-3xl font-medium leading-tight text-white">gestão pensada</p>
        <p className="mb-3 text-3xl font-medium leading-tight text-accent">pra {orcamento.cliente.nome} crescer.</p>
        <p className="mb-8 max-w-[95%] text-sm leading-relaxed text-muted">
          Conteúdo, tráfego e produção trabalhando juntos, com clareza de valor em cada etapa.
        </p>

        <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">
          o que está incluso
        </p>

        <div className="mb-6 flex flex-col gap-2.5">
          {orcamento.itens.map((item) => (
            <div key={item.id} className="rounded-xl bg-card p-4">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-white">{item.servico.nome}</p>
                <span className="text-sm font-medium text-accent">
                  R$ {Number(item.valor).toFixed(0)}
                </span>
              </div>
              {item.servico.descricao && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.servico.descricao}</p>
              )}
              {item.quantidade > 1 && (
                <p className="mt-1 text-xs text-muted">Quantidade: {item.quantidade}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mb-6 flex items-center justify-between border-t border-[#262626] pt-4">
          <span className="text-sm font-medium text-white">Total mensal</span>
          <span className="text-xl font-medium text-accent">R$ {total.toFixed(0)}</span>
        </div>

        <AceitarButton slug={orcamento.slug} status={orcamento.status} />
      </div>
    </div>
  );
}
