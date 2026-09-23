import { exigirPermissao } from "@/lib/permissoes";

export default async function OrcamentosLayout({ children }: { children: React.ReactNode }) {
  await exigirPermissao("verComercial");
  return <>{children}</>;
}
