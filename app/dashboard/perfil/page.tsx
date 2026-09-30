import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import { PerfilForm } from "./PerfilForm";

// Configurações pessoais — de propósito FORA de app/dashboard/configuracoes/
// (cujo layout só deixa entrar quem tem gerenciarConfiguracoes ou gerenciarEquipe).
// Aqui o gate é só "está logado" — qualquer pessoa da equipe, editor/tráfego
// incluso, edita o próprio nome/foto/e-mail/senha/links (redesign v144, Parte 3).
export default async function PerfilPage() {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");

  const links = await prisma.linkUsuario.findMany({
    where: { usuarioId: usuario.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <p className="flex items-center gap-1.5 text-lg font-medium text-text">
          Configurações pessoais
          <AjudaContextual
            titulo="Configurações pessoais"
            texto="Sua conta — nome, foto, e-mail, senha e links de contato. Diferente de Configurações da agência (que é só pra quem administra a equipe), isso aqui é sempre sobre você."
            exemplo="Ex.: troque a senha por aqui sempre que precisar, sem precisar pedir pra ninguém."
          />
        </p>
        <p className="text-sm text-muted">Sua conta — visível só pra você</p>
      </div>

      <div className="max-w-xl">
        <PerfilForm
          usuarioId={usuario.id}
          nomeInicial={usuario.nome}
          emailInicial={usuario.email}
          fotoUrlInicial={usuario.fotoUrl}
          cargaHorariaSemanalInicial={usuario.cargaHorariaSemanal}
          linksIniciais={links.map((l) => ({ id: l.id, tipo: l.tipo, label: l.label, url: l.url }))}
        />
      </div>
    </div>
  );
}
