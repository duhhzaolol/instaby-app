import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Instaby Agência — Marketing digital com resultado",
  description: "Social media, tráfego pago, produção de vídeo e presença digital para negócios que querem crescer com consistência.",
};

// Sem isso, a Vercel gera essa página como estática (uma "foto" tirada no
// deploy) e ela nunca muda sozinha quando você edita algo em Configurações →
// Site & Link na bio — só mudaria no próximo deploy. Com isso, ela busca os
// dados de novo a cada visita, então uma edição salva no painel aparece na
// hora, sem precisar de novo deploy.
export const dynamic = "force-dynamic";

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
      heroImagemUrlMobile={config?.siteHeroImagemUrlMobile || null}
      heroFoco={config?.siteHeroFoco || null}
      sobreTexto={config?.siteSobreTexto || null}
      sobreImagemUrl={config?.siteSobreImagemUrl || null}
      sobreImagemUrlMobile={config?.siteSobreImagemUrlMobile || null}
      sobreFoco={config?.siteSobreFoco || null}
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
