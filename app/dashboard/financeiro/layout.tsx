import { exigirPermissao } from "@/lib/permissoes";
import { AbasSecao } from "@/components/layout/AbasSecao";
import { ABAS_FINANCEIRO } from "@/lib/navSecoes";

// Financeiro virou 1 item só no menu lateral, com abas por dentro (redesign
// v144, Parte 1) — cada aba continua sendo a mesma rota de sempre
// (/dashboard/financeiro/dre etc.), só ganhou essa barra em cima. O conteúdo
// de cada aba em si (o "Resumo" novo, por exemplo) é trabalho da Parte 4.
export default async function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  await exigirPermissao("verFinanceiro");
  return (
    <div>
      <AbasSecao abas={ABAS_FINANCEIRO} />
      {children}
    </div>
  );
}
