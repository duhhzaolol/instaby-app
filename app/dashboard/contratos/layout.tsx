import { exigirPermissao } from "@/lib/permissoes";

export default async function ContratosLayout({ children }: { children: React.ReactNode }) {
  await exigirPermissao("verContratos");
  return <>{children}</>;
}
