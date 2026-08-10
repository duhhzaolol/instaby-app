import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const nome = session?.user?.name || "Duhzao";
  const email = session?.user?.email || "";
  const primeiroNome = nome.split(" ")[0];

  return (
    <div className="min-h-screen bg-base">
      <Sidebar nome={nome} email={email} />
      <div className="md:pl-[280px]">
        <Header nomePrimeiro={primeiroNome} />
        <main className="px-6 py-8">{children}</main>
        <footer className="mt-12 border-t border-border px-6 py-8 text-center text-xs text-muted/60">
          <img src="/logo.png" alt="Instaby" className="mx-auto mb-2 h-4 w-auto opacity-40 grayscale" />
          Instaby App · painel interno da agência
        </footer>
      </div>
    </div>
  );
}
