import Link from "next/link";
import {
  CheckSquare,
  Megaphone,
  ListChecks,
  LayoutDashboard,
  Archive,
  Wallet,
  History as HistoryIcon,
  FileBarChart,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import TrafegoClient from "@/components/dashboard/TrafegoClient";
import { TarefaRow } from "@/components/dashboard/TarefaRow";
import { NovaTarefaGlobalForm } from "@/components/dashboard/NovaTarefaGlobalForm";
import { getUsuarioAtual, clienteIdsPermitidos } from "@/lib/permissoes";
import { repararStatusInternoLegado, snapshotCampanhaAtual, snapshotCampanhaTotal, calcularSaldoCliente, agruparResultadosPorIndicador } from "@/lib/trafego";
import { SeletorClienteTrafego } from "@/components/dashboard/trafego/SeletorClienteTrafego";
import { VisaoGeralTrafego } from "@/components/dashboard/trafego/VisaoGeralTrafego";
import { VerbaMovimentacoes } from "@/components/dashboard/trafego/VerbaMovimentacoes";
import { HistoricoImportacoes } from "@/components/dashboard/trafego/HistoricoImportacoes";
import { ehAcumuladoMensal, marcosAcumuladosMensais } from "@/lib/agregarResultadosCampanha";
import { formatarDataRelatorio } from "@/lib/dataRelatorio";
import { resumirImpressoes } from "@/lib/metricasTrafego";
import { RetornoMensalTrafego } from "@/components/dashboard/trafego/RetornoMensalTrafego";
import type { VendaTrafego } from "@/lib/retornoTrafego";
import { RelatoriosTrafego } from "@/components/dashboard/trafego/RelatoriosTrafego";

// Views client-agnósticas (uma tabela cruzando todos os clientes autorizados) vs.
// client-scoped (operam sobre UM cliente por vez, escolhido via ?clienteId=) — ver
// SeletorClienteTrafego. gerenciarTrafego em si já é exigido por app/dashboard/trafego/
// layout.tsx; aqui só falta escopar por cliente autorizado (spec §7).
const VISOES = [
  { valor: "visao-geral", label: "Visão geral", icone: LayoutDashboard, clientScoped: true },
  { valor: "campanhas", label: "Campanhas", icone: Megaphone, clientScoped: false },
  { valor: "finalizadas", label: "Finalizadas", icone: Archive, clientScoped: false },
  { valor: "verba", label: "Verba e movimentações", icone: Wallet, clientScoped: true },
  { valor: "importacoes", label: "Histórico de importações", icone: HistoryIcon, clientScoped: true },
  { valor: "relatorios", label: "Relatórios", icone: FileBarChart, clientScoped: true },
  { valor: "rotina", label: "Rotina", icone: ListChecks, clientScoped: false },
] as const;

const ABAS_ROTINA = [
  { valor: "abertas", label: "Abertas" },
  { valor: "feito", label: "Concluídas" },
  { valor: "todas", label: "Todas" },
];

function serializarSnapshot(snap: {
  gasto: number;
  impressoes: number | null;
  alcance: number | null;
  resultadosPorIndicador: { indicador: string; label: string; total: number; qtdCampanhas: number }[];
  dataAtualizacao: Date | null;
  temDados: boolean;
}) {
  return {
    gasto: snap.gasto,
    impressoes: snap.impressoes,
    alcance: snap.alcance,
    resultadosPorIndicador: snap.resultadosPorIndicador,
    dataAtualizacao: snap.dataAtualizacao ? snap.dataAtualizacao.toISOString() : null,
    temDados: snap.temDados,
  };
}

export default async function TrafegoPage({
  searchParams,
}: {
  searchParams: { visao?: string; clienteId?: string; status?: string; campanhaIds?: string; mes?: string };
}) {
  const visaoInfo = VISOES.find((v) => v.valor === searchParams.visao) || VISOES[0];
  const visao = visaoInfo.valor;
  const filtroStatusRotina = searchParams.status || "abertas";

  const usuarioAtual = await getUsuarioAtual();
  const idsPermitidos = usuarioAtual ? await clienteIdsPermitidos(usuarioAtual) : null;
  const filtroClienteCliente = idsPermitidos ? { id: { in: idsPermitidos } } : {};
  const filtroClienteTarefa = idsPermitidos ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] } : {};

  const clientes = await prisma.cliente.findMany({
    where: filtroClienteCliente,
    select: { id: true, nome: true, cor: true },
    orderBy: { nome: "asc" },
  });

  // "Autorizado" aqui é só pertencer à lista acima, que já veio filtrada por
  // clienteIdsPermitidos — não precisa de uma segunda consulta pra confirmar. Resolvido
  // independente da visão atual ser client-scoped ou não, só pra dar pra manter o
  // mesmo cliente ao trocar de aba (ex: de Verba pra Relatórios) mesmo passando por uma
  // aba sem cliente (ex: Campanhas) no meio do caminho.
  const clienteSelecionado = searchParams.clienteId ? clientes.find((c) => c.id === searchParams.clienteId) : undefined;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-lg font-medium text-text">
          Tráfego Pago
          <AjudaContextual
            titulo="Tráfego Pago"
            texto="Organize campanhas por cliente, importe relatórios do Meta Ads semanalmente, controle a verba de mídia disponibilizada por cada cliente e gere relatórios em PDF. O saldo aqui é o controle interno da verba de mídia — separado do Financeiro da agência (contratos, mensalidades, cobranças), que fica em outro módulo."
            exemplo="Ex.: importa o CSV acumulado do mês toda segunda-feira — o sistema calcula sozinho quanto cada campanha gastou a mais desde a última importação e atualiza o saldo restante do cliente."
          />
        </div>
        <p className="text-sm text-muted">Campanhas, verba, importações e relatórios de tráfego pago.</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {VISOES.map((v) => {
          const Icon = v.icone;
          const ativo = visao === v.valor;
          const href =
            v.clientScoped && clienteSelecionado ? `/dashboard/trafego?visao=${v.valor}&clienteId=${clienteSelecionado.id}` : `/dashboard/trafego?visao=${v.valor}`;
          return (
            <Link
              key={v.valor}
              href={href}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                ativo ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
              }`}
            >
              <Icon size={12} /> {v.label}
            </Link>
          );
        })}
      </div>

      {/* ───────────── Telas escopadas por cliente ───────────── */}
      {visaoInfo.clientScoped && !clienteSelecionado && (
        <SeletorClienteTrafego clientes={clientes} visao={visao} />
      )}

      {visaoInfo.clientScoped && clienteSelecionado && visao === "visao-geral" && (
        <VisaoGeralVisao clienteId={clienteSelecionado.id} clienteNome={clienteSelecionado.nome} clientes={clientes} visao={visao} mesParam={searchParams.mes} />
      )}

      {visaoInfo.clientScoped && clienteSelecionado && visao === "verba" && (
        <VerbaVisao clienteId={clienteSelecionado.id} clienteNome={clienteSelecionado.nome} clientes={clientes} visao={visao} />
      )}

      {visaoInfo.clientScoped && clienteSelecionado && visao === "importacoes" && (
        <ImportacoesVisao clienteId={clienteSelecionado.id} clienteNome={clienteSelecionado.nome} clientes={clientes} visao={visao} />
      )}

      {visaoInfo.clientScoped && clienteSelecionado && visao === "relatorios" && (
        <RelatoriosVisao
          clienteId={clienteSelecionado.id}
          clienteNome={clienteSelecionado.nome}
          clientes={clientes}
          visao={visao}
          campanhaIdsParam={searchParams.campanhaIds}
        />
      )}

      {/* ───────────── Campanhas / Finalizadas (cruzam todos os clientes) ───────────── */}
      {(visao === "campanhas" || visao === "finalizadas") && (
        <CampanhasOuFinalizadas idsPermitidos={idsPermitidos} clientes={clientes} visao={visao} />
      )}

      {/* ───────────── Rotina (sem mudanças — já existia antes desse módulo) ───────────── */}
      {visao === "rotina" && (
        <RotinaVisao filtroClienteTarefa={filtroClienteTarefa} clientes={clientes} filtroStatusRotina={filtroStatusRotina} />
      )}
    </div>
  );
}

async function VisaoGeralVisao({ clienteId, clienteNome, clientes, visao, mesParam }: {
  clienteId: string;
  clienteNome: string;
  clientes: { id: string; nome: string; cor: string | null }[];
  visao: string;
  mesParam?: string;
}) {
  const [campanhasCliente, saldo, lotes] = await Promise.all([
    prisma.campanha.findMany({ where: { clienteId }, select: { id: true, nome: true, status: true, statusInterno: true, ultimoStatusMeta: true, avaliacao: true, avaliacaoMeta: true, avaliacaoObservacoes: true, dataInicio: true, dataFim: true }, orderBy: [{ dataInicio: "desc" }, { createdAt: "desc" }] }),
    calcularSaldoCliente(clienteId),
    prisma.loteImportacao.findMany({ where: { clienteId }, include: { itens: { orderBy: { createdAt: "asc" } } }, orderBy: [{ periodoFim: "desc" }, { createdAt: "desc" }] }),
  ]);
  const relatorios = lotes.map((lote) => ({ ...lote, inicio: lote.periodoInicio, fim: lote.periodoFim, verbaInvestida: Number(lote.gastoTotalArquivo), impressoes: null, alcance: null, resultados: null, planosFechados: null, valorRetorno: null })).filter(ehAcumuladoMensal);
  const meses = Array.from(new Set(relatorios.map((l) => l.fim.toISOString().slice(0, 7)))).sort().reverse();
  const mes = mesParam && meses.includes(mesParam) ? mesParam : meses[0];
  const marcos = marcosAcumuladosMensais(relatorios.filter((l) => l.fim.toISOString().slice(0, 7) === mes));
  const ultimo = marcos[marcos.length - 1];
  const itensPorCampanha = new Map((ultimo?.itens || []).filter((i) => i.campanhaId).map((i) => [i.campanhaId, i]));
  const campanhasView = repararStatusInternoLegado(campanhasCliente).filter((c) => itensPorCampanha.has(c.id)).map((c) => {
    const item = itensPorCampanha.get(c.id)!;
    return { id: c.id, nome: c.nome, statusInterno: c.statusInterno, ultimoStatusMeta: c.ultimoStatusMeta, avaliacao: c.avaliacao, avaliacaoMeta: c.avaliacaoMeta, avaliacaoObservacoes: c.avaliacaoObservacoes, dataInicio: c.dataInicio.toISOString(), dataFim: (item.termino || c.dataFim)?.toISOString() || null,
      detalhesMeta: { configAtribuicao: item.configAtribuicao, custoPorResultado: item.custoPorResultado == null ? null : Number(item.custoPorResultado), orcamentoConjunto: item.orcamentoConjunto == null ? null : Number(item.orcamentoConjunto), tipoOrcamento: item.tipoOrcamento },
      snapshot: serializarSnapshot({ gasto: Number(item.gastoAcumuladoArquivo), impressoes: item.impressoes, alcance: item.alcance, resultadosPorIndicador: agruparResultadosPorIndicador([item]), dataAtualizacao: ultimo.fim, temDados: true }) };
  });
  const pontos = marcos.map((lote) => {
    const grupos = agruparResultadosPorIndicador(lote.itens);
    const conhecidos = grupos.filter((g) => g.indicador !== "(sem indicador)" || g.total !== 0);
    return { data: lote.fim.toISOString(), gasto: Number(lote.gastoTotalArquivo), ...resumirImpressoes(lote.itens),
      alcance: null, resultados: conhecidos.length === 1 ? conhecidos[0].total : null,
      resultadosPorIndicador: conhecidos,
      resultadosLabel: conhecidos.map((g) => `${g.total.toLocaleString("pt-BR")} ${g.label}`).join(" · ") || "Indicador não informado" };
  });
  const periodoLabel = ultimo ? `${formatarDataRelatorio(ultimo.inicio)} – ${formatarDataRelatorio(ultimo.fim)}` : "Sem importações mensais";
  const fechado = !!ultimo && ultimo.fim.getUTCDate() === new Date(Date.UTC(ultimo.fim.getUTCFullYear(), ultimo.fim.getUTCMonth() + 1, 0)).getUTCDate();
  const retorno = mes ? await prisma.retornoMensalTrafego.findUnique({ where: { clienteId_mes: { clienteId, mes } } }) : null;
  return <div>
    <SeletorClienteTrafego clientes={clientes} clienteIdAtual={clienteId} visao={visao} />
    {meses.length > 0 && <form action="/dashboard/trafego" className="mb-4 flex items-center gap-2">
      <input type="hidden" name="visao" value={visao}/><input type="hidden" name="clienteId" value={clienteId}/>
      <label htmlFor="mes-trafego" className="text-xs text-muted">Mês do relatório</label>
      <select id="mes-trafego" name="mes" defaultValue={mes} className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-text">{meses.map((m) => <option key={m} value={m}>{formatarDataRelatorio(`${m}-01T00:00:00Z`, { month: "long", year: "numeric" })}</option>)}</select>
      <button className="rounded-lg bg-accent px-3 py-2 text-xs text-white">Consultar</button>
    </form>}
    <VisaoGeralTrafego clienteId={clienteId} clienteNome={clienteNome} saldo={saldo} campanhas={campanhasView} periodoLabel={periodoLabel} ultimaAtualizacao={ultimo?.fim.toISOString() || null} gastoMes={ultimo ? Number(ultimo.gastoTotalArquivo) : null} fechado={fechado} marcos={pontos}/>
    {mes && ultimo && <RetornoMensalTrafego key={mes} clienteId={clienteId} mes={mes} dataRelatorio={ultimo.fim.toISOString()} gasto={Number(ultimo.gastoTotalArquivo)} inicial={retorno ? { mes, apuradoAte: retorno.apuradoAte.toISOString().slice(0,10), itens: retorno.itens as VendaTrafego[], observacoes: retorno.observacoes } : null}/>}
  </div>;
}

async function VerbaVisao({
  clienteId,
  clienteNome,
  clientes,
  visao,
}: {
  clienteId: string;
  clienteNome: string;
  clientes: { id: string; nome: string; cor: string | null }[];
  visao: string;
}) {
  const [verba, saldo] = await Promise.all([
    prisma.verbaTrafego.findUnique({
      where: { clienteId },
      include: { movimentacoes: { orderBy: { dataMovimento: "desc" }, include: { criadoPor: { select: { nome: true } } } } },
    }),
    calcularSaldoCliente(clienteId),
  ]);

  const movimentacoesView = (verba?.movimentacoes || []).map((m: any) => ({
    id: m.id,
    tipo: m.tipo,
    valor: Number(m.valor),
    descricao: m.descricao,
    dataMovimento: m.dataMovimento.toISOString(),
    criadoPorNome: m.criadoPor?.nome || null,
  }));

  return (
    <div>
      <SeletorClienteTrafego clientes={clientes} clienteIdAtual={clienteId} visao={visao} />
      <VerbaMovimentacoes
        clienteId={clienteId}
        clienteNome={clienteNome}
        saldoInicial={verba ? Number(verba.saldoInicial) : 0}
        observacoesVerba={verba?.observacoes || null}
        inicioControle={verba?.inicioControle?.toISOString().slice(0,10) || null}
        movimentacoes={movimentacoesView}
        saldo={saldo}
      />
    </div>
  );
}

async function ImportacoesVisao({
  clienteId,
  clienteNome,
  clientes,
  visao,
}: {
  clienteId: string;
  clienteNome: string;
  clientes: { id: string; nome: string; cor: string | null }[];
  visao: string;
}) {
  const lotes = await prisma.loteImportacao.findMany({
    where: { clienteId },
    orderBy: { createdAt: "desc" },
    include: {
      criadoPor: { select: { nome: true } },
      itens: { include: { campanha: { select: { nome: true } } }, orderBy: { gastoIncremental: "desc" } },
    },
  });

  const lotesView = lotes.map((l: any) => ({
    id: l.id,
    nomeArquivo: l.nomeArquivo,
    contaAnuncios: l.contaAnuncios,
    arquivoUrl: l.arquivoUrl,
    periodoInicio: l.periodoInicio.toISOString(),
    periodoFim: l.periodoFim.toISOString(),
    arquivoAntigo: l.arquivoAntigo,
    linhasTotal: l.linhasTotal,
    linhasComGasto: l.linhasComGasto,
    gastoTotalArquivo: Number(l.gastoTotalArquivo),
    criadoPorNome: l.criadoPor?.nome || null,
    createdAt: l.createdAt.toISOString(),
    itens: l.itens.map((i: any) => ({
      id: i.id,
      nomeOriginal: i.nomeOriginal,
      campanhaNomeAtual: i.campanha?.nome || null,
      gastoAcumuladoArquivo: Number(i.gastoAcumuladoArquivo),
      gastoAnterior: Number(i.gastoAnterior),
      gastoIncremental: Number(i.gastoIncremental),
      resolucao: i.resolucao,
    })),
  }));

  return (
    <div>
      <SeletorClienteTrafego clientes={clientes} clienteIdAtual={clienteId} visao={visao} />
      <HistoricoImportacoes clienteId={clienteId} clienteNome={clienteNome} lotes={lotesView} />
    </div>
  );
}

async function RelatoriosVisao({
  clienteId,
  clienteNome,
  clientes,
  visao,
  campanhaIdsParam,
}: {
  clienteId: string;
  clienteNome: string;
  clientes: { id: string; nome: string; cor: string | null }[];
  visao: string;
  campanhaIdsParam?: string;
}) {
  const [campanhasCliente, versoes, ultimoLote] = await Promise.all([
    prisma.campanha.findMany({
      where: { clienteId },
      select: { id: true, nome: true, status: true, statusInterno: true, avaliacao: true, avaliacaoMeta: true, avaliacaoObservacoes: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.relatorioTrafego.findMany({
      where: { clienteId },
      orderBy: { versao: "desc" },
      include: { geradoPor: { select: { nome: true } } },
    }),
    prisma.loteImportacao.findFirst({ where: { clienteId }, orderBy: [{ periodoFim: "desc" }, { createdAt: "desc" }], select: { periodoInicio: true, periodoFim: true } }),
  ]);

  const campanhasOpcoes = repararStatusInternoLegado(campanhasCliente).map((c: any) => ({
    id: c.id,
    nome: c.nome,
    statusInterno: c.statusInterno,
    avaliacao: c.avaliacao, avaliacaoMeta: c.avaliacaoMeta, avaliacaoObservacoes: c.avaliacaoObservacoes,
  }));
  const versoesView = versoes.map((v: any) => ({
    id: v.id,
    versao: v.versao,
    periodoInicio: v.periodoInicio.toISOString(),
    periodoFim: v.periodoFim.toISOString(),
    parcial: v.parcial,
    geradoPorNome: v.geradoPor?.nome || null,
    createdAt: v.createdAt.toISOString(),
  }));

  const hoje = new Date();
  const inicioMesIso = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toLocaleDateString("en-CA");
  const hojeIso = hoje.toLocaleDateString("en-CA");
  const campanhaIdsPre = campanhaIdsParam ? campanhaIdsParam.split(",").filter(Boolean) : undefined;

  return (
    <div>
      <SeletorClienteTrafego clientes={clientes} clienteIdAtual={clienteId} visao={visao} />
      <RelatoriosTrafego
        clienteId={clienteId}
        clienteNome={clienteNome}
        campanhas={campanhasOpcoes}
        versoes={versoesView}
        periodoInicioDefault={ultimoLote?.periodoInicio.toISOString().slice(0,10) || inicioMesIso}
        periodoFimDefault={ultimoLote?.periodoFim.toISOString().slice(0,10) || hojeIso}
        campanhaIdsPreSelecionadas={campanhaIdsPre}
      />
    </div>
  );
}

async function CampanhasOuFinalizadas({
  idsPermitidos,
  clientes,
  visao,
}: {
  idsPermitidos: string[] | null;
  clientes: { id: string; nome: string; cor: string | null }[];
  visao: "campanhas" | "finalizadas";
}) {
  const todasCampanhas = await prisma.campanha.findMany({
    where: idsPermitidos ? { clienteId: { in: idsPermitidos } } : undefined,
    include: { cliente: { select: { id: true, nome: true, cor: true } }, avaliadoPor: { select: { nome: true } } },
    orderBy: [{ dataInicio: "desc" }, { createdAt: "desc" }],
  });

  const corrigidas = repararStatusInternoLegado(todasCampanhas);
  const doTipo = corrigidas.filter((c: any) =>
    visao === "campanhas"
      ? c.statusInterno === "em_acompanhamento" || c.statusInterno === "pausada"
      : c.statusInterno === "finalizada" || c.statusInterno === "arquivada"
  );
  const snapshots = await Promise.all(
    doTipo.map((c: any) => (visao === "campanhas" ? snapshotCampanhaAtual(c.id) : snapshotCampanhaTotal(c.id)))
  );
  const dados = doTipo.map((c: any, i: number) => ({
    id: c.id,
    clienteId: c.clienteId,
    clienteNome: c.cliente.nome,
    clienteCor: c.cliente.cor,
    nome: c.nome,
    plataforma: c.plataforma,
    objetivo: c.objetivo,
    verbaMensal: Number(c.verbaMensal),
    statusInterno: c.statusInterno,
    ultimoStatusMeta: c.ultimoStatusMeta,
    avaliacao: c.avaliacao,
    avaliacaoObjetivo: c.avaliacaoObjetivo,
    avaliacaoMeta: c.avaliacaoMeta,
    avaliacaoObservacoes: c.avaliacaoObservacoes,
    avaliadoPorNome: c.avaliadoPor?.nome || null,
    dataInicio: c.dataInicio.toISOString(),
    dataFim: c.dataFim?.toISOString() || null,
    observacoes: c.observacoes,
    orcamentoConjunto: c.orcamentoConjunto != null ? Number(c.orcamentoConjunto) : null,
    tipoOrcamento: c.tipoOrcamento,
    snapshot: serializarSnapshot(snapshots[i]),
  }));

  return (
    <div>
      {visao === "finalizadas" && (
        <p className="mb-4 text-xs text-muted">
          Finalizar ou arquivar aqui é só organização interna — não desliga a campanha na Meta, e não significa que
          ela fracassou. Use a avaliação pra registrar o que de fato aconteceu com ela.
        </p>
      )}
      <TrafegoClient campanhas={dados} clientes={clientes} contexto={visao === "campanhas" ? "ativas" : "finalizadas"} />
    </div>
  );
}

async function RotinaVisao({
  filtroClienteTarefa,
  clientes,
  filtroStatusRotina,
}: {
  filtroClienteTarefa: any;
  clientes: { id: string; nome: string; cor: string | null }[];
  filtroStatusRotina: string;
}) {
  const whereRotina =
    filtroStatusRotina === "feito"
      ? { categoria: "campanha", status: "feito", ...filtroClienteTarefa }
      : filtroStatusRotina === "todas"
      ? { categoria: "campanha", ...filtroClienteTarefa }
      : { categoria: "campanha", status: { not: "feito" }, ...filtroClienteTarefa };

  const tarefasRotina = await prisma.tarefa.findMany({
    where: whereRotina,
    include: { cliente: { select: { nome: true, cor: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-5 flex gap-2">
        {ABAS_ROTINA.map((a) => (
          <Link
            key={a.valor}
            href={`/dashboard/trafego?visao=rotina&status=${a.valor}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filtroStatusRotina === a.valor ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>

      <NovaTarefaGlobalForm
        clientes={clientes}
        categoriaFixa="campanha"
        placeholder="Ex: Trocar criativo, revisar públicos, ajustar verba..."
        textoBotao="Nova tarefa de tráfego"
      />

      {tarefasRotina.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 py-16 text-center">
          <CheckSquare size={28} className="mb-3 text-muted" />
          <p className="text-sm text-muted">Nenhuma tarefa de tráfego aqui.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tarefasRotina.map((t: any, i: number) => (
            <TarefaRow
              key={t.id}
              index={i}
              clienteNome={t.cliente?.nome || null}
              clienteCor={t.cliente?.cor || null}
              tarefa={{
                id: t.id,
                titulo: t.titulo,
                tipo: t.tipo,
                status: t.status,
                prazo: t.prazo?.toISOString() || null,
                categoria: t.categoria,
                descricao: t.descricao,
                prioridade: t.prioridade,
                clienteId: t.clienteId,
                driveFolderId: t.driveFolderId,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
