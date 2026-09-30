import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SolicitacaoInterativa } from "./SolicitacaoInterativa";

// Página pública do formulário de solicitação do cliente (Etapa 3 v157) — mesmo
// padrão de app/revisao/[tarefaId]/page.tsx e app/relatorio/[id]/page.tsx: link
// direto (UUID do próprio cliente), sem login, porque não existe conta de
// cliente nesse sistema (Etapa 5 é quem resolve isso de vez). Busca os contatos
// aqui (server component) só com nome/id — nada sensível (financeiro, contratos)
// chega no navegador do cliente.
export default async function SolicitarPublicoPage({ params }: { params: { clienteId: string } }) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: params.clienteId },
    select: {
      id: true,
      nome: true,
      cor: true,
      logoUrl: true,
      contatos: { select: { id: true, nome: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!cliente) notFound();

  return (
    <div className="min-h-screen bg-base">
      <div className="border-b border-border px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
        </div>
      </div>

      <div className="border-b border-border bg-gradient-to-br from-base via-card/40 to-base px-4 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="inline-block h-[1.5px] w-5 bg-accent" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-accent">nova solicitação</span>
            <span className="inline-block h-[1.5px] w-5 bg-accent" />
          </div>
          <p className="text-2xl font-medium leading-tight text-text sm:text-3xl">O que você precisa?</p>
          <p className="mt-1 flex items-center justify-center gap-2 text-sm text-muted">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cliente.cor || "#9CA3AF" }} />
            {cliente.nome}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <SolicitacaoInterativa clienteId={cliente.id} contatos={cliente.contatos} />
      </div>

      <div className="flex items-center justify-center gap-1.5 pb-8 pt-2 text-[10px] text-muted">
        <ShieldCheck size={11} /> Formulário de solicitação — Instaby Agência
      </div>
    </div>
  );
}
