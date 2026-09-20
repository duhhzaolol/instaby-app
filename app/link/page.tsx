import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LinkPage } from "@/components/landing/LinkPage";

export const metadata: Metadata = {
  title: "Instaby Agência — Links",
  description: "Todos os links da Instaby Agência em um só lugar.",
};

// Mesmo motivo do app/page.tsx: sem isso, essa página fica "congelada" na
// versão do último deploy e edições feitas no painel não aparecem sozinhas.
export const dynamic = "force-dynamic";

export default async function LinkPageRoute() {
  const [config, links] = await Promise.all([
    prisma.configuracao.findUnique({ where: { id: "config" } }),
    prisma.linkBio.findMany({ where: { ativo: true }, orderBy: { ordem: "asc" } }),
  ]);

  return (
    <LinkPage
      links={links.map((l) => ({
        titulo: l.titulo,
        descricao: l.descricao,
        url: l.url,
        imagemUrl: l.imagemUrl,
        destaque: l.destaque,
      }))}
      whatsappAgencia={config?.whatsappAgencia || null}
      introTexto={config?.linkBioIntroTexto || null}
      rodapeTexto={config?.linkBioRodapeTexto || null}
      imagemUrl={config?.linkBioImagemUrl || null}
      tagline={config?.linkBioTagline || null}
      tags={config?.linkBioTags || null}
    />
  );
}
