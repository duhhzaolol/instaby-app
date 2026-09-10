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
import { TarefaRow } from "@/components/dashboard/TarefaRow";
import { OrcamentoRow } from "@/components/dashboard/OrcamentoRow";
import { Clock } from "lucide-react";

export default async function ClienteDetalhePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { aba?: string };
}) {
  const [cliente, catalogo] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        tarefas: { orderBy: { createdAt: "desc" } },
        orcamentos: { include: { itens: true }, orderBy: { createdAt: "desc" } },
        contratos: { orderBy: { createdAt: "desc" } },
        cobrancas: { orderBy: { createdAt: "desc" } },
        despesas: { orderBy: { data: "desc" } },
        servicosContratados: { where: { ativo: true }, include: { servico: true }, orderBy: { createdAt: "asc" } },
        registrosTempo: { orderBy: { inicio: "desc" }, take: 60 },
        relatorios: { orderBy: { fim: "desc" } },
        conteudos: { orderBy: { createdAt: "desc" } },
        contatos: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.servico.findMany({ orderBy: [{ categoria: "asc" }, { nome: "asc" }] }),
  ]);

  if (!cliente) notFound();

  const aba = searchParams.aba || "visao_geral";
  const abas = [
    { valor: "visao_geral", label: "Visão Geral" },
    { valor: "contatos", label: "Contatos" },
    { valor: "tarefas", label: "Tarefas" },
    { valor: "servicos", label: "Serviços" },
    { valor: "escopo", label: "Escopo" },
    { valor: "relatorios", label: "Relatórios" },
    { valor: "financeiro", label: "Financeiro" },
    { valor: "orcamentos", label: "Orçamentos" },
    { valor: "contratos", label: "Contratos" },
    { valor: "horas", label: "Horas" },
  ];

  const orcamentosAceitos = cliente.orcamentos.filter((o) => o.status === "aceito");
  const totalServicos = cliente.servicosContratados.reduce((soma, sc) => soma + Number(sc.valor), 0);

  const hojeEscopo = new Date();
  const inicioMesEscopo = new Date(hojeEscopo.getFullYear(), hojeEscopo.getMonth(), 1);
  const fimMesEscopo = new Date(hojeEscopo.getFullYear(), hojeEscopo.getMonth() + 1, 0, 23, 59, 59);

  const conteudosDoMes = await prisma.conteudo.findMany({
    where: {
      clienteId: cliente.id,
      formato: { not: null },
      OR: [
        { dataPublicacao: { gte: inicioMesEscopo, lte: fimMesEscopo } },
        { dataPublicacao: null, dataCaptacao: { gte: inicioMesEscopo, lte: fimMesEscopo } },
      ],
    },
    select: { formato: true, status: true },
  });

  const escopo = cliente.servicosContratados
    .filter((sc) => sc.servico.formatoConteudo)
    .map((sc) => {
      const doFormato = conteudosDoMes.filter((c) => c.formato === sc.servico.formatoConteudo);
      const entregue = doFormato.filter((c) => c.status === "publicado").length;
      const planejado = doFormato.filter((c) => c.status !== "publicado" && c.status !== "ideia").length;
      return {
        nome: sc.servico.nome,
        contratado: sc.quantidade,
        entregue,
        planejado,
        faltando: Math.max(0, sc.quantidade - entregue - planejado),
      };
    });
  const mensalidade = Math.max(0, totalServicos - Number(cliente.descontoMensal) + Number(cliente.acrescimoMensal));

  const proximaCobranca = cliente.cobrancas
    .filter((c) => (c.status === "pendente" || c.status === "atrasado") && c.vencimento)
    .sort((a, b) => a.vencimento!.getTime() - b.vencimento!.getTime())[0];

  const contratoVigente = cliente.contratos.find((c) => c.status === "assinado");

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

  const conteudosPublicadosMes = cliente.conteudos.filter(
    (c) => c.status === "publicado" && c.dataPublicacao && c.dataPublicacao >= inicioMesEscopo && c.dataPublicacao <= fimMesEscopo
  ).length;
  const conteudosPlanejados = cliente.conteudos.filter((c) => c.status !== "publicado" && c.status !== "ideia").length;
  const itensFaltantes = escopo.reduce((s, e) => s + e.faltando, 0);

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
    ...cliente.conteudos
      .filter((c) => c.status === "publicado" && c.dataPublicacao)
      .map((c) => ({ texto: `${c.titulo} — publicado`, data: c.dataPublicacao!, tipo: "conteudo" })),
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
          {mensalidade > 0 && (
            <Link
              href={`/dashboard/clientes/${cliente.id}?aba=servicos`}
              className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-1.5 text-right transition-colors hover:bg-accent/10"
            >
              <p className="text-[10px] text-muted">Mensalidade · editar em Serviços</p>
              <p className="text-sm font-medium text-accent">R$ {mensalidade.toFixed(0)}</p>
            </Link>
          )}
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
          receitaMes={receitaMes}
          despesasMes={despesasMes}
          horasMes={horasMes}
          conteudosPublicadosMes={conteudosPublicadosMes}
          conteudosPlanejados={conteudosPlanejados}
          itensFaltantes={itensFaltantes}
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
          valorRenovacao={cliente.valorRenovacao ? Number(cliente.valorRenovacao) : null}
        />
      )}

      {aba === "escopo" && (
        <div>
          <p className="mb-1 text-sm font-medium text-text">
            Escopo de {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </p>
          <p className="mb-4 text-sm text-muted">
            Contratado x entregue x planejado, calculado a partir dos Serviços Contratados e do Conteúdo — nada digitado à mão.
          </p>
          {escopo.length === 0 ? (
            <p className="text-sm text-muted">
              Nenhum serviço contratado está ligado a um formato de conteúdo ainda. Vá em Serviços →
              editar um serviço → "Formato de conteúdo" pra ligar (ex: liga o serviço "8 Reels/mês" ao formato Reel).
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {escopo.map((e) => (
                <div key={e.nome} className="rounded-xl border border-border bg-card/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-text">{e.nome}</p>
                    <p className="text-xs text-muted">
                      Contratado: <span className="text-text">{e.contratado}</span>
                    </p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-base">
                    <div className="flex h-full">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.min(100, (e.entregue / e.contratado) * 100)}%` }}
                      />
                      <div
                        className="h-full bg-sky-500"
                        style={{ width: `${Math.min(100 - (e.entregue / e.contratado) * 100, (e.planejado / e.contratado) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Entregue: {e.entregue}
                    </span>
                    <span className="flex items-center gap-1 text-sky-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> Planejado: {e.planejado}
                    </span>
                    {e.faltando > 0 && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Faltando: {e.faltando}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
          }))}
          despesas={cliente.despesas.map((d) => ({
            id: d.id,
            descricao: d.descricao,
            valor: Number(d.valor),
            data: d.data.toISOString(),
            categoriaFinanceira: d.categoriaFinanceira,
            categoria: d.categoria,
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
