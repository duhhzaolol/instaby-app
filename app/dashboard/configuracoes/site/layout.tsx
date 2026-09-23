import { exigirPermissao } from "@/lib/permissoes";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  await exigirPermissao("gerenciarConfiguracoes");
  return <>{children}</>;
}
