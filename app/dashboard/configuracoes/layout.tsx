import { getUsuarioAtual, permissoesDe } from "@/lib/permissoes";
import { redirect } from "next/navigation";

export default async function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  const pode = permissoesDe(usuario);
  // Entra quem administra configurações OU só a equipe (pra chegar em Equipe) —
  // o que cada um enxerga dentro da página é filtrado à parte.
  if (!pode.gerenciarConfiguracoes && !pode.gerenciarEquipe) redirect("/dashboard");
  return <>{children}</>;
}
