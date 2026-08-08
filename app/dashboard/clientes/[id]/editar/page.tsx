import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditarClienteForm from "./EditarClienteForm";

export default async function EditarClientePage({ params }: { params: { id: string } }) {
  const cliente = await prisma.cliente.findUnique({ where: { id: params.id } });
  if (!cliente) notFound();

  return (
    <div className="max-w-md">
      <p className="mb-5 text-lg font-medium text-text">Editar {cliente.nome}</p>
      <EditarClienteForm
        cliente={{
          id: cliente.id,
          nome: cliente.nome,
          whatsapp: cliente.whatsapp || "",
          cnpj: cliente.cnpj || "",
          contatoNome: cliente.contatoNome || "",
          endereco: cliente.endereco || "",
          logoUrl: cliente.logoUrl || "",
          linkDrive: cliente.linkDrive || "",
          cor: cliente.cor || "",
          status: cliente.status,
        }}
      />
    </div>
  );
}
