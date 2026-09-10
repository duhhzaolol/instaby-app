import Link from "next/link";
import { Camera } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { STATUS_CONTEUDO } from "@/lib/conteudoVisual";
import { PipelineConteudo, ConteudoResumo } from "@/components/dashboard/PipelineConteudo";
import { NovoConteudoForm } from "@/components/dashboard/NovoConteudoForm";

export default async function ConteudoPage({
  searchParams,
}: {
  searchParams: { cliente?: string };
}) {
  const clienteFiltro = searchParams.cliente || "";

  const [conteudos, clientes] = await Promise.all([
    prisma.conteudo.findMany({
      where: clienteFiltro ? { clienteId: clienteFiltro } : undefined,
      include: { cliente: { select: { nome: true, cor: true } }, tarefas: { select: { status: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cliente.findMany({
      where: { status: { not: "inativo" } },
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const resumos: ConteudoResumo[] = conteudos.map((c) => ({
    id: c.id,
    titulo: c.titulo,
    formato: c.formato,
    status: c.status,
    clienteNome: c.cliente?.nome || null,
    clienteCor: c.cliente?.cor || null,
    dataPublicacao: c.dataPublicacao?.toISOString() || null,
    tarefasAbertas: c.tarefas.filter((t) => t.status !== "feito").length,
    tarefasTotal: c.tarefas.length,
  }));

  const colunas = STATUS_CONTEUDO.map((s) => ({
    status: s.valor,
    label: s.label,
    cor: s.cor,
    itens: resumos.filter((r) => r.status === s.valor),
  }));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-lg font-medium text-text">Conteúdo</p>
        <Link
          href="/dashboard/conteudo/captacoes"
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm text-text hover:bg-hover"
        >
          <Camera size={14} /> Captações
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Cada peça de conteúdo, do briefing até publicado — as tarefas de produção continuam na aba Tarefas, vinculadas aqui.
      </p>

      <div className="mb-5 flex flex-wrap gap-1.5">
        <Link
          href="/dashboard/conteudo"
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            !clienteFiltro ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
          }`}
        >
          Todos os clientes
        </Link>
        {clientes.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/conteudo?cliente=${c.id}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              clienteFiltro === c.id ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
            }`}
          >
            {c.nome}
          </Link>
        ))}
      </div>

      <NovoConteudoForm clientes={clientes} />

      {resumos.length === 0 ? (
        <p className="text-sm text-muted">Nenhum conteúdo cadastrado ainda.</p>
      ) : (
        <PipelineConteudo colunas={colunas} />
      )}
    </div>
  );
}
