import { prisma } from "@/lib/prisma";
import DepoimentosForm from "./DepoimentosForm";

export default async function ConfiguracoesPage() {
  const depoimentos = await prisma.depoimento.findMany({
    where: { ativo: true },
    orderBy: { id: "desc" },
  });

  return (
    <div>
      <p className="mb-6 text-lg font-medium text-text">Configurações</p>

      <p className="mb-1 text-sm font-medium text-text">Depoimentos</p>
      <p className="mb-4 text-sm text-muted">
        Aparecem automaticamente em toda página pública de orçamento que você enviar.
      </p>

      <DepoimentosForm
        depoimentos={depoimentos.map((d) => ({ id: d.id, nomeCliente: d.nomeCliente, texto: d.texto }))}
      />
    </div>
  );
}
