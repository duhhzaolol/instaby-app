import { exigirPermissao } from "@/lib/permissoes";
import { AbasSecao } from "@/components/layout/AbasSecao";

// Antes cada subpágina era um item do menu lateral — agora Financeiro é um
// item só e as subpáginas viram abas (redesign fase 1).
const ABAS = [
  { label: "Resumo", href: "/dashboard/financeiro" },
  { label: "A receber", href: "/dashboard/financeiro/contas-a-receber" },
  { label: "A pagar", href: "/dashboard/financeiro/contas-a-pagar" },
  { label: "Fluxo de caixa", href: "/dashboard/financeiro/fluxo-de-caixa" },
  { label: "DRE", href: "/dashboard/financeiro/dre" },
  { label: "Patrimônio", href: "/dashboard/financeiro/patrimonio" },
];

export default async function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  // Cobre /dashboard/financeiro e todas as subpáginas (DRE, Fluxo de Caixa,
  // Contas a Pagar/Receber, Patrimônio) de uma vez só.
  await exigirPermissao("verFinanceiro");
  return (
    <>
      <AbasSecao abas={ABAS} />
      {children}
    </>
  );
}
