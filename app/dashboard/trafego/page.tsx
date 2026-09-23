import { prisma } from "@/lib/prisma";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import TrafegoClient from "@/components/dashboard/TrafegoClient";
import { getUsuarioAtual, clienteIdsPermitidos } from "@/lib/permissoes";

export default async function TrafegoPage() {
  const usuarioAtual = await getUsuarioAtual();
  const idsPermitidos = usuarioAtual ? await clienteIdsPermitidos(usuarioAtual) : null;
  const filtroCliente = idsPermitidos ? { id: { in: idsPermitidos } } : {};

  const [campanhas, clientes] = await Promise.all([
    prisma.campanha.findMany({
      where: idsPermitidos ? { clienteId: { in: idsPermitidos } } : undefined,
      include: { cliente: { select: { id: true, nome: true, cor: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cliente.findMany({
      where: filtroCliente,
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
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
            texto="Organize as campanhas de anúncio de cada cliente — plataforma, objetivo, verba mensal e período. A verba não passa pela agência (o cliente manda direto pra plataforma), então isso não mexe em nada do Financeiro — é só controle e organização do seu trabalho de gestão."
            exemplo="Ex.: Meta Ads · Conversão · R$ 1.500/mês · ativa desde 01/09."
          />
        </p>
        <p className="text-sm text-muted">
          {qtdAtivas} campanha{qtdAtivas === 1 ? "" : "s"} ativa{qtdAtivas === 1 ? "" : "s"}
          {verbaAtiva > 0 && ` · R$ ${verbaAtiva.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} de verba/mês sob gestão`}
        </p>
      </div>

      <TrafegoClient campanhas={dados} clientes={clientes} />
    </div>
  );
}
