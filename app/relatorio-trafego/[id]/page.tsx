import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente, permissoesDe } from "@/lib/permissoes";
import { STATUS_INTERNO_LABEL, AVALIACAO_LABEL, formatarNumeroOuNaoInformado } from "@/lib/trafego";
import { BotaoImprimirRelatorioTrafego } from "@/components/dashboard/trafego/BotaoImprimirRelatorioTrafego";

function fmtMoeda(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

type CampanhaSnapshot = {
  campanhaId: string;
  nome: string;
  objetivo: string | null;
  statusInterno: string;
  avaliacao: string;
  avaliacaoObjetivo: string | null;
  avaliacaoMeta: string | null;
  avaliacaoObservacoes: string | null;
  gasto: number;
  impressoes: number | null;
  alcance: number | null;
  resultadosPorIndicador: { indicador: string; label: string; total: number; qtdCampanhas: number }[];
  dataAtualizacao: string | null;
  temDados: boolean;
};

export default async function RelatorioTrafegoPage({ params }: { params: { id: string } }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  if (!permissoesDe(usuario).gerenciarTrafego) redirect("/dashboard");

  const relatorio = await prisma.relatorioTrafego.findUnique({
    where: { id: params.id },
    include: { cliente: { select: { nome: true, cor: true, logoUrl: true } }, geradoPor: { select: { nome: true } } },
  });
  if (!relatorio) notFound();
  if (!(await podeVerCliente(usuario, relatorio.clienteId))) redirect("/dashboard/trafego");

  const dados = relatorio.dadosSnapshot as unknown as { investimentoTotal: number; porCampanha: CampanhaSnapshot[] };
  const maiorGasto = Math.max(1, ...dados.porCampanha.map((c) => c.gasto));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:px-0 print:py-0">
      <BotaoImprimirRelatorioTrafego voltarHref="/dashboard/trafego?visao=relatorios" />

      <div className="rounded-2xl border border-border bg-card/60 p-6 print:border-none print:bg-white print:p-0 print:text-black">
        <div className="mb-5 flex items-start justify-between gap-3 border-b border-border/60 pb-4 print:border-black/20">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted print:text-black/60">Relatório de Tráfego Pago</p>
            <p className="text-lg font-semibold text-text print:text-black" style={{ color: relatorio.cliente.cor || undefined }}>
              {relatorio.cliente.nome}
            </p>
            <p className="text-sm text-muted print:text-black/70">
              {dataBr(relatorio.periodoInicio.toISOString())} – {dataBr(relatorio.periodoFim.toISOString())}
            </p>
          </div>
          <div className="text-right text-xs text-muted print:text-black/60">
            <p>Versão {relatorio.versao}</p>
            <p>Gerado em {dataBr(relatorio.createdAt.toISOString())}</p>
            {relatorio.geradoPor?.nome && <p>por {relatorio.geradoPor.nome}</p>}
          </div>
        </div>

        {relatorio.parcial && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400 print:border-black/30 print:bg-transparent print:text-black">
            Relatório parcial — os dados disponíveis não cobrem o período inteiro selecionado.
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-base/40 p-3 print:border-black/10">
            <p className="text-[10px] uppercase tracking-wide text-muted print:text-black/50">Investimento no período</p>
            <p className="text-lg font-semibold text-text print:text-black">{fmtMoeda(dados.investimentoTotal)}</p>
          </div>
          <div className="rounded-xl border border-border bg-base/40 p-3 print:border-black/10">
            <p className="text-[10px] uppercase tracking-wide text-muted print:text-black/50">Campanhas no relatório</p>
            <p className="text-lg font-semibold text-text print:text-black">{dados.porCampanha.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-base/40 p-3 print:border-black/10">
            <p className="text-[10px] uppercase tracking-wide text-muted print:text-black/50">Dados atualizados até</p>
            <p className="text-lg font-semibold text-text print:text-black">{dataBr(relatorio.dataAtualizacaoDados.toISOString())}</p>
          </div>
        </div>

        <p className="mb-2 text-sm font-medium text-text print:text-black">Investimento por campanha</p>
        <div className="mb-5 flex flex-col gap-1.5">
          {dados.porCampanha.map((c) => (
            <div key={c.campanhaId} className="flex items-center gap-2">
              <p className="w-32 shrink-0 truncate text-[11px] text-muted print:text-black/70" title={c.nome}>
                {c.nome}
              </p>
              <div className="h-4 flex-1 overflow-hidden rounded bg-base/60 print:bg-black/5">
                <div
                  className="h-full rounded bg-accent print:bg-black/60"
                  style={{ width: `${Math.max(2, (c.gasto / maiorGasto) * 100)}%` }}
                />
              </div>
              <p className="w-20 shrink-0 text-right text-[11px] text-text print:text-black">{fmtMoeda(c.gasto)}</p>
            </div>
          ))}
        </div>

        <p className="mb-2 text-sm font-medium text-text print:text-black">Investimento e resultados por campanha</p>
        <div className="mb-5 flex flex-col gap-3">
          {dados.porCampanha.map((c) => (
            <div key={c.campanhaId} className="rounded-xl border border-border bg-base/40 p-3 print:border-black/10">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
                <p className="text-sm font-medium text-text print:text-black">{c.nome}</p>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted print:border-black/20 print:text-black/60">
                  {STATUS_INTERNO_LABEL[c.statusInterno] || c.statusInterno}
                </span>
              </div>
              {!c.temDados ? (
                <p className="text-[11px] text-muted print:text-black/50">Sem dados importados nesse período.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                  <div>
                    <p className="text-muted print:text-black/50">Investido</p>
                    <p className="font-medium text-text print:text-black">{fmtMoeda(c.gasto)}</p>
                  </div>
                  <div>
                    <p className="text-muted print:text-black/50">Impressões</p>
                    <p className="font-medium text-text print:text-black">{formatarNumeroOuNaoInformado(c.impressoes)}</p>
                  </div>
                  <div>
                    <p className="text-muted print:text-black/50">Alcance</p>
                    <p className="font-medium text-text print:text-black">{formatarNumeroOuNaoInformado(c.alcance)}</p>
                  </div>
                  <div>
                    <p className="text-muted print:text-black/50">Objetivo</p>
                    <p className="font-medium text-text print:text-black">{c.objetivo || "não informado"}</p>
                  </div>
                  {c.resultadosPorIndicador.map((r) => (
                    <div key={r.indicador} className="col-span-2">
                      <p className="text-muted print:text-black/50">{r.label}</p>
                      <p className="font-medium text-text print:text-black">
                        {r.total.toLocaleString("pt-BR")}
                        {r.total > 0 && ` · R$ ${(c.gasto / r.total).toFixed(2)}/resultado`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 flex items-center gap-1.5 text-[11px]">
                <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent print:bg-transparent print:text-black">
                  {AVALIACAO_LABEL[c.avaliacao] || c.avaliacao}
                </span>
                {c.avaliacaoMeta && <span className="text-muted print:text-black/60">Meta: {c.avaliacaoMeta}</span>}
              </p>
              {c.avaliacaoObservacoes && (
                <p className="mt-1 text-[11px] text-muted print:text-black/60">{c.avaliacaoObservacoes}</p>
              )}
            </div>
          ))}
        </div>

        {(relatorio.avaliacaoGeral || relatorio.observacoes || relatorio.proximosPassos) && (
          <div className="mb-2 rounded-xl border border-border bg-base/40 p-3 print:border-black/10">
            {relatorio.avaliacaoGeral && (
              <p className="mb-1.5 text-sm text-text print:text-black">
                <span className="font-medium">Avaliação geral: </span>
                {relatorio.avaliacaoGeral}
              </p>
            )}
            {relatorio.observacoes && (
              <p className="mb-1.5 text-sm text-text print:text-black">
                <span className="font-medium">Observações: </span>
                {relatorio.observacoes}
              </p>
            )}
            {relatorio.proximosPassos && (
              <p className="text-sm text-text print:text-black">
                <span className="font-medium">Próximos passos: </span>
                {relatorio.proximosPassos}
              </p>
            )}
          </div>
        )}

        <p className="mt-4 text-center text-[10px] text-muted print:text-black/40">
          Dados atualizados até {dataBr(relatorio.dataAtualizacaoDados.toISOString())} · Relatório gerado pelo painel Instaby
        </p>
      </div>
    </div>
  );
}
