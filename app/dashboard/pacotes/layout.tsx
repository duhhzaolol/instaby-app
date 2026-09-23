import { exigirPermissao } from "@/lib/permissoes";

export default async function PacotesLayout({ children }: { children: React.ReactNode }) {
  await exigirPermissao("verComercial");
  return <>{children}</>;
}
