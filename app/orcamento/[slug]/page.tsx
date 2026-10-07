import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ShieldCheck } from "lucide-react";
import OrcamentoInterativo from "./OrcamentoInterativo";
import { TopoOrcamento } from "@/components/orcamentos/TopoOrcamento";
import { obterApresentacaoOrcamento } from "@/lib/apresentacaoOrcamento";
import { obterMetadadosOrcamento } from "@/lib/orcamentoDocumento";
import { obterDadosAgencia } from "@/lib/dadosAgencia";

export const dynamic = "force-dynamic";

export default async function OrcamentoPublicoPage({
  params,
}: {
  params: { slug: string };
}) {
  const [orcamento, depoimentos, logos, config] = await Promise.all([
    prisma.orcamento.findUnique({
      where: { slug: params.slug },
      include: {
        cliente: true,
        itens: { include: { servico: true } },
      },
    }),
    prisma.depoimento.findMany({ where: { ativo: true }, orderBy: { id: "desc" }, take: 4 }),
    prisma.cliente.findMany({
      where: { exibirLogoPublico: true, logoUrl: { not: null } },
      select: { nome: true, logoUrl: true },
    }),
    prisma.configuracao.findUnique({ where: { id: "config" } }),
  ]);

  if (!orcamento) notFound();

  if (!orcamento.visualizadoEm) {
    prisma.orcamento.update({ where: { id: orcamento.id }, data: { visualizadoEm: new Date() } }).catch(() => {});
  }

  const apresentacao = obterApresentacaoOrcamento(
    orcamento.apresentacao,
    orcamento.cliente.nome,
    orcamento.itens.map((item) => item.servico.unidade),
  );

  const logosEmbaralhados = [...logos].sort(() => Math.random() - 0.5);

  const { validoAte, codigo } = obterMetadadosOrcamento(orcamento.id, orcamento.createdAt);
  const agencia = obterDadosAgencia(config);

  return (
    <div className="min-h-screen bg-[#0B0D12]">
      {/* Topo */}
      <div className="border-b border-white/[0.06] px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <img src={agencia.logoUrl} alt={agencia.nome} className="h-6 w-auto max-w-48 object-contain" />
          <div className="hidden items-center gap-2 sm:flex">
            {apresentacao.selo && <span className="max-w-56 break-words text-xs text-[#9CA3AF]">{apresentacao.selo}</span>}
            <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-[#F9FAFB]">
              #{codigo}
            </span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-[#9CA3AF]">
              Válido até {validoAte}
            </span>
          </div>
        </div>
      </div>

      <TopoOrcamento apresentacao={apresentacao} />

      <OrcamentoInterativo
        tipoProposta={apresentacao.tipo}
        condicoes={apresentacao.condicoes}
        slug={orcamento.slug}
        status={orcamento.status}
        clienteNome={orcamento.cliente.nome}
        validoAte={validoAte}
        whatsappAgencia={agencia.whatsapp || null}
        depoimentos={depoimentos.map((d) => ({ nomeCliente: d.nomeCliente, texto: d.texto }))}
        itensIniciais={orcamento.itens.map((item) => ({
          id: item.id,
          nome: item.nomeServico ?? item.servico.nome,
          descricao: item.descricaoServico ?? item.servico.descricao,
          categoria: item.servico.categoria,
          unidade: item.servico.unidade,
          quantidade: item.quantidade,
          valor: Number(item.valor),
        }))}
      />

      {logosEmbaralhados.length > 0 && (
        <div className="border-t border-white/[0.06] py-10">
          <p className="mb-7 text-center text-xs text-[#9CA3AF]">Empresas que confiam no nosso trabalho</p>
          <div
            className="group relative overflow-hidden"
            style={{
              maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            }}
          >
            <div
              className="flex w-max items-center gap-16 animate-marquee group-hover:[animation-play-state:paused]"
              style={{ animationDuration: `${Math.max(logosEmbaralhados.length * 4, 16)}s` }}
            >
              {[...logosEmbaralhados, ...logosEmbaralhados].map((l, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${l.nome}-${i}`}
                  src={l.logoUrl!}
                  alt={l.nome}
                  className="h-16 w-auto max-w-[190px] shrink-0 object-contain grayscale opacity-80 transition-opacity hover:opacity-100"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 pb-8 pt-2 text-[10px] text-[#6B7280]">
        <ShieldCheck size={11} /> Proposta segura e confidencial
      </div>
    </div>
  );
}
