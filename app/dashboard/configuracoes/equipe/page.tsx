import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigirPermissao } from "@/lib/permissoes";
import EquipeManager from "@/components/dashboard/EquipeManager";

export default async function EquipePage() {
  await exigirPermissao("gerenciarEquipe");

  const [equipeRaw, clientes] = await Promise.all([
    prisma.usuario.findMany({
      orderBy: [{ master: "desc" }, { createdAt: "asc" }],
      include: { clientesPermitidos: { include: { cliente: { select: { id: true, nome: true } } } } },
    }),
    prisma.cliente.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  const equipe = equipeRaw.map(({ senha, ...resto }) => ({
    ...resto,
    createdAt: resto.createdAt.toISOString(),
    bloqueadoAte: resto.bloqueadoAte?.toISOString() || null,
    clienteIds: resto.clientesPermitidos.map((c) => c.clienteId),
  }));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/configuracoes" className="flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Configurações
      </Link>

      <div>
        <p className="text-lg font-medium text-text">Equipe</p>
        <p className="text-sm text-muted">
          Cada pessoa entra com o próprio login. Defina o que cada uma vê e pode fazer — abas, valores em R$ e
          quais clientes. Quem tem acesso total (você) não aparece pra editar aqui.
        </p>
      </div>

      <EquipeManager equipeInicial={equipe} clientes={clientes} />
    </div>
  );
}
