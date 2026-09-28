import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { garantirRecorrentesDoMes } from "@/lib/garantirRecorrentes";
import { getUsuarioAtual, permissoesDe, clienteIdsPermitidos } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { manrope, jetbrainsMono } from "@/lib/fonts";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Garante despesas e mensalidades recorrentes do mês antes de renderizar
  // qualquer página do painel (evita cobrança/despesa "sumida" dependendo
  // de qual página é aberta primeiro).
  await garantirRecorrentesDoMes();

  const session = await getServerSession(authOptions);
  const nome = session?.user?.name || "Duhzao";
  const primeiroNome = nome.split(" ")[0];

  const usuarioAtual = await getUsuarioAtual();
  const cargo = usuarioAtual?.cargo || "Adm Master";
  const pode = usuarioAtual
    ? permissoesDe(usuarioAtual)
    : {
        master: true,
        verFinanceiro: true,
        gerenciarFinanceiro: true,
        verComercial: true,
        verOportunidades: true,
        verOrcamentos: true,
        verContratos: true,
        verCatalogo: true,
        gerenciarTrafego: true,
        gerenciarEquipe: true,
        gerenciarConfiguracoes: true,
        todosClientes: true,
      };

  // Mesmo filtro de cliente-por-permissão já usado em Tarefas/Agenda/Horas —
  // pra ninguém ver, nem em contador do menu nem no seletor do cronômetro/nova
  // tarefa, um cliente que não é dela.
  const idsPermitidos = usuarioAtual ? await clienteIdsPermitidos(usuarioAtual) : null;
  const filtroClienteId = idsPermitidos ? { id: { in: idsPermitidos } } : {};
  const filtroTarefaCliente = idsPermitidos
    ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] }
    : {};

  // Contadores do menu lateral (redesign v144, Parte 1) e lista de clientes
  // usada nos seletores do cronômetro e do "Nova tarefa" da barra do topo.
  const [tarefasAtrasadas, clientesAtivos, cobrancasVencidas, clientesParaMenu] = await Promise.all([
    prisma.tarefa.count({
      where: { status: { not: "feito" }, prazo: { lt: new Date() }, ...filtroTarefaCliente },
    }),
    prisma.cliente.count({ where: { status: "ativo", ...filtroClienteId } }),
    pode.verFinanceiro
      ? prisma.cobranca.count({ where: { status: "atrasado", ...filtroClienteId } })
      : Promise.resolve(0),
    prisma.cliente.findMany({
      where: { status: { not: "inativo" }, ...filtroClienteId },
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className={`tema-painel ${manrope.variable} ${jetbrainsMono.variable} min-h-screen bg-base`}>
      <Sidebar
        nome={nome}
        cargo={cargo}
        pode={pode}
        contadores={{ tarefasAtrasadas, clientesAtivos, cobrancasVencidas }}
      />
      <div className="md:pl-[248px] print:pl-0">
        <Header nomePrimeiro={primeiroNome} clientes={clientesParaMenu} />
        <main className="px-6 py-8 print:px-0 print:py-0">{children}</main>
        <footer className="mt-12 border-t border-border px-6 py-8 text-center text-xs text-muted/60 print:hidden">
          <img src="/logo.png" alt="Instaby" className="mx-auto mb-2 h-4 w-auto opacity-40 grayscale" />
          Instaby App · painel interno da agência
        </footer>
      </div>
    </div>
  );
}
