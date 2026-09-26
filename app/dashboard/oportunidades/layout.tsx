import { exigirPermissao } from "@/lib/permissoes";

export default async function OportunidadesLayout({ children }: { children: React.ReactNode }) {
  await exigirPermissao("verOportunidades");
  return <>{children}</>;
}
