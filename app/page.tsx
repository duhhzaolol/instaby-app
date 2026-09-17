import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Instaby Agência — Marketing digital com resultado",
  description: "Social media, tráfego pago, produção de vídeo e presença digital para negócios que querem crescer com consistência.",
};

export default async function Home() {
  const [logos, depoimentos, config, cases] = await Promise.all([
    prisma.cliente.findMany({
      where: { exibirLogoPublico: true, logoUrl: { not: null } },
      select: { nome: true, logoUrl: true },
    }),
    prisma.depoimento.findMany({ where: { ativo: true }, orderBy: { id: "desc" }, take: 6 }),
    prisma.configuracao.findUnique({ where: { id: "config" } }),
    prisma.caseTrabalho.findMany({ where: { ativo: true }, orderBy: { ordem: "asc" } }),
  ]);

  return (
    <LandingPage
      logos={logos as { nome: string; logoUrl: string }[]}
      depoimentos={depoimentos}
      whatsappAgencia={config?.whatsappAgencia || null}
      heroTitulo={config?.siteHeroTitulo || null}
      heroSubtitulo={config?.siteHeroSubtitulo || null}
      heroImagemUrl={config?.siteHeroImagemUrl || null}
      sobreTexto={config?.siteSobreTexto || null}
      sobreImagemUrl={config?.siteSobreImagemUrl || null}
      rodapeTexto={config?.siteRodapeTexto || null}
      cases={cases.map((c) => ({
        id: c.id,
        nome: c.nome,
        categoria: c.categoria,
        imagemUrl: c.imagemUrl,
        link: c.link,
        destaque: c.destaque,
      }))}
    />
  );
}
