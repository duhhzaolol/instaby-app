import { permissoesDe, type Usuario } from "@/lib/permissoes";
import type { Aba } from "@/components/layout/AbasSecao";

// Abas da seção Comercial — cada uma só aparece pra quem tem o acesso
// correspondente (mesmos flags que antes decidiam os itens do menu lateral).
// Usada nos layouts de Oportunidades, Orçamentos, Contratos, Serviços e Pacotes,
// que já buscam o usuário no exigirPermissao — por isso recebe ele pronto.
export function abasComercial(usuario: Usuario): Aba[] {
  const pode = permissoesDe(usuario);
  return [
    { label: "Oportunidades", href: "/dashboard/oportunidades", ok: pode.verOportunidades },
    { label: "Orçamentos", href: "/dashboard/orcamentos", ok: pode.verOrcamentos },
    { label: "Contratos", href: "/dashboard/contratos", ok: pode.verContratos },
    { label: "Serviços", href: "/dashboard/servicos", ok: pode.verCatalogo },
    { label: "Pacotes", href: "/dashboard/pacotes", ok: pode.verCatalogo },
  ]
    .filter((a) => a.ok)
    .map(({ label, href }) => ({ label, href }));
}
