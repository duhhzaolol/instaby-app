import GastoDebitoRapido from "@/components/dashboard/GastoDebitoRapido";
import { prisma } from "@/lib/prisma";
import { clienteIdsPermitidos, exigirPermissao as exigirPermissaoPage } from "@/lib/permissoes";
import { diaFinanceiro } from "@/lib/datasFinanceiro";

export default async function RegistrarGastoPage() {
  const usuario = await exigirPermissaoPage("gerenciarFinanceiro");
  const permitidos = await clienteIdsPermitidos(usuario);
  const clientes = await prisma.cliente.findMany({
    where: permitidos === null ? {} : { id: { in: permitidos } },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
  return <GastoDebitoRapido clientes={clientes} dataInicial={diaFinanceiro(new Date(), false)} />;
}
