import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { garantirRecorrentesDoMes } from "@/lib/garantirRecorrentes";
import { getUsuarioAtual, permissoesDe, clienteIdsPermitidos } from "@/lib/permissoes";
import { fontesPainel } from "@/lib/fontes";

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
  const usuarioAtual = await getUsuarioAtual();
  const nome = usuarioAtual?.nome || session?.user?.name || "Duhzao";
  const cargo = usuarioAtual?.cargo || "Adm Master";
  const primeiroNome = nome.split(" ")[0];

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

  // Números do menu lateral e clientes do cronômetro (redesign fase 1) — sempre
  // só dos clientes que essa pessoa pode ver. Tarefa sem cliente (interna)
  // conta pra todo mundo, igual na tela de Tarefas.
  const idsPermitidos = usuarioAtual ? await clienteIdsPermitidos(usuarioAtual) : null;
  const filtroTarefa = idsPermitidos ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] } : {};
  const filtroCliente = idsPermitidos ? { id: { in: idsPermitidos } } : {};
  const agora = new Date();

  const [tarefasAtrasadas, cobrancasVencidas, clientesAtivos, clientesCronometro] = await Promise.all([
    prisma.tarefa.count({
      where: { status: { not: "feito" }, prazo: { lt: agora }, ...filtroTarefa },
    }),
    pode.verFinanceiro
      ? prisma.cobranca.count({
          where: { status: { in: ["pendente", "atrasado"] }, vencimento: { lt: agora } },
        })
      : Promise.resolve(0),
    prisma.cliente.count({ where: { status: "ativo", ...filtroCliente } }),
    prisma.cliente.findMany({
      where: { status: { not: "inativo" }, ...filtroCliente },
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className={`tema-painel ${fontesPainel} min-h-screen bg-base text-text`}>
      <Sidebar
        nome={nome}
        cargo={cargo}
        pode={pode}
        contagens={{ tarefasAtrasadas, cobrancasVencidas, clientesAtivos }}
      />
      <div className="md:pl-[248px] print:pl-0">
        <Header nomePrimeiro={primeiroNome} clientes={clientesCronometro} />
        <main className="px-6 py-7 md:px-8 print:px-0 print:py-0">{children}</main>
        <footer className="mt-12 border-t border-border px-6 py-8 text-center text-xs text-muted/60 print:hidden">
          <img src="/logo.png" alt="Instaby" className="mx-auto mb-2 h-4 w-auto opacity-40 grayscale" />
          Instaby App · painel interno da agência
        </footer>
      </div>
    </div>
  );
}
