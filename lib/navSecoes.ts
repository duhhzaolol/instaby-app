// Listas de abas de Financeiro e Comercial — usadas tanto pelo menu lateral
// (pra calcular o link padrão de cada item, já que os dois viraram "1 item só
// com abas por dentro" no redesign v144) quanto pelo componente de abas em si
// (components/layout/AbasSecao.tsx), pra não duplicar a lista em dois lugares.
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

// Primeiro link que essa pessoa realmente pode abrir — usado pelo item único
// "Comercial" do menu lateral (evita mandar pra uma tela que ela não tem
// permissão de ver e cair num redirect).
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
