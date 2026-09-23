import { exigirPermissao } from "@/lib/permissoes";

export default async function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  // Cobre /dashboard/financeiro e todas as subpáginas (DRE, Fluxo de Caixa,
  // Contas a Pagar/Receber, Patrimônio) de uma vez só.
  await exigirPermissao("verFinanceiro");
  return <>{children}</>;
}
