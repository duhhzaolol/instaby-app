import { exigirPermissao } from "@/lib/permissoes";

// Financeiro virou 1 item só no menu lateral (redesign v144, Parte 1) — a
// navegação entre as abas (Resumo/A receber/A pagar/Fluxo de caixa/DRE/
// Patrimônio) morava numa barra em cima da página (AbasSecao) e, na Parte 3,
// virou o submenu expansível do próprio item "Financeiro" no menu lateral
// (components/layout/Sidebar.tsx). Cada rota continua a mesma de sempre
// (/dashboard/financeiro/dre etc.) — essa layout só garante a permissão.
export default async function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  await exigirPermissao("verFinanceiro");
  return <div>{children}</div>;
}
