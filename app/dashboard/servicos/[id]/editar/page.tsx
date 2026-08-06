import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditarServicoForm from "./EditarServicoForm";

export default async function EditarServicoPage({ params }: { params: { id: string } }) {
  const servico = await prisma.servico.findUnique({ where: { id: params.id } });
  if (!servico) notFound();

  return (
    <div className="max-w-md">
      <p className="mb-5 text-lg font-medium text-text">Editar serviço</p>
      <EditarServicoForm
        servico={{
          id: servico.id,
          nome: servico.nome,
          descricao: servico.descricao,
          categoria: servico.categoria,
          unidade: servico.unidade || "",
          valorUnitario: Number(servico.valorUnitario),
        }}
      />
    </div>
  );
}
