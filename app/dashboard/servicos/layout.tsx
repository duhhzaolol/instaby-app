import { exigirPermissao } from "@/lib/permissoes";

export default async function ServicosLayout({ children }: { children: React.ReactNode }) {
  await exigirPermissao("verComercial");
  return <>{children}</>;
}
