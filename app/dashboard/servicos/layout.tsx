import { exigirPermissao } from "@/lib/permissoes";

// Comercial virou 1 item só no menu lateral (redesign v144, Parte 1) — a
// navegação entre as 5 telas morava numa barra em cima da página (AbasSecao)
// e, na Parte 3, virou o submenu expansível do próprio item "Comercial" no
// menu lateral (components/layout/Sidebar.tsx). Cada uma dessas 5 telas
// continua no mesmo endereço de sempre — essa layout só garante a permissão.
export default async function ServicosLayout({ children }: { children: React.ReactNode }) {
  await exigirPermissao("verCatalogo");
  return <div>{children}</div>;
}
