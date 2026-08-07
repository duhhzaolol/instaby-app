import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Plus, Pencil, Building2, MapPin, User, FolderOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import NovaTarefaForm from "./NovaTarefaForm";
import ContratosTab from "./ContratosTab";
import FinanceiroTab from "./FinanceiroTab";
import ServicosContratadosTab from "./ServicosContratadosTab";
import { TarefaRow } from "@/components/dashboard/TarefaRow";
import { OrcamentoRow } from "@/components/dashboard/OrcamentoRow";
import { RegistroTempoRow } from "@/components/dashboard/RegistroTempoRow";
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
      },
    }),
    prisma.servico.findMany({ orderBy: [{ categoria: "asc" }, { nome: "asc" }] }),
  ]);

  if (!cliente) notFound();

  const aba = searchParams.aba || "tarefas";
  const abas = [
    { valor: "tarefas", label: "Tarefas" },
    { valor: "servicos", label: "Serviços" },
    { valor: "financeiro", label: "Financeiro" },
    { valor: "orcamentos", label: "Orçamentos" },
    { valor: "contratos", label: "Contratos" },
    { valor: "horas", label: "Horas" },
  ];

  const orcamentosAceitos = cliente.orcamentos.filter((o) => o.status === "aceito");
  const mensalidade = cliente.servicosContratados.reduce((soma, sc) => soma + Number(sc.valor), 0);

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
            <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-1.5 text-right">
              <p className="text-[10px] text-muted">Mensalidade</p>
              <p className="text-sm font-medium text-accent">R$ {mensalidade.toFixed(0)}</p>
            </div>
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

      {aba === "tarefas" && (
        <div>
          <div className="flex flex-col gap-2">
            {cliente.tarefas.length === 0 && (
              <p className="text-sm text-muted">Nenhuma tarefa ainda.</p>
            )}
            {cliente.tarefas.map((t, i) => (
              <TarefaRow key={t.id} index={i} tarefa={{ id: t.id, titulo: t.titulo, tipo: t.tipo, status: t.status }} />
            ))}
          </div>
          <NovaTarefaForm clienteId={cliente.id} />
        </div>
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
          }))}
          despesas={cliente.despesas.map((d) => ({
            id: d.id,
            descricao: d.descricao,
            valor: Number(d.valor),
            data: d.data.toISOString(),
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
              return <OrcamentoRow key={o.id} slug={o.slug} status={o.status} total={total} index={i} />;
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
          <div className="flex flex-col gap-2">
            {cliente.registrosTempo.length === 0 && (
              <p className="text-sm text-muted">Nenhum registro ainda.</p>
            )}
            {cliente.registrosTempo.map((r, i) => (
              <RegistroTempoRow
                key={r.id}
                index={i}
                registro={{
                  id: r.id,
                  atividade: r.atividade,
                  inicio: r.inicio.toISOString(),
                  fim: r.fim?.toISOString() || null,
                }}
              />
            ))}
          </div>
          <Link
            href="/dashboard/horas"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 py-2.5 text-sm text-text transition-colors hover:bg-hover"
          >
            <Clock size={14} /> Registrar horas
          </Link>
        </div>
      )}
    </div>
  );
}
