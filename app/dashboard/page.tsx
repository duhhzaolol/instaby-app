import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/dashboard/DashboardClient";
import InicioEditor, { type TarefaEditor } from "@/components/dashboard/InicioEditor";
import InicioTrafego, {
  type CampanhaRitmo,
  type AlertaTrafego,
  type RelatorioResumo,
  type TarefaCriativo,
} from "@/components/dashboard/InicioTrafego";
import type { PessoaAgora } from "@/components/dashboard/EquipeAgora";
import { getUsuarioAtual, permissoesDe, clienteIdsPermitidos, type Usuario } from "@/lib/permissoes";
import { totalizarResultados, calcularRitmoVerba } from "@/lib/agregarResultadosCampanha";
import { redirect } from "next/navigation";

function inicioMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function inicioMesAnterior() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

function inicioMesesAtras(n: number) {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - n, 1);
}

function inicioHoje() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fimHoje() {
  const d = inicioHoje();
  d.setDate(d.getDate() + 1);
  return d;
}

function fimAmanha() {
  const d = inicioHoje();
  d.setDate(d.getDate() + 2);
  return d;
}

function diasNoFuturo(n: number) {
  const d = inicioHoje();
  d.setDate(d.getDate() + n);
  return d;
}

// Segunda-feira dessa semana (00h) — convenção de semana usada em "horas da
// semana" e "tarefas feitas essa semana" no Início (redesign v144, Parte 2).
function inicioSemana() {
  const d = inicioHoje();
  const dia = d.getDay(); // 0 = domingo
  const diff = dia === 0 ? 6 : dia - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function horas(inicio: Date, fim: Date | null) {
  const fimReal = fim || new Date();
  return Math.max(0, (fimReal.getTime() - inicio.getTime()) / (1000 * 60 * 60));
}

export default async function DashboardPage() {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  const pode = permissoesDe(usuario);

  if (pode.master) return <InicioDono />;
  if (pode.gerenciarTrafego) return <InicioTrafegoPage usuario={usuario} />;
  return <InicioEditorPage usuario={usuario} />;
}

// ─────────────────────────────────────────────────────────────────────────
// DONO — visão completa da agência (redesign v144, Parte 2: estende o que já
// existia com Equipe agora, Tarefas por status, mais 2 alertas e Caixa 7 dias)
// ─────────────────────────────────────────────────────────────────────────
async function InicioDono() {
  const [
    clientesAtivos,
    leadsPendentes,
    cobrancasPagasMes,
    cobrancasPendentes,
    tarefasAbertas,
    tarefas,
    clientes,
    clientesComContagem,
    tarefasHoje,
    tarefasAmanha,
    config,
    cobrancasPagasPorCliente,
    cobrancasRecentes,
    clientesRecentes,
    contratosRecentes,
    orcamentosRecentes,
    faturamentoMesAnteriorAgg,
    tarefasAtrasadas,
    cobrancasVencidas,
    contratosAssinados,
    despesasSemClassificacao,
    itensOnboardingBloqueados,
    oportunidadesAbertas,
    cobrancasPagasUltimosMeses,
    usuariosAtivos,
    registrosAbertos,
    registrosSemana,
    tarefasAFazerCount,
    tarefasEmAndamentoCount,
    tarefasFeitasSemana,
    propostasSemResposta,
    tarefasSemResponsavel,
    cobrancasProximosDias,
    despesasProximosDias,
  ] = await Promise.all([
    prisma.cliente.count({ where: { status: "ativo" } }),
    prisma.cliente.count({ where: { status: "lead" } }),
    prisma.cobranca.aggregate({
      _sum: { valor: true },
      where: { status: "pago", createdAt: { gte: inicioMes() } },
    }),
    prisma.cobranca.aggregate({
      _sum: { valor: true },
      _count: true,
      where: { status: { in: ["pendente", "atrasado"] } },
    }),
    prisma.tarefa.count({ where: { status: { in: ["a_fazer", "em_andamento"] } } }),
    prisma.tarefa.findMany({
      include: { cliente: { select: { nome: true, cor: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.cliente.findMany({
      where: { status: { not: "inativo" } },
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
    prisma.cliente.findMany({
      where: { status: "ativo" },
      select: {
        id: true,
        nome: true,
        cor: true,
        _count: { select: { tarefas: true } },
        tarefas: { where: { status: { not: "feito" } }, select: { id: true } },
      },
      orderBy: { nome: "asc" },
      take: 6,
    }),
    prisma.tarefa.findMany({
      where: { prazo: { gte: inicioHoje(), lt: fimHoje() } },
      include: { cliente: { select: { nome: true, cor: true } } },
      orderBy: { prazo: "asc" },
    }),
    prisma.tarefa.findMany({
      where: { prazo: { gte: fimHoje(), lt: fimAmanha() }, status: { not: "feito" } },
      include: { cliente: { select: { nome: true, cor: true } } },
      orderBy: { prazo: "asc" },
    }),
    prisma.configuracao.findUnique({ where: { id: "config" } }),
    prisma.cobranca.findMany({
      where: { status: "pago", createdAt: { gte: inicioMes() } },
      include: { cliente: { select: { nome: true, cor: true } } },
    }),
    prisma.cobranca.findMany({
      where: { status: "pago" },
      include: { cliente: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.cliente.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.contrato.findMany({
      include: { cliente: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.orcamento.findMany({
      where: { status: "aceito" },
      include: { cliente: { select: { nome: true } }, itens: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.cobranca.aggregate({
      _sum: { valor: true },
      where: { status: "pago", createdAt: { gte: inicioMesAnterior(), lt: inicioMes() } },
    }),
    prisma.tarefa.count({ where: { status: { not: "feito" }, prazo: { lt: new Date() } } }),
    prisma.cobranca.count({ where: { status: { in: ["pendente", "atrasado"] }, vencimento: { lt: new Date() } } }),
    prisma.contrato.findMany({
      where: { status: "assinado" },
      include: { cliente: { select: { nome: true, prazoContratoMeses: true } } },
    }),
    prisma.despesa.count({ where: { categoriaFinanceira: null, status: { not: "cancelado" } } }),
    prisma.itemOnboarding.count({ where: { status: "bloqueado", onboarding: { status: "em_andamento" } } }),
    prisma.oportunidade.findMany({ where: { status: { notIn: ["ganho", "perdido"] } } }),
    // Pra montar o gráfico de faturamento do Dashboard — agrupado por mês em JS logo
    // abaixo, porque "group by mês" não tem um jeito direto no Prisma sem SQL cru.
    prisma.cobranca.findMany({
      where: { status: "pago", createdAt: { gte: inicioMesesAtras(5) } },
      select: { valor: true, createdAt: true },
    }),
    prisma.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, cargo: true, master: true, gerenciarTrafego: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.registroTempo.findMany({
      where: { fim: null, usuarioId: { not: null } },
      select: { usuarioId: true, atividade: true, cliente: { select: { nome: true } } },
    }),
    prisma.registroTempo.findMany({
      where: { usuarioId: { not: null }, inicio: { gte: inicioSemana() } },
      select: { usuarioId: true, inicio: true, fim: true },
    }),
    prisma.tarefa.count({ where: { status: "a_fazer" } }),
    prisma.tarefa.count({ where: { status: "em_andamento" } }),
    prisma.tarefa.count({ where: { status: "feito", concluidaEm: { gte: inicioSemana() } } }),
    prisma.orcamento.count({ where: { status: "pendente", enviadoEm: { not: null } } }),
    prisma.tarefa.count({ where: { status: { not: "feito" }, responsavelId: null } }),
    prisma.cobranca.findMany({
      where: { status: { in: ["pendente", "atrasado"] }, vencimento: { gte: inicioHoje(), lt: diasNoFuturo(7) } },
      select: { valor: true, vencimento: true },
    }),
    prisma.despesa.findMany({
      where: { status: { in: ["pendente", "atrasado"] }, vencimento: { gte: inicioHoje(), lt: diasNoFuturo(7) } },
      select: { valor: true, vencimento: true },
    }),
  ]);

  const metaFaturamento = config?.metaFaturamentoMensal ? Number(config.metaFaturamentoMensal) : 0;
  const faturamentoMes = Number(cobrancasPagasMes._sum.valor || 0);
  const faturamentoMesAnterior = Number(faturamentoMesAnteriorAgg._sum.valor || 0);

  const contratosRenovando = contratosAssinados.filter((c) => {
    if (!c.cliente.prazoContratoMeses) return false;
    const renovacao = new Date(c.createdAt);
    renovacao.setMonth(renovacao.getMonth() + c.cliente.prazoContratoMeses);
    const dias = Math.round((renovacao.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return dias <= 30;
  }).length;

  const oportunidadesSemProximaAcao = oportunidadesAbertas.filter((o) => !o.proximaAcao || !o.dataProximaAcao).length;

  const alertas = [
    { label: "Tarefas atrasadas", contagem: tarefasAtrasadas, href: "/dashboard/tarefas", cor: "#EF4444" },
    { label: "Tarefas sem responsável", contagem: tarefasSemResponsavel, href: "/dashboard/tarefas", cor: "#F59E0B" },
    { label: "Cobranças vencidas", contagem: cobrancasVencidas, href: "/dashboard/financeiro/contas-a-receber", cor: "#EF4444" },
    { label: "Propostas enviadas sem resposta", contagem: propostasSemResposta, href: "/dashboard/orcamentos", cor: "#F59E0B" },
    { label: "Contrato(s) renovando em breve", contagem: contratosRenovando, href: "/dashboard/contratos", cor: "#F59E0B" },
    { label: "Despesas sem classificação", contagem: despesasSemClassificacao, href: "/dashboard/financeiro/contas-a-pagar?aba=todas&categoria=sem_classificacao", cor: "#F59E0B" },
    { label: "Item(ns) de onboarding bloqueados", contagem: itensOnboardingBloqueados, href: "/dashboard/clientes", cor: "#F59E0B" },
    { label: "Oportunidade(s) sem próxima ação", contagem: oportunidadesSemProximaAcao, href: "/dashboard/oportunidades", cor: "#9CA3AF" },
  ].filter((a) => a.contagem > 0);
  const variacaoFaturamento =
    faturamentoMesAnterior > 0 ? Math.round(((faturamentoMes - faturamentoMesAnterior) / faturamentoMesAnterior) * 100) : null;

  const somaPorCliente: Record<string, { nome: string; cor: string | null; valor: number }> = {};
  cobrancasPagasPorCliente.forEach((c) => {
    const chave = c.cliente.nome;
    somaPorCliente[chave] ||= { nome: c.cliente.nome, cor: c.cliente.cor, valor: 0 };
    somaPorCliente[chave].valor += Number(c.valor);
  });
  const totalPorClientes = Object.values(somaPorCliente).reduce((s, c) => s + c.valor, 0);
  const performancePorCliente = Object.values(somaPorCliente)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6)
    .map((c) => ({ ...c, percentual: totalPorClientes > 0 ? Math.round((c.valor / totalPorClientes) * 100) : 0 }));

  // Últimos 6 meses (incluindo o atual), sempre na ordem cronológica, mesmo os meses
  // sem nenhuma cobrança paga ainda (entram com R$ 0 — não somem do eixo).
  const baldes: { chave: string; mes: string; valor: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = inicioMesesAtras(i);
    baldes.push({
      chave: `${d.getFullYear()}-${d.getMonth()}`,
      mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      valor: 0,
    });
  }
  cobrancasPagasUltimosMeses.forEach((c) => {
    const chave = `${c.createdAt.getFullYear()}-${c.createdAt.getMonth()}`;
    const balde = baldes.find((b) => b.chave === chave);
    if (balde) balde.valor += Number(c.valor);
  });
  const faturamentoPorMes = baldes.map((b) => ({ mes: b.mes, valor: b.valor }));

  // Equipe agora: pra cada pessoa ativa, o registro aberto dela (se tiver) e a soma
  // de horas lançadas essa semana (conta o que já rodou de um registro em aberto
  // também, não só os fechados — mesmo espírito de "quanto já trabalhou até agora").
  const horasPorPessoa: Record<string, number> = {};
  registrosSemana.forEach((r) => {
    if (!r.usuarioId) return;
    horasPorPessoa[r.usuarioId] = (horasPorPessoa[r.usuarioId] || 0) + horas(r.inicio, r.fim);
  });
  const equipeAgora: PessoaAgora[] = usuariosAtivos.map((u) => {
    const aberto = registrosAbertos.find((r) => r.usuarioId === u.id);
    return {
      id: u.id,
      nome: u.nome,
      cargo: u.cargo,
      cor: u.master ? "accent" : u.gerenciarTrafego ? "pessoa-trafego" : "pessoa-editor",
      atividadeAtual: aberto ? { atividade: aberto.atividade, clienteNome: aberto.cliente?.nome || null } : null,
      horasSemana: horasPorPessoa[u.id] || 0,
    };
  });

  // Caixa dos próximos 7 dias — a receber/a pagar por dia (sem "saldo bancário"
  // acumulado, que exigiria um saldo inicial que o app não guarda ainda).
  const chaveDia = (d: Date) => d.toISOString().slice(0, 10);
  const diasCaixa: { chave: string; dia: string; aReceber: number; aPagar: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = diasNoFuturo(i);
    diasCaixa.push({
      chave: chaveDia(d),
      dia: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", ""),
      aReceber: 0,
      aPagar: 0,
    });
  }
  cobrancasProximosDias.forEach((c) => {
    if (!c.vencimento) return;
    const balde = diasCaixa.find((d) => d.chave === chaveDia(c.vencimento!));
    if (balde) balde.aReceber += Number(c.valor);
  });
  despesasProximosDias.forEach((d) => {
    if (!d.vencimento) return;
    const balde = diasCaixa.find((b) => b.chave === chaveDia(d.vencimento!));
    if (balde) balde.aPagar += Number(d.valor);
  });

  type Atividade = { id: string; texto: string; cliente: string; valor?: number; data: Date; tipo: string };
  const atividades: Atividade[] = [
    ...cobrancasRecentes.map((c) => ({
      id: `cobranca-${c.id}`,
      texto: "Pagamento recebido",
      cliente: c.cliente.nome,
      valor: Number(c.valor),
      data: c.createdAt,
      tipo: "pagamento",
    })),
    ...clientesRecentes.map((c) => ({
      id: `cliente-${c.id}`,
      texto: "Novo cliente adicionado",
      cliente: c.nome,
      data: c.createdAt,
      tipo: "cliente",
    })),
    ...contratosRecentes.map((c) => ({
      id: `contrato-${c.id}`,
      texto: c.status === "assinado" ? "Contrato assinado" : "Contrato gerado",
      cliente: c.cliente.nome,
      data: c.createdAt,
      tipo: "contrato",
    })),
    ...orcamentosRecentes.map((o) => ({
      id: `orcamento-${o.id}`,
      texto: "Proposta aceita",
      cliente: o.cliente.nome,
      valor: o.itens.reduce((s, i) => s + Number(i.valor), 0),
      data: o.createdAt,
      tipo: "orcamento",
    })),
  ]
    .sort((a, b) => b.data.getTime() - a.data.getTime())
    .slice(0, 6);

  return (
    <DashboardClient
      metrics={{
        clientesAtivos,
        leadsPendentes,
        faturamentoMes: Number(cobrancasPagasMes._sum.valor || 0),
        cobrancasPendentesValor: Number(cobrancasPendentes._sum.valor || 0),
        cobrancasPendentesQtd: cobrancasPendentes._count,
        tarefasAbertas,
      }}
      tarefas={tarefas.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        tipo: t.tipo,
        status: t.status,
        prazo: t.prazo?.toISOString() || null,
        categoria: t.categoria,
        descricao: t.descricao,
        prioridade: t.prioridade,
        clienteId: t.clienteId,
        clienteNome: t.cliente?.nome || null,
        clienteCor: t.cliente?.cor || null,
      }))}
      clientes={clientes}
      clientesResumo={clientesComContagem.map((c) => ({
        id: c.id,
        nome: c.nome,
        cor: c.cor,
        totalTarefas: c._count.tarefas,
        pendentes: c.tarefas.length,
      }))}
      tarefasHoje={tarefasHoje.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        categoria: t.categoria,
        prazo: t.prazo!.toISOString(),
        clienteNome: t.cliente?.nome || null,
        clienteCor: t.cliente?.cor || null,
      }))}
      tarefasAmanha={tarefasAmanha.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        categoria: t.categoria,
        prazo: t.prazo!.toISOString(),
        clienteNome: t.cliente?.nome || null,
        clienteCor: t.cliente?.cor || null,
      }))}
      meta={{ valor: metaFaturamento, atual: faturamentoMes }}
      alertas={alertas}
      performancePorCliente={performancePorCliente}
      variacaoFaturamento={variacaoFaturamento}
      atividades={atividades.map((a) => ({ ...a, data: a.data.toISOString() }))}
      faturamentoPorMes={faturamentoPorMes}
      equipeAgora={equipeAgora}
      tarefasPorStatus={{ aFazer: tarefasAFazerCount, emAndamento: tarefasEmAndamentoCount, feitasSemana: tarefasFeitasSemana }}
      caixa7Dias={diasCaixa.map((d) => ({ dia: d.dia, aReceber: d.aReceber, aPagar: d.aPagar }))}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EDITOR — sem nenhum valor em R$, foco no que essa pessoa tem pra fazer
// (redesign v144, Parte 2)
// ─────────────────────────────────────────────────────────────────────────
async function InicioEditorPage({ usuario }: { usuario: Usuario }) {
  const usuarioId = usuario.id;
  const idsPermitidos = await clienteIdsPermitidos(usuario);
  const filtroClienteTarefa = idsPermitidos ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] } : {};

  const incluirTarefa = {
    cliente: { select: { nome: true, cor: true } },
    checklist: { orderBy: { ordem: "asc" as const } },
  };

  const [fazendoAgoraRaw, minhaFilaRaw, disponiveisRaw, proximasCaptacoesRaw, registrosSemana] = await Promise.all([
    prisma.tarefa.findMany({
      where: { responsavelId: usuarioId, status: "em_andamento", ...filtroClienteTarefa },
      include: incluirTarefa,
      orderBy: { createdAt: "desc" },
    }),
    prisma.tarefa.findMany({
      where: { responsavelId: usuarioId, status: "a_fazer", ...filtroClienteTarefa },
      include: incluirTarefa,
    }),
    prisma.tarefa.findMany({
      where: { responsavelId: null, status: { not: "feito" }, ...filtroClienteTarefa },
      include: { cliente: { select: { nome: true, cor: true } } },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.tarefa.findMany({
      where: {
        categoria: { in: ["gravacao", "reel", "fotos"] },
        status: { not: "feito" },
        prazo: { gte: inicioHoje() },
        ...filtroClienteTarefa,
      },
      include: { cliente: { select: { nome: true, cor: true } } },
      take: 8,
    }),
    prisma.registroTempo.findMany({
      where: { usuarioId, inicio: { gte: inicioSemana() } },
      select: { inicio: true, fim: true },
    }),
  ]);

  // Ordena por prazo (quem não tem prazo vai pro fim) em JS — mais simples e
  // portável que depender de "nulls last" do driver do banco.
  function ordenarPorPrazo<T extends { prazo: Date | null }>(lista: T[]): T[] {
    return [...lista].sort((a, b) => {
      if (!a.prazo && !b.prazo) return 0;
      if (!a.prazo) return 1;
      if (!b.prazo) return -1;
      return a.prazo.getTime() - b.prazo.getTime();
    });
  }

  function mapear(t: (typeof fazendoAgoraRaw)[number]): TarefaEditor {
    return {
      id: t.id,
      titulo: t.titulo,
      categoria: t.categoria,
      prazo: t.prazo?.toISOString() || null,
      clienteId: t.clienteId,
      clienteNome: t.cliente?.nome || null,
      clienteCor: t.cliente?.cor || null,
      checklist: t.checklist.map((c) => ({ id: c.id, titulo: c.titulo, feito: c.feito })),
    };
  }

  // Mesmo formato de `mapear`, mas pras duas listas sem checklist (disponíveis e
  // próximas captações vêm da mesma query base, sem o include de checklist).
  function mapearSimples(t: (typeof disponiveisRaw)[number]): TarefaEditor {
    return {
      id: t.id,
      titulo: t.titulo,
      categoria: t.categoria,
      prazo: t.prazo?.toISOString() || null,
      clienteId: t.clienteId,
      clienteNome: t.cliente?.nome || null,
      clienteCor: t.cliente?.cor || null,
    };
  }

  const horasSemana = registrosSemana.reduce((s, r) => s + horas(r.inicio, r.fim), 0);

  return (
    <InicioEditor
      usuarioId={usuarioId}
      fazendoAgora={ordenarPorPrazo(fazendoAgoraRaw).map(mapear)}
      minhaFila={ordenarPorPrazo(minhaFilaRaw).map(mapear)}
      disponiveis={disponiveisRaw.map(mapearSimples)}
      proximasCaptacoes={ordenarPorPrazo(proximasCaptacoesRaw).map(mapearSimples)}
      horasSemana={horasSemana}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TRÁFEGO — indicadores das campanhas que essa pessoa gerencia (redesign
// v144, Parte 2). Sem ligação com Financeiro (verba não passa pela agência).
// ─────────────────────────────────────────────────────────────────────────
async function InicioTrafegoPage({ usuario }: { usuario: Usuario }) {
  const idsPermitidos = await clienteIdsPermitidos(usuario);
  const filtroCliente = idsPermitidos ? { clienteId: { in: idsPermitidos } } : {};

  const [resultadosDoMes, campanhasAtivas, resultadosUltimos7Dias, relatoriosDoMes, criativosPedidosRaw] = await Promise.all([
    prisma.resultadoCampanha.findMany({
      where: { campanha: filtroCliente, inicio: { gte: inicioMes() } },
      select: { inicio: true, fim: true, verbaInvestida: true, impressoes: true, alcance: true, resultados: true, planosFechados: true, valorRetorno: true, campanhaId: true },
    }),
    prisma.campanha.findMany({
      where: { status: "ativa", ...filtroCliente },
      include: { cliente: { select: { nome: true, cor: true } } },
    }),
    prisma.resultadoCampanha.findMany({
      where: { campanha: { status: "ativa", ...filtroCliente }, fim: { gte: diasNoFuturo(-7) } },
      select: { campanhaId: true },
    }),
    prisma.relatorioPeriodo.findMany({
      // Aqui "cliente" é a relação com o model Cliente (cuja própria chave é "id",
      // não "clienteId" — diferente de `filtroCliente`, feito pra filtrar Campanha
      // diretamente). Por isso não reaproveita `filtroCliente` aqui.
      where: {
        cliente: idsPermitidos ? { id: { in: idsPermitidos } } : {},
        inicio: { lte: new Date() },
        fim: { gte: inicioMes() },
      },
      include: { cliente: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.tarefa.findMany({
      where: {
        categoria: { in: ["arte", "reel", "fotos", "gravacao"] },
        status: { not: "feito" },
        cliente: { campanhas: { some: { status: "ativa" } }, ...(idsPermitidos ? { id: { in: idsPermitidos } } : {}) },
      },
      include: { cliente: { select: { nome: true, cor: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // verbaInvestida/valorRetorno vêm do Prisma como Decimal, não como number de
  // verdade pro TypeScript (mesma natureza do ajuste em lib/prisma.ts) — convertido
  // aqui, na saída da query, igual todo outro valor de dinheiro deste arquivo.
  const resultadosDoMesConvertidos = resultadosDoMes.map((r) => ({
    ...r,
    verbaInvestida: r.verbaInvestida ? Number(r.verbaInvestida) : null,
    valorRetorno: r.valorRetorno ? Number(r.valorRetorno) : null,
  }));

  const totaisRaw = totalizarResultados(resultadosDoMesConvertidos);

  // Investido de cada campanha ativa NESSE mês (deduplicado), pra ritmo de gasto —
  // mesma regra de agrupamento por mês do restante do módulo de Tráfego Pago.
  const totalizadoresPorCampanha = new Map<string, ReturnType<typeof totalizarResultados>>();
  campanhasAtivas.forEach((c) => {
    const doMes = resultadosDoMesConvertidos.filter((r) => r.campanhaId === c.id);
    totalizadoresPorCampanha.set(c.id, totalizarResultados(doMes));
  });

  const campanhasRitmo: CampanhaRitmo[] = campanhasAtivas.map((c) => {
    const investidoMes = totalizadoresPorCampanha.get(c.id)?.totalInvestido || 0;
    const ritmo = calcularRitmoVerba({ verbaMensal: Number(c.verbaMensal), investidoNoMes: investidoMes, dataInicioCampanha: c.dataInicio });
    return {
      id: c.id,
      nome: c.nome,
      clienteNome: c.cliente.nome,
      clienteCor: c.cliente.cor,
      verbaMensal: Number(c.verbaMensal),
      investidoMes,
      ritmo,
    };
  });

  const idsComResultadoRecente = new Set(resultadosUltimos7Dias.map((r) => r.campanhaId));
  const campanhasSemResultadoRecente = campanhasAtivas.filter((c) => !idsComResultadoRecente.has(c.id)).length;
  const campanhasRitmoBaixo = campanhasRitmo.filter((c) => c.ritmo != null && c.ritmo < 0.5).length;

  const alertas: AlertaTrafego[] = [
    { label: "Campanha(s) sem resultado lançado nos últimos 7 dias", contagem: campanhasSemResultadoRecente, href: "/dashboard/trafego", cor: "#F59E0B" },
    { label: "Campanha(s) bem abaixo do ritmo de verba esperado", contagem: campanhasRitmoBaixo, href: "/dashboard/trafego", cor: "#F59E0B" },
  ].filter((a) => a.contagem > 0);

  const relatorios: RelatorioResumo[] = relatoriosDoMes.map((r) => ({
    id: r.id,
    clienteNome: r.cliente.nome,
    rede: r.rede,
    inicio: r.inicio.toISOString(),
    fim: r.fim.toISOString(),
  }));

  const criativosPedidos: TarefaCriativo[] = criativosPedidosRaw.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    categoria: t.categoria,
    prazo: t.prazo?.toISOString() || null,
    clienteNome: t.cliente?.nome || null,
    clienteCor: t.cliente?.cor || null,
  }));

  return (
    <InicioTrafego
      totais={{
        investido: totaisRaw.totalInvestido,
        resultados: totaisRaw.totalResultados,
        custoPorResultado: totaisRaw.custoPorResultado,
        retorno: totaisRaw.totalRetorno,
      }}
      campanhas={campanhasRitmo}
      alertas={alertas}
      relatorios={relatorios}
      criativosPedidos={criativosPedidos}
    />
  );
}
