import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, UserCheck, Wallet, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ToggleOcultarValores } from "@/components/ui/ToggleOcultarValores";
import { ValorOcultavelTexto } from "@/components/ui/ValorOcultavelTexto";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { ClienteCard, ClienteCardData } from "@/components/dashboard/ClienteCard";
import { ClientesAgrupados } from "@/components/dashboard/ClientesAgrupados";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import { getUsuarioAtual, clienteIdsPermitidos, permissoesDe } from "@/lib/permissoes";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const filtro = searchParams.status || "todos";

  // Sem isso, um cookie de sessão ainda válido de alguém desativado caía aqui com
  // usuarioAtual=null, e idsPermitidos virava null (o mesmo valor que master/
  // todosClientes usa pra "vê todos os clientes") — mostraria a lista inteira, sem
  // filtro nenhum (auditoria v147, mesma proteção do layout raiz e da Agenda).
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) redirect("/login");

  const idsPermitidos = await clienteIdsPermitidos(usuarioAtual);
  // Quem não tem verFinanceiro (ex: Editor) não pode ver R$ em lugar nenhum — nem
  // aqui na listagem. Zera na origem (não só esconde no visual) pra nunca mandar o
  // valor pro navegador de quem não pode ver.
  const verFinanceiro = permissoesDe(usuarioAtual).verFinanceiro;

  const clientes = await prisma.cliente.findMany({
    where: {
      ...(filtro !== "todos" ? { status: filtro } : {}),
      ...(idsPermitidos ? { id: { in: idsPermitidos } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { cobrancas: true, servicosContratados: { where: { ativo: true } } },
  });

  const abas = [
    { valor: "todos", label: "Todos" },
    { valor: "lead", label: "Lead" },
    { valor: "ativo", label: "Ativo" },
    { valor: "avulso", label: "Avulso" },
    { valor: "inativo", label: "Inativo" },
  ];

  const clientesFormatados: ClienteCardData[] = clientes.map((c) => {
    const somaServicos = c.servicosContratados.reduce((soma, sc) => soma + Number(sc.valor), 0);
    const mensalidade = Math.max(0, somaServicos - Number(c.descontoMensal) + Number(c.acrescimoMensal));
    const totalRecebido = c.cobrancas
      .filter((cb) => cb.status === "pago")
      .reduce((soma, cb) => soma + Number(cb.valor), 0);
    return {
      id: c.id,
      nome: c.nome,
      whatsapp: c.whatsapp,
      logoUrl: c.logoUrl,
      cor: c.cor,
      status: c.status,
      mensalidade: verFinanceiro ? mensalidade : 0,
      totalRecebido: verFinanceiro ? totalRecebido : 0,
    };
  });

  const grupos = [
    { chave: "ativo", titulo: "Ativos", clientes: clientesFormatados.filter((c) => c.status === "ativo") },
    { chave: "avulso", titulo: "Avulsos", clientes: clientesFormatados.filter((c) => c.status === "avulso") },
    { chave: "lead", titulo: "Leads", clientes: clientesFormatados.filter((c) => c.status === "lead") },
    { chave: "inativo", titulo: "Inativos", clientes: clientesFormatados.filter((c) => c.status === "inativo") },
  ];

  const contagemPorStatus: Record<string, number> = {};
  for (const c of clientesFormatados) contagemPorStatus[c.status] = (contagemPorStatus[c.status] || 0) + 1;

  const mensalidadeRecorrente = clientesFormatados
    .filter((c) => c.status === "ativo")
    .reduce((soma, c) => soma + c.mensalidade, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-lg font-medium text-text">Clientes</p>
            <p className="text-sm text-muted">{clientes.length} no total</p>
          </div>
          <AjudaContextual
            titulo="Clientes"
            texto="Aqui ficam todos os clientes da agência, organizados por status: Ativos, Avulsos, Leads e Inativos. Clique no título de um grupo para expandir ou recolher."
            exemplo="Ex.: clique em 'Ativos' para ver só quem está com contrato em andamento."
          />
        </div>
        <div className="flex items-center gap-2">
          <ToggleOcultarValores />
          <Link href="/dashboard/clientes/novo">
            <Button size="sm">
              <Plus size={14} /> Novo cliente
            </Button>
          </Link>
        </div>
      </div>

      <div className={`mb-6 grid grid-cols-1 gap-2 ${verFinanceiro ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <StatTile
          icone={<UserCheck size={12} style={{ color: "#22C55E" }} />}
          label="Ativos"
          valor={contagemPorStatus.ativo || 0}
          index={0}
        />
        {verFinanceiro && (
          <StatTile
            icone={<Wallet size={12} style={{ color: "#E63946" }} />}
            label="Mensalidade recorrente"
            valor={<ValorOcultavelTexto>R$ {mensalidadeRecorrente.toLocaleString("pt-BR")}</ValorOcultavelTexto>}
            index={1}
          />
        )}
        <StatTile
          icone={<UserPlus size={12} style={{ color: "#F59E0B" }} />}
          label="Leads em aberto"
          valor={contagemPorStatus.lead || 0}
          index={2}
        />
      </div>

      <div className="mb-6 flex gap-2">
        {abas.map((a) => (
          <Link
            key={a.valor}
            href={`/dashboard/clientes?status=${a.valor}`}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filtro === a.valor
                ? "bg-accent text-white"
                : "border border-border bg-card/60 text-muted hover:text-text"
            }`}
          >
            {a.label}
            {a.valor !== "todos" && contagemPorStatus[a.valor] ? ` (${contagemPorStatus[a.valor]})` : ""}
          </Link>
        ))}
      </div>

      {clientes.length === 0 && (
        <p className="text-sm text-muted">Nenhum cliente por aqui ainda.</p>
      )}

      {filtro === "todos" ? (
        <ClientesAgrupados grupos={grupos} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clientesFormatados.map((c, i) => (
            <ClienteCard key={c.id} cliente={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
