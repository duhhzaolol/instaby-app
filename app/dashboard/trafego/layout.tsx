import { exigirPermissao } from "@/lib/permissoes";

export default async function TrafegoLayout({ children }: { children: React.ReactNode }) {
  await exigirPermissao("gerenciarTrafego");
  return <>{children}</>;
}
