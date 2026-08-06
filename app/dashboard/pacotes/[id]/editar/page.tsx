import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import NovoPacoteForm from "../../novo/NovoPacoteForm";

export default async function EditarPacotePage({ params }: { params: { id: string } }) {
  const [pacote, servicos] = await Promise.all([
    prisma.pacote.findUnique({ where: { id: params.id }, include: { itens: true } }),
    prisma.servico.findMany({ orderBy: [{ categoria: "asc" }, { nome: "asc" }] }),
  ]);

  if (!pacote) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/pacotes" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Pacotes
      </Link>

      <p className="mb-1 text-lg font-medium text-text">Editar pacote</p>
      <p className="mb-5 text-sm text-muted">Ajuste os serviços que compõem esse pacote</p>

      <NovoPacoteForm
        servicos={servicos.map((s) => ({ ...s, valorUnitario: Number(s.valorUnitario) }))}
        pacoteExistente={{
          id: pacote.id,
          nome: pacote.nome,
          descricao: pacote.descricao || "",
          itens: pacote.itens.map((i) => ({ servicoId: i.servicoId, quantidade: i.quantidade })),
        }}
      />
    </div>
  );
}
