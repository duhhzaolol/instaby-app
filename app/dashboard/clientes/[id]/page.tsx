import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Plus, Pencil, Building2, MapPin, User, FolderOpen, CalendarClock, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import NovaTarefaForm from "./NovaTarefaForm";
import ContratosTab from "./ContratosTab";
import FinanceiroTab from "./FinanceiroTab";
import ServicosContratadosTab from "./ServicosContratadosTab";
import RelatoriosTab from "./RelatoriosTab";
import VisaoGeralClienteTab from "./VisaoGeralClienteTab";
import ContatosTab from "./ContatosTab";
import { MensalidadeChip } from "./MensalidadeChip";
import LinksClienteTab from "./LinksClienteTab";
import OnboardingTab from "./OnboardingTab";
import SolicitacoesTab from "./SolicitacoesTab";
import { TarefaRow } from "@/components/dashboard/TarefaRow";
import { OrcamentoRow } from "@/components/dashboard/OrcamentoRow";
import { Clock } from "lucide-react";
import { getUsuarioAtual, permissoesDe, podeVerCliente } from "@/lib/permissoes";
import { redirect } from "next/navigation";

export default async function ClienteDetalhePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { aba?: string };
}) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) redirect("/login");
  if (!(await podeVerCliente(usuarioAtual, params.id))) notFound();
  const pode = permissoesDe(usuarioAtual);

  const [cliente, catalogo, config] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        tarefas: { orderBy: { createdAt: "desc" } },
        orcamentos: { include: { itens: true }, orderBy: { createdAt: "desc" } },
        contratos: { orderBy: { createdAt: "desc" } },
        cobrancas: { orderBy: { createdAt: "desc" }, include: { pagamentos: true } },
        despesas: { orderBy: { data: "desc" }, include: { pagamentos: true } },
        servicosContratados: { where: { ativo: true }, include: { servico: true }, orderBy: { createdAt: "asc" } },
        registrosTempo: { orderBy: { inicio: "desc" }, take: 60 },
        relatorios: { orderBy: { fim: "desc" } },
        contatos: { orderBy: { createdAt: "asc" } },
        links: { orderBy: { createdAt: "asc" } },
        onboarding: { include: { itens: { orderBy: { ordem: "asc" } } } },
        solicitacoes: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.servico.findMany({ orderBy: [{ categoria: "asc" }, { nome: "asc" }] }),
    prisma.configuracao.findUnique({ where: { id: "config" } }),
  ]);

  if (!cliente) notFound();

  const abasBase = [
    { valor: "visao_geral", label: "Visão Geral" },
    { valor: "contatos", label: "Contatos" },
    { valor: "links", label: "Links" },
    { valor: "onboarding", label: "Onboarding" },
    { valor: "solicitacoes", label: "Solicitações" },
    { valor: "tarefas", label: "Tarefas" },
    { valor: "servicos", label: "Serviços" },
    { valor: "relatorios", label: "Relatórios" },
    { valor: "financeiro", label: "Financeiro" },
    { valor: "orcamentos", label: "Orçamentos" },
    { valor: "contratos", label: "Contratos" },
    { valor: "horas", label: "Horas" },
  ];
  const abas = abasBase.filter((a) => {
    if (a.valor === "financeiro") return pode.verFinanceiro;
    if (a.valor === "orcamentos" || a.valor === "contratos") return pode.verComercial;
    return true;
  });
  const abaPedida = searchParams.aba || "visao_geral";
  // Se pedirem por URL uma aba que essa pessoa não pode ver, cai pra Visão Geral
  // em vez de renderizar o conteúdo restrito.
  const aba = abas.some((a) => a.valor === abaPedida) ? abaPedida : "visao_geral";

  const orcamentosAceitos = cliente.orcamentos.filter((o) => o.status === "aceito");
  const totalServicos = cliente.servicosContratados.reduce((soma, sc) => soma + Number(sc.valor), 0);

  const mensalidade = Math.max(0, totalServicos - Number(cliente.descontoMensal) + Number(cliente.acrescimoMensal));

  const proximaCobranca = cliente.cobrancas
    .filter((c) => (c.status === "pendente" || c.status === "atrasado") && c.vencimento)
    .sort((a, b) => a.vencimento!.getTime() - b.vencimento!.getTime())[0];

  const contratoVigente = cliente.contratos.find((c) => c.status === "assinado");
  const inicioContrato = cliente.dataInicioContrato || contratoVigente?.createdAt || null;
  let proximaRenovacao: Date | null = null;
  let diasParaRenovar: number | null = null;
  if (inicioContrato && cliente.prazoContratoMeses) {
    proximaRenovacao = new Date(inicioContrato);
    proximaRenovacao.setMonth(proximaRenovacao.getMonth() + cliente.prazoContratoMeses);
    diasParaRenovar = Math.round((proximaRenovacao.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  const hojeEscopo = new Date();
  const inicioMesEscopo = new Date(hojeEscopo.getFullYear(), hojeEscopo.getMonth(), 1);
  const fimMesEscopo = new Date(hojeEscopo.getFullYear(), hojeEscopo.getMonth() + 1, 0, 23, 59, 59);

  const receitaMes = cliente.cobrancas
    .filter((c) => c.status === "pago" && c.createdAt >= inicioMesEscopo && c.createdAt <= fimMesEscopo)
    .reduce((s, c) => s + Number(c.valor), 0);

  const despesasMes = cliente.despesas
    .filter(
      (d) =>
        d.categoriaFinanceira !== "transferencia" &&
        d.status !== "cancelado" &&
        d.data >= inicioMesEscopo &&
        d.data <= fimMesEscopo
    )
    .reduce((s, d) => s + Number(d.valor), 0);

  const horasMes = cliente.registrosTempo
    .filter((r) => r.fim && r.inicio >= inicioMesEscopo && r.inicio <= fimMesEscopo)
    .reduce((s, r) => s + (r.fim!.getTime() - r.inicio.getTime()) / 1000 / 60 / 60, 0);

  const proximaAtividade = cliente.tarefas
    .filter((t) => t.status !== "feito" && t.prazo && t.prazo >= new Date())
    .sort((a, b) => a.prazo!.getTime() - b.prazo!.getTime())[0];

  const ultimoRelatorio = cliente.relatorios[0];

  type EventoTimeline = { texto: string; data: Date; tipo: string };
  const timeline: EventoTimeline[] = [
    ...cliente.cobrancas
      .filter((c) => c.status === "pago")
      .map((c) => ({ texto: `Pagamento recebido — R$ ${Number(c.valor).toFixed(0)}`, data: c.createdAt, tipo: "pagamento" })),
    ...cliente.contratos.filter((c) => c.status === "assinado").map((c) => ({ texto: "Contrato assinado", data: c.createdAt, tipo: "contrato" })),
    ...orcamentosAceitos.map((o) => ({ texto: "Proposta aceita", data: o.createdAt, tipo: "orcamento" })),
  ]
    .sort((a, b) => b.data.getTime() - a.data.getTime())
    .slice(0, 8);

  return (
    <div>
      <Link href="/dashboard/clientes" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Clientes
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-start gap-3">
          {cliente.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cliente.logoUrl} alt={cliente.nome} className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-sm font-semibold text-accent">
              {cliente.nome
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-medium text-text">{cliente.nome}</p>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              {cliente.whatsapp && (
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Phone size={11} /> {cliente.whatsapp}
                </p>
              )}
              {cliente.contatoNome && (
                <p className="flex items-center gap-1 text-xs text-muted">
                  <User size={11} /> {cliente.contatoNome}
                </p>
              )}
              {cliente.cnpj && (
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Building2 size={11} /> {cliente.cnpj}
                </p>
              )}
              {cliente.endereco && (
                <p className="flex items-center gap-1 text-xs text-muted">
                  <MapPin size={11} /> {cliente.endereco}
                </p>
              )}
              {cliente.linkDrive && (
                <a
                  href={cliente.linkDrive}
                  target="_blank"
                  className="flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <FolderOpen size={11} /> Pasta no Drive
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MensalidadeChip clienteId={cliente.id} mensalidade={mensalidade} diasParaRenovar={diasParaRenovar} />
          <Link
            href={`/dashboard/clientes/${cliente.id}/editar`}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs text-text hover:bg-hover"
          >
            <Pencil size={12} /> Editar
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-border">
        {abas.map((a) => (
          <Link
            key={a.valor}
            href={`/dashboard/clientes/${cliente.id}?aba=${a.valor}`}
            className={`px-3 py-2.5 text-sm transition-colors ${
              aba === a.valor
                ? "border-b-2 border-accent font-medium text-text"
                : "text-muted hover:text-text"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>

      {aba === "visao_geral" && (
        <VisaoGeralClienteTab
          mensalidade={mensalidade}
          proximaCobranca={proximaCobranca ? { valor: Number(proximaCobranca.valor), vencimento: proximaCobranca.vencimento?.toISOString() || null } : null}
          contratoVigente={!!contratoVigente}
          proximaRenovacao={proximaRenovacao?.toISOString() || null}
          diasParaRenovar={diasParaRenovar}
          receitaMes={receitaMes}
          despesasMes={despesasMes}
          horasMes={horasMes}
          custoHoraPadrao={config?.custoHoraPadrao ? Number(config.custoHoraPadrao) : 0}
          proximaAtividade={proximaAtividade ? { titulo: proximaAtividade.titulo, prazo: proximaAtividade.prazo?.toISOString() || null } : null}
          situacaoRelatorio={ultimoRelatorio ? new Date(ultimoRelatorio.fim).toLocaleDateString("pt-BR") : null}
          timeline={timeline.map((t) => ({ texto: t.texto, data: t.data.toISOString(), tipo: t.tipo }))}
        />
      )}

      {aba === "contatos" && (
        <ContatosTab
          clienteId={cliente.id}
          contatoAntigo={cliente.contatoNome}
          contatos={cliente.contatos.map((c) => ({
            id: c.id,
            nome: c.nome,
            cargo: c.cargo,
            telefone: c.telefone,
            whatsapp: c.whatsapp,
            email: c.email,
            principal: c.principal,
            financeiro: c.financeiro,
            aprovacaoConteudo: c.aprovacaoConteudo,
            contratos: c.contratos,
          }))}
        />
      )}

      {aba === "links" && (
        <LinksClienteTab
          clienteId={cliente.id}
          linkDriveAntigo={cliente.linkDrive}
          links={cliente.links.map((l) => ({ id: l.id, tipo: l.tipo, label: l.label, url: l.url }))}
        />
      )}

      {aba === "onboarding" && (
        <OnboardingTab
          clienteId={cliente.id}
          onboarding={
            cliente.onboarding
              ? {
                  id: cliente.onboarding.id,
                  dataInicio: cliente.onboarding.dataInicio.toISOString(),
                  status: cliente.onboarding.status,
                  itens: cliente.onboarding.itens.map((i) => ({
                    id: i.id,
                    titulo: i.titulo,
                    responsavel: i.responsavel,
                    status: i.status,
                    observacao: i.observacao,
                    dataConclusao: i.dataConclusao?.toISOString() || null,
                  })),
                }
              : null
          }
        />
      )}

      {aba === "solicitacoes" && (
        <SolicitacoesTab
          clienteId={cliente.id}
          solicitacoes={cliente.solicitacoes.map((s) => ({
            id: s.id,
            descricao: s.descricao,
            prioridade: s.prioridade,
            status: s.status,
            extra: s.extra,
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      )}

      {aba === "tarefas" && (
        <div>
          <Link
            href={`/dashboard/tarefas/calendario?cliente=${cliente.id}`}
            className="mb-3 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 py-2.5 text-sm text-text transition-colors hover:bg-hover"
          >
            <CalendarDays size={14} /> Ver calendário de conteúdo desse cliente
          </Link>
          <div className="flex flex-col gap-2">
            {cliente.tarefas.length === 0 && (
              <p className="text-sm text-muted">Nenhuma tarefa ainda.</p>
            )}
            {cliente.tarefas.map((t, i) => (
              <TarefaRow
                key={t.id}
                index={i}
                tarefa={{
                  id: t.id,
                  titulo: t.titulo,
                  tipo: t.tipo,
                  status: t.status,
                  prazo: t.prazo?.toISOString() || null,
                  categoria: t.categoria,
                  descricao: t.descricao,
                  prioridade: t.prioridade,
                  clienteId: cliente.id,
                }}
              />
            ))}
          </div>
          <NovaTarefaForm clienteId={cliente.id} />
        </div>
      )}

      {aba === "relatorios" && (
        <RelatoriosTab
          clienteId={cliente.id}
          redesGerenciadas={cliente.redesGerenciadas}
          relatorios={cliente.relatorios.map((r) => ({
            id: r.id,
            rede: r.rede,
            inicio: r.inicio.toISOString(),
            fim: r.fim.toISOString(),
            seguidoresInicio: r.seguidoresInicio,
            seguidoresFim: r.seguidoresFim,
            investimento: r.investimento ? Number(r.investimento) : null,
            leads: r.leads,
          }))}
        />
      )}

      {aba === "servicos" && (
        <ServicosContratadosTab
          clienteId={cliente.id}
          contratados={cliente.servicosContratados.map((c) => ({
            id: c.id,
            servicoId: c.servicoId,
            quantidade: c.quantidade,
            valor: Number(c.valor),
            servico: { nome: c.servico.nome, valorUnitario: Number(c.servico.valorUnitario) },
          }))}
          catalogo={catalogo.map((s) => ({
            id: s.id,
            nome: s.nome,
            categoria: s.categoria,
            valorUnitario: Number(s.valorUnitario),
          }))}
          descontoMensal={Number(cliente.descontoMensal)}
          acrescimoMensal={Number(cliente.acrescimoMensal)}
          prazoContratoMeses={cliente.prazoContratoMeses}
          dataInicioContrato={cliente.dataInicioContrato?.toISOString() || null}
          valorRenovacao={cliente.valorRenovacao ? Number(cliente.valorRenovacao) : null}
        />
      )}

      {aba === "financeiro" && (
        <FinanceiroTab
          clienteId={cliente.id}
          cobrancas={cliente.cobrancas.map((c) => ({
            id: c.id,
            valor: Number(c.valor),
            status: c.status,
            tipo: c.tipo,
            vencimento: c.vencimento?.toISOString() || null,
            totalPago: c.pagamentos.reduce((s, p) => s + Number(p.valor), 0),
          }))}
          despesas={cliente.despesas.map((d) => ({
            id: d.id,
            descricao: d.descricao,
            valor: Number(d.valor),
            data: d.data.toISOString(),
            categoriaFinanceira: d.categoriaFinanceira,
            categoria: d.categoria,
            status: d.status,
            vencimento: d.vencimento?.toISOString() || null,
            totalPago: d.pagamentos.reduce((s, p) => s + Number(p.valor), 0),
          }))}
        />
      )}

      {aba === "orcamentos" && (
        <div>
          <div className="flex flex-col gap-2">
            {cliente.orcamentos.length === 0 && (
              <p className="text-sm text-muted">Nenhum orçamento enviado ainda.</p>
            )}
            {cliente.orcamentos.map((o, i) => {
              const total = o.itens.reduce((soma, item) => soma + Number(item.valor), 0);
              return (
                <OrcamentoRow
                  key={o.id}
                  slug={o.slug}
                  status={o.status}
                  total={total}
                  index={i}
                  visualizadoEm={o.visualizadoEm?.toISOString() || null}
                />
              );
            })}
          </div>
          <Link
            href={`/dashboard/clientes/${cliente.id}/orcamentos/novo`}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 py-2.5 text-sm text-text transition-colors hover:bg-hover"
          >
            <Plus size={14} /> Novo orçamento
          </Link>
        </div>
      )}

      {aba === "contratos" && (
        <ContratosTab
          clienteId={cliente.id}
          contratos={cliente.contratos.map((c) => ({
            id: c.id,
            conteudo: c.conteudo,
            status: c.status,
            orcamentoId: c.orcamentoId,
            arquivoUrl: c.arquivoUrl,
          }))}
          orcamentosAceitos={orcamentosAceitos.map((o) => ({ id: o.id, slug: o.slug }))}
          temServicosContratados={cliente.servicosContratados.length > 0}
        />
      )}
      {aba === "horas" && (
        <div>
          {(() => {
            const inicioMes = new Date();
            inicioMes.setDate(1);
            inicioMes.setHours(0, 0, 0, 0);
            const totalMes = cliente.registrosTempo
              .filter((r) => r.fim && r.inicio >= inicioMes)
              .reduce((soma, r) => soma + (r.fim!.getTime() - r.inicio.getTime()) / 1000 / 60 / 60, 0);
            return (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                <span className="text-sm font-medium text-text">Horas trabalhadas este mês</span>
                <span className="text-lg font-medium text-accent">{totalMes.toFixed(1)}h</span>
              </div>
            );
          })()}
          <p className="mb-4 text-sm text-muted">
            Pra ver dia a dia (com calendário e navegação entre meses), abre o calendário completo desse cliente.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/dashboard/horas/${cliente.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              <CalendarClock size={14} /> Ver calendário de horas
            </Link>
            <Link
              href="/dashboard/horas"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 py-2.5 text-sm text-text transition-colors hover:bg-hover"
            >
              <Clock size={14} /> Registrar horas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
