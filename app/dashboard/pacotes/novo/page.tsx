import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import NovoPacoteForm from "./NovoPacoteForm";

export default async function NovoPacotePage() {
  const servicos = await prisma.servico.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/pacotes" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Pacotes
      </Link>

      <p className="mb-1 text-lg font-medium text-text">Novo pacote</p>
      <p className="mb-5 text-sm text-muted">Combine os serviços que sempre andam juntos</p>

      {servicos.length === 0 ? (
        <p className="text-sm text-muted">
          Cadastre serviços no catálogo primeiro pra poder combiná-los num pacote.
        </p>
      ) : (
        <NovoPacoteForm servicos={servicos.map((s) => ({ ...s, valorUnitario: Number(s.valorUnitario) }))} />
      )}
    </div>
  );
}
