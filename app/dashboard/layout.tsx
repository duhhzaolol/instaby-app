import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { garantirRecorrentesDoMes } from "@/lib/garantirRecorrentes";
import { getUsuarioAtual, permissoesDe } from "@/lib/permissoes";

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
  const email = session?.user?.email || "";
  const primeiroNome = nome.split(" ")[0];

  const usuarioAtual = await getUsuarioAtual();
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

  return (
    <div className="min-h-screen bg-base">
      <Sidebar nome={nome} email={email} pode={pode} />
      <div className="md:pl-[280px] print:pl-0">
        <Header nomePrimeiro={primeiroNome} />
        <main className="px-6 py-8 print:px-0 print:py-0">{children}</main>
        <footer className="mt-12 border-t border-border px-6 py-8 text-center text-xs text-muted/60 print:hidden">
          <img src="/logo.png" alt="Instaby" className="mx-auto mb-2 h-4 w-auto opacity-40 grayscale" />
          Instaby App · painel interno da agência
        </footer>
      </div>
    </div>
  );
}
