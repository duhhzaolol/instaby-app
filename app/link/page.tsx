import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LinkPage } from "@/components/landing/LinkPage";

export const metadata: Metadata = {
  title: "Instaby Agência — Links",
  description: "Todos os links da Instaby Agência em um só lugar.",
};

export default async function LinkPageRoute() {
  const [config, links] = await Promise.all([
    prisma.configuracao.findUnique({ where: { id: "config" } }),
    prisma.linkBio.findMany({ where: { ativo: true }, orderBy: { ordem: "asc" } }),
  ]);

  return (
    <LinkPage
      links={links.map((l) => ({ titulo: l.titulo, url: l.url, imagemUrl: l.imagemUrl }))}
      whatsappAgencia={config?.whatsappAgencia || null}
      introTexto={config?.linkBioIntroTexto || null}
      rodapeTexto={config?.linkBioRodapeTexto || null}
    />
  );
}
