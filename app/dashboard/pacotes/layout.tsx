import { exigirPermissao, permissoesDe } from "@/lib/permissoes";
import { AbasSecao } from "@/components/layout/AbasSecao";
import { abasComercialVisiveis } from "@/lib/navSecoes";

// Comercial virou 1 item só no menu lateral, com abas por dentro (redesign
// v144, Parte 1) — cada uma dessas 5 telas continua no mesmo endereço de
// sempre, só ganhou essa barra em cima ligando as outras 4.
export default async function PacotesLayout({ children }: { children: React.ReactNode }) {
  const usuario = await exigirPermissao("verCatalogo");
  return (
    <div>
      <AbasSecao abas={abasComercialVisiveis(permissoesDe(usuario))} />
      {children}
    </div>
  );
}
