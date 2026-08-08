import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ShieldCheck } from "lucide-react";
import OrcamentoInterativo from "./OrcamentoInterativo";

const etapas = ["Briefing", "Análise", "Estratégia", "Execução", "Resultados"];

function gerarCodigo(id: string, data: Date) {
  return `PC-${data.getFullYear()}-${id.slice(0, 3).toUpperCase()}`;
}

function formatarData(d: Date) {
  return d.toLocaleDateString("pt-BR");
}

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

  const logosEmbaralhados = [...logos].sort(() => Math.random() - 0.5);

  const validoAte = new Date(orcamento.createdAt);
  validoAte.setDate(validoAte.getDate() + 15);
  const codigo = gerarCodigo(orcamento.id, orcamento.createdAt);

  return (
    <div className="min-h-screen bg-[#0B0D12]">
      {/* Topo */}
      <div className="border-b border-white/[0.06] px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-[#9CA3AF]">Proposta Comercial</span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-[#F9FAFB]">
              #{codigo}
            </span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-[#9CA3AF]">
              Válido até {formatarData(validoAte)}
            </span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-br from-[#0B0D12] via-[#151822] to-[#1a0e10] px-4 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-block h-[1.5px] w-5 bg-[#E63946]" />
              <span className="font-mono text-[11px] uppercase tracking-wide text-[#E63946]">
                proposta comercial
              </span>
            </div>
            <p className="text-4xl font-medium leading-tight text-[#F9FAFB]">gestão estratégica</p>
            <p className="mb-4 text-4xl font-medium leading-tight">
              <span className="text-[#E63946]">pra {orcamento.cliente.nome}</span>{" "}
              <span className="text-[#F9FAFB]">crescer.</span>
            </p>
            <p className="max-w-md text-sm leading-relaxed text-[#9CA3AF]">
              Conteúdo, tráfego e produção trabalhando juntos, com clareza de valor em cada etapa.
            </p>
          </div>

          <div className="relative hidden aspect-[4/3] items-center justify-center rounded-2xl border border-white/[0.06] bg-[#111827]/60 lg:flex">
            <svg viewBox="0 0 300 180" className="h-full w-full p-6">
              <defs>
                <linearGradient id="linhaChart" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E63946" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#E63946" stopOpacity="0" />
                </linearGradient>
              </defs>
              <text x="0" y="16" fill="#9CA3AF" fontSize="10" fontFamily="monospace">
                PERFORMANCE
              </text>
              <path
                d="M0 120 L40 100 L80 110 L120 70 L160 85 L200 40 L240 55 L300 15 L300 180 L0 180 Z"
                fill="url(#linhaChart)"
              />
              <path
                d="M0 120 L40 100 L80 110 L120 70 L160 85 L200 40 L240 55 L300 15"
                fill="none"
                stroke="#E63946"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Etapas */}
        <div className="relative mx-auto mt-10 grid max-w-4xl grid-cols-5 gap-2">
          {etapas.map((etapa, i) => (
            <div key={etapa}>
              <p className="mb-1.5 font-mono text-[10px] text-[#E63946]">0{i + 1}</p>
              <p className="mb-2 text-xs font-medium text-[#F9FAFB]">{etapa}</p>
              <div className="h-[2px] w-full rounded-full bg-[#E63946]/70" />
            </div>
          ))}
        </div>
      </div>

      <OrcamentoInterativo
        slug={orcamento.slug}
        status={orcamento.status}
        clienteNome={orcamento.cliente.nome}
        validoAte={formatarData(validoAte)}
        whatsappAgencia={config?.whatsappAgencia || null}
        depoimentos={depoimentos.map((d) => ({ nomeCliente: d.nomeCliente, texto: d.texto }))}
        itensIniciais={orcamento.itens.map((item) => ({
          id: item.id,
          nome: item.servico.nome,
          descricao: item.servico.descricao,
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
