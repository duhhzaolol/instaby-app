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
      </div>
    </div>
  );
}
