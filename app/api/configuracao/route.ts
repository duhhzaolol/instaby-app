import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.configuracao.findUnique({ where: { id: "config" } });
  return NextResponse.json(
    config || { id: "config", whatsappAgencia: null, metaFaturamentoMensal: null, custoHoraPadrao: null, templateOnboarding: [] }
  );
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  const config = await prisma.configuracao.upsert({
    where: { id: "config" },
    update: {
      ...(body.whatsappAgencia !== undefined && { whatsappAgencia: body.whatsappAgencia }),
      ...(body.metaFaturamentoMensal !== undefined && { metaFaturamentoMensal: body.metaFaturamentoMensal }),
      ...(body.custoHoraPadrao !== undefined && { custoHoraPadrao: body.custoHoraPadrao }),
      ...(body.templateOnboarding !== undefined && { templateOnboarding: body.templateOnboarding }),
      ...(body.siteHeroTitulo !== undefined && { siteHeroTitulo: body.siteHeroTitulo }),
      ...(body.siteHeroSubtitulo !== undefined && { siteHeroSubtitulo: body.siteHeroSubtitulo }),
      ...(body.siteHeroImagemUrl !== undefined && { siteHeroImagemUrl: body.siteHeroImagemUrl }),
      ...(body.siteHeroImagemUrlMobile !== undefined && { siteHeroImagemUrlMobile: body.siteHeroImagemUrlMobile }),
      ...(body.siteHeroFoco !== undefined && { siteHeroFoco: body.siteHeroFoco }),
      ...(body.siteSobreTexto !== undefined && { siteSobreTexto: body.siteSobreTexto }),
      ...(body.siteSobreImagemUrl !== undefined && { siteSobreImagemUrl: body.siteSobreImagemUrl }),
      ...(body.siteSobreImagemUrlMobile !== undefined && { siteSobreImagemUrlMobile: body.siteSobreImagemUrlMobile }),
      ...(body.siteSobreFoco !== undefined && { siteSobreFoco: body.siteSobreFoco }),
      ...(body.siteRodapeTexto !== undefined && { siteRodapeTexto: body.siteRodapeTexto }),
      ...(body.linkBioIntroTexto !== undefined && { linkBioIntroTexto: body.linkBioIntroTexto }),
      ...(body.linkBioRodapeTexto !== undefined && { linkBioRodapeTexto: body.linkBioRodapeTexto }),
      ...(body.linkBioImagemUrl !== undefined && { linkBioImagemUrl: body.linkBioImagemUrl }),
      ...(body.linkBioTagline !== undefined && { linkBioTagline: body.linkBioTagline }),
      ...(body.linkBioTags !== undefined && { linkBioTags: body.linkBioTags }),
      ...(body.linkBioInstagram !== undefined && { linkBioInstagram: body.linkBioInstagram }),
      ...(body.linkBioYoutube !== undefined && { linkBioYoutube: body.linkBioYoutube }),
      ...(body.linkBioTiktok !== undefined && { linkBioTiktok: body.linkBioTiktok }),
      ...(body.linkBioLinkedin !== undefined && { linkBioLinkedin: body.linkBioLinkedin }),
    },
    create: {
      id: "config",
      whatsappAgencia: body.whatsappAgencia || null,
      metaFaturamentoMensal: body.metaFaturamentoMensal || null,
      custoHoraPadrao: body.custoHoraPadrao || null,
      templateOnboarding: body.templateOnboarding || [],
      siteHeroTitulo: body.siteHeroTitulo || null,
      siteHeroSubtitulo: body.siteHeroSubtitulo || null,
      siteHeroImagemUrl: body.siteHeroImagemUrl || null,
      siteHeroImagemUrlMobile: body.siteHeroImagemUrlMobile || null,
      siteHeroFoco: body.siteHeroFoco || null,
      siteSobreTexto: body.siteSobreTexto || null,
      siteSobreImagemUrl: body.siteSobreImagemUrl || null,
      siteSobreImagemUrlMobile: body.siteSobreImagemUrlMobile || null,
      siteSobreFoco: body.siteSobreFoco || null,
      siteRodapeTexto: body.siteRodapeTexto || null,
      linkBioIntroTexto: body.linkBioIntroTexto || null,
      linkBioRodapeTexto: body.linkBioRodapeTexto || null,
      linkBioImagemUrl: body.linkBioImagemUrl || null,
      linkBioTagline: body.linkBioTagline || null,
      linkBioTags: body.linkBioTags || null,
      linkBioInstagram: body.linkBioInstagram || null,
      linkBioYoutube: body.linkBioYoutube || null,
      linkBioTiktok: body.linkBioTiktok || null,
      linkBioLinkedin: body.linkBioLinkedin || null,
    },
  });

  return NextResponse.json(config);
}
