import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ShieldCheck } from "lucide-react";
import OrcamentoInterativo from "./OrcamentoInterativo";

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

  if (!orcamento.visualizadoEm) {
    prisma.orcamento.update({ where: { id: orcamento.id }, data: { visualizadoEm: new Date() } }).catch(() => {});
  }

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

      {/* Hero centralizado */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-[#0B0D12] via-[#151822] to-[#0B0D12] px-4 py-16">
        {/* gráfico decorativo de fundo, bem sutil */}
        <svg viewBox="0 0 800 300" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]">
          <defs>
            <linearGradient id="linhaChart" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E63946" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#E63946" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 220 L100 190 L200 205 L300 130 L400 160 L500 80 L600 110 L700 40 L800 60 L800 300 L0 300 Z"
            fill="url(#linhaChart)"
          />
          <path
            d="M0 220 L100 190 L200 205 L300 130 L400 160 L500 80 L600 110 L700 40 L800 60"
            fill="none"
            stroke="#E63946"
            strokeWidth="2"
          />
        </svg>

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="inline-block h-[1.5px] w-5 bg-[#E63946]" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-[#E63946]">proposta comercial</span>
            <span className="inline-block h-[1.5px] w-5 bg-[#E63946]" />
          </div>
          <p className="text-3xl font-medium leading-tight text-[#F9FAFB] sm:text-4xl">gestão estratégica</p>
          <p className="mb-4 text-3xl font-medium leading-tight sm:text-4xl">
            <span className="text-[#E63946]">pra {orcamento.cliente.nome}</span>{" "}
            <span className="text-[#F9FAFB]">crescer.</span>
          </p>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[#9CA3AF]">
            Conteúdo, tráfego e produção trabalhando juntos, com clareza de valor em cada etapa.
          </p>
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
