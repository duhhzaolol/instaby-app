import { exigirPermissao } from "@/lib/permissoes";
import { AbasSecao } from "@/components/layout/AbasSecao";
import { abasComercial } from "@/lib/abasComercial";

export default async function OrcamentosLayout({ children }: { children: React.ReactNode }) {
  const usuario = await exigirPermissao("verOrcamentos");
  // Comercial virou um item só no menu lateral; as seções dele são abas (redesign fase 1).
  const abas = abasComercial(usuario);
  return (
    <>
      <AbasSecao abas={abas} />
      {children}
    </>
  );
}
