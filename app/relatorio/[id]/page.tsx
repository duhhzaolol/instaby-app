import { notFound } from "next/navigation";
import { ShieldCheck, TrendingUp, TrendingDown, Users, Eye, Heart, Share2, Bookmark, PlayCircle, Film, FileImage, MousePointerClick, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { visualDaRede } from "@/lib/redesSociais";
import { BotaoBaixarPdf, ComentarioCliente } from "./RelatorioInterativo";
import { HistoricoPublico } from "./HistoricoPublico";

function formatarData(d: Date) {
  return d.toLocaleDateString("pt-BR");
}

const BLOCOS_ORGANICOS: { chave: string; label: string; icone: any; prefixo?: string }[] = [
  { chave: "seguidoresFim", label: "Seguidores", icone: Users },
  { chave: "alcance", label: "Contas alcançadas", icone: Eye },
  { chave: "impressoes", label: "Impressões", icone: Eye },
  { chave: "curtidas", label: "Curtidas", icone: Heart },
  { chave: "comentariosQtd", label: "Comentários", icone: MessageIcon },
  { chave: "compartilhamentos", label: "Compartilhamentos", icone: Share2 },
  { chave: "salvamentos", label: "Salvamentos", icone: Bookmark },
  { chave: "visualizacoes", label: "Visualizações", icone: PlayCircle },
  { chave: "postsPublicados", label: "Posts publicados", icone: FileImage },
  { chave: "reelsPublicados", label: "Reels publicados", icone: Film },
];

const BLOCOS_PAGOS: { chave: string; label: string; icone: any; prefixo?: string }[] = [
  { chave: "investimento", label: "Investimento", icone: Target, prefixo: "R$ " },
  { chave: "alcance", label: "Alcance", icone: Eye },
  { chave: "impressoes", label: "Impressões", icone: Eye },
  { chave: "cliques", label: "Cliques", icone: MousePointerClick },
  { chave: "leads", label: "Leads", icone: Users },
];

function MessageIcon(props: any) {
  return <Heart {...props} />;
}

export default async function RelatorioPublicoPage({ params }: { params: { id: string } }) {
  const relatorio = await prisma.relatorioPeriodo.findUnique({
    where: { id: params.id },
    include: { cliente: true },
  });

  if (!relatorio) notFound();

  const anterior = await prisma.relatorioPeriodo.findFirst({
    where: { clienteId: relatorio.clienteId, rede: relatorio.rede, fim: { lt: relatorio.inicio } },
    orderBy: { fim: "desc" },
  });

  const historico = await prisma.relatorioPeriodo.findMany({
    where: { clienteId: relatorio.clienteId, rede: relatorio.rede, fim: { lte: relatorio.fim } },
    orderBy: { fim: "asc" },
    take: 12,
  });

  const { icone: IconeRede, cor, label, paga } = visualDaRede(relatorio.rede);
  const blocos = paga ? BLOCOS_PAGOS : BLOCOS_ORGANICOS;

  const crescimentoSeguidores =
    relatorio.seguidoresInicio && relatorio.seguidoresFim
      ? relatorio.seguidoresFim - relatorio.seguidoresInicio
      : null;
  const crescimentoPct =
    crescimentoSeguidores !== null && relatorio.seguidoresInicio
      ? Math.round((crescimentoSeguidores / relatorio.seguidoresInicio) * 1000) / 10
      : null;

  return (
    <div className="min-h-screen bg-[#0B0D12] print:bg-white">
      <div className="border-b border-white/[0.06] px-4 py-4 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
          <BotaoBaixarPdf />
        </div>
      </div>

      <div className="border-b border-white/[0.06] bg-gradient-to-br from-[#0B0D12] via-[#151822] to-[#0B0D12] px-4 py-14 print:bg-white">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="inline-block h-[1.5px] w-5 bg-[#E63946]" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-[#E63946]">
              relatório de performance
            </span>
            <span className="inline-block h-[1.5px] w-5 bg-[#E63946]" />
          </div>
          <p className="text-3xl font-medium leading-tight text-[#F9FAFB] sm:text-4xl">{relatorio.cliente.nome}</p>
          <p className="mb-2 flex items-center justify-center gap-2 text-lg text-[#9CA3AF]">
            <IconeRede size={18} style={{ color: cor }} /> {label}
          </p>
          <p className="text-sm text-[#6B7280]">
            {formatarData(relatorio.inicio)} até {formatarData(relatorio.fim)}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        {crescimentoSeguidores !== null && (
          <div className="mb-6 rounded-2xl border border-white/[0.06] bg-[#111827]/50 p-6 text-center">
            <p className="mb-2 text-xs uppercase tracking-wide text-[#9CA3AF]">Crescimento de seguidores</p>
            <p className="mb-1 flex items-center justify-center gap-2 text-3xl font-medium text-[#F9FAFB]">
              {crescimentoSeguidores >= 0 ? (
                <TrendingUp size={26} className="text-emerald-400" />
              ) : (
                <TrendingDown size={26} className="text-red-400" />
              )}
              {crescimentoSeguidores >= 0 ? "+" : ""}
              {crescimentoSeguidores} <span className="text-base text-[#9CA3AF]">({crescimentoPct}%)</span>
            </p>
            <p className="text-xs text-[#6B7280]">
              {relatorio.seguidoresInicio?.toLocaleString("pt-BR")} → {relatorio.seguidoresFim?.toLocaleString("pt-BR")}
            </p>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {blocos.map((b) => {
            const valor = (relatorio as any)[b.chave];
            if (valor === null || valor === undefined) return null;
            const Icon = b.icone;
            return (
              <div key={b.chave} className="rounded-xl border border-white/[0.06] bg-[#111827]/50 p-4">
                <Icon size={15} style={{ color: cor }} className="mb-2" />
                <p className="text-lg font-medium text-[#F9FAFB]">
                  {b.prefixo}
                  {Number(valor).toLocaleString("pt-BR")}
                </p>
                <p className="text-[11px] text-[#9CA3AF]">{b.label}</p>
              </div>
            );
          })}
        </div>

        {anterior && (
          <div className="mb-6 rounded-2xl border border-white/[0.06] bg-[#111827]/50 p-5">
            <p className="mb-2 text-xs uppercase tracking-wide text-[#9CA3AF]">Comparado ao período anterior</p>
            <p className="text-sm text-[#c2c0b6]">
              {formatarData(anterior.inicio)} a {formatarData(anterior.fim)}
              {anterior.seguidoresFim && relatorio.seguidoresFim && (
                <> — tinha {anterior.seguidoresFim.toLocaleString("pt-BR")} seguidores</>
              )}
            </p>
          </div>
        )}

        {historico.length >= 3 && (
          <HistoricoPublico
            cor={cor}
            rotulo={paga ? "Leads" : "Seguidores"}
            dados={historico
              .map((h) => ({
                periodo: formatarData(h.fim),
                valor: paga ? h.leads : h.seguidoresFim,
              }))
              .filter((d) => d.valor !== null) as { periodo: string; valor: number }[]}
          />
        )}

        {relatorio.comentarioAgencia && (
          <div className="mb-6 rounded-2xl border border-[#E63946]/20 bg-[#E63946]/5 p-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#E63946]">Comentário da Instaby</p>
            <p className="text-sm leading-relaxed text-[#F9FAFB]">{relatorio.comentarioAgencia}</p>
          </div>
        )}

        <ComentarioCliente relatorioId={relatorio.id} comentarioAtual={relatorio.comentarioCliente || ""} />
      </div>

      <div className="flex items-center justify-center gap-1.5 pb-8 pt-2 text-[10px] text-[#6B7280] print:hidden">
        <ShieldCheck size={11} /> Relatório confidencial — Instaby Agência
      </div>
    </div>
  );
}
