// Listas de abas de Financeiro e Comercial — no redesign v144 (Parte 1) os
// dois viraram "1 item só com abas por dentro", com a navegação entre abas
// numa barra em cima da página (components/layout/AbasSecao.tsx); na Parte 3
// essa barra saiu e virou o submenu expansível do próprio item no menu
// lateral (components/layout/Sidebar.tsx), que agora é quem usa essas
// listas — mantidas aqui, sem duplicar, porque as rotas de cada aba
// continuam as mesmas de sempre.
import type { ElementType } from "react";
import { Trophy, FileText, FileSignature, Package, Package2 } from "lucide-react";
import type { Permissoes } from "@/components/layout/Sidebar";

export const ABAS_FINANCEIRO: { label: string; href: string }[] = [
  { label: "Resumo", href: "/dashboard/financeiro" },
  { label: "A receber", href: "/dashboard/financeiro/contas-a-receber" },
  { label: "A pagar", href: "/dashboard/financeiro/contas-a-pagar" },
  { label: "Fluxo de caixa", href: "/dashboard/financeiro/fluxo-de-caixa" },
  { label: "DRE", href: "/dashboard/financeiro/dre" },
  { label: "Patrimônio", href: "/dashboard/financeiro/patrimonio" },
];

// Ordem pedida por ele no documento do redesign (Oportunidades, Orçamentos,
// Contratos, Serviços, Pacotes) — diferente da ordem antiga do menu lateral.
export const ABAS_COMERCIAL: { label: string; href: string; icon: ElementType; flag: keyof Permissoes }[] = [
  { label: "Oportunidades", href: "/dashboard/oportunidades", icon: Trophy, flag: "verOportunidades" },
  { label: "Orçamentos", href: "/dashboard/orcamentos", icon: FileText, flag: "verOrcamentos" },
  { label: "Contratos", href: "/dashboard/contratos", icon: FileSignature, flag: "verContratos" },
  { label: "Catálogo de serviços", href: "/dashboard/servicos", icon: Package, flag: "verCatalogo" },
  { label: "Pacotes", href: "/dashboard/pacotes", icon: Package2, flag: "verCatalogo" },
];

// Primeiro link que essa pessoa realmente pode abrir dentro de Comercial. Sem
// uso desde que o item "Comercial" do menu lateral virou um grupo expansível
// (Parte 3) — cada sub-item já é o link de verdade, não precisa mais de um
// link padrão pro item pai. Mantida aqui (não usada em lugar nenhum) por via
// das dúvidas — não faz mal nenhum ficar parada.
export function primeiroLinkComercial(pode: Permissoes): string | null {
  const visivel = ABAS_COMERCIAL.find((a) => pode[a.flag]);
  return visivel ? visivel.href : null;
}

// Só as abas que essa pessoa específica pode abrir — cada uma continua tendo
// seu próprio flag (igual já era no menu antigo), então quem só tem
// verOportunidades, por exemplo, nem vê as outras 4 na barra.
export function abasComercialVisiveis(pode: Permissoes) {
  return ABAS_COMERCIAL.filter((a) => pode[a.flag]).map((a) => ({ label: a.label, href: a.href }));
}
