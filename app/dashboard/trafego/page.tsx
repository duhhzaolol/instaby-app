import Link from "next/link";
import { CheckSquare, Megaphone, ListChecks } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import TrafegoClient from "@/components/dashboard/TrafegoClient";
import { TarefaRow } from "@/components/dashboard/TarefaRow";
import { NovaTarefaGlobalForm } from "@/components/dashboard/NovaTarefaGlobalForm";
import { getUsuarioAtual, clienteIdsPermitidos } from "@/lib/permissoes";

const VISOES = [
  { valor: "campanhas", label: "Campanhas", icone: Megaphone },
  { valor: "rotina", label: "Rotina", icone: ListChecks },
];

const ABAS_ROTINA = [
  { valor: "abertas", label: "Abertas" },
  { valor: "feito", label: "Concluídas" },
  { valor: "todas", label: "Todas" },
];

export default async function TrafegoPage({
  searchParams,
}: {
  searchParams: { visao?: string; status?: string };
}) {
  const visao = searchParams.visao === "rotina" ? "rotina" : "campanhas";
  const filtroStatusRotina = searchParams.status || "abertas";

  const usuarioAtual = await getUsuarioAtual();
  const idsPermitidos = usuarioAtual ? await clienteIdsPermitidos(usuarioAtual) : null;
  const filtroClienteCliente = idsPermitidos ? { id: { in: idsPermitidos } } : {};
  // Tarefa sem cliente (rotina interna de tráfego, sem vínculo) continua visível
  // pra todo mundo — só restringe a que é de um cliente fora da lista permitida.
  const filtroClienteTarefa = idsPermitidos ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] } : {};

  const whereRotina =
    filtroStatusRotina === "feito"
      ? { categoria: "campanha", status: "feito", ...filtroClienteTarefa }
      : filtroStatusRotina === "todas"
      ? { categoria: "campanha", ...filtroClienteTarefa }
      : { categoria: "campanha", status: { not: "feito" }, ...filtroClienteTarefa };

  const [campanhas, clientes, tarefasRotina] = await Promise.all([
    prisma.campanha.findMany({
      where: idsPermitidos ? { clienteId: { in: idsPermitidos } } : undefined,
      include: { cliente: { select: { id: true, nome: true, cor: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cliente.findMany({
      where: filtroClienteCliente,
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
    prisma.tarefa.findMany({
      where: whereRotina,
      include: { cliente: { select: { nome: true, cor: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const dados = campanhas.map((c) => ({
    id: c.id,
    clienteId: c.clienteId,
    clienteNome: c.cliente.nome,
    clienteCor: c.cliente.cor,
    nome: c.nome,
    plataforma: c.plataforma,
    objetivo: c.objetivo,
    verbaMensal: Number(c.verbaMensal),
    status: c.status,
    dataInicio: c.dataInicio.toISOString(),
    dataFim: c.dataFim?.toISOString() || null,
    observacoes: c.observacoes,
  }));

  const verbaAtiva = dados.filter((c) => c.status === "ativa").reduce((s, c) => s + c.verbaMensal, 0);
  const qtdAtivas = dados.filter((c) => c.status === "ativa").length;

  return (
    <div>
      <div className="mb-6">
        <p className="flex items-center gap-1.5 text-lg font-medium text-text">
          Tráfego Pago
          <AjudaContextual
            titulo="Tráfego Pago"
            texto="Organize as campanhas de anúncio de cada cliente — plataforma, objetivo, verba mensal e período — e a rotina de tarefas do gestor de tráfego. A verba não passa pela agência (o cliente manda direto pra plataforma), então isso não mexe em nada do Financeiro — é só controle e organização do seu trabalho de gestão."
            exemplo="Ex.: Meta Ads · Conversão · R$ 1.500/mês · ativa desde 01/09. Na Rotina, tarefas tipo 'Trocar criativo' ou 'Revisar públicos'."
          />
        </p>
        <p className="text-sm text-muted">
          {qtdAtivas} campanha{qtdAtivas === 1 ? "" : "s"} ativa{qtdAtivas === 1 ? "" : "s"}
          {verbaAtiva > 0 && ` · R$ ${verbaAtiva.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} de verba/mês sob gestão`}
        </p>
      </div>

      <div className="mb-5 flex gap-2">
        {VISOES.map((v) => {
          const Icon = v.icone;
          return (
            <Link
              key={v.valor}
              href={`/dashboard/trafego?visao=${v.valor}`}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                visao === v.valor
                  ? "bg-accent text-white"
                  : "border border-border bg-card/60 text-muted hover:text-text"
              }`}
            >
              <Icon size={12} /> {v.label}
            </Link>
          );
        })}
      </div>

      {visao === "campanhas" ? (
        <TrafegoClient campanhas={dados} clientes={clientes} />
      ) : (
        <div>
          <div className="mb-5 flex gap-2">
            {ABAS_ROTINA.map((a) => (
              <Link
                key={a.valor}
                href={`/dashboard/trafego?visao=rotina&status=${a.valor}`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtroStatusRotina === a.valor
                    ? "bg-accent text-white"
                    : "border border-border bg-card/60 text-muted hover:text-text"
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
              {tarefasRotina.map((t, i) => (
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
      )}
    </div>
  );
}
