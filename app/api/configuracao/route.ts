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
      ...(body.siteHeroTituloDestaque !== undefined && { siteHeroTituloDestaque: body.siteHeroTituloDestaque }),
      ...(body.siteHeroIndicadores !== undefined && { siteHeroIndicadores: body.siteHeroIndicadores }),
      ...(body.siteServicos !== undefined && { siteServicos: body.siteServicos }),
      ...(body.siteDiferenciais !== undefined && { siteDiferenciais: body.siteDiferenciais }),
      ...(body.siteSobreTexto !== undefined && { siteSobreTexto: body.siteSobreTexto }),
      ...(body.siteSobreImagemUrl !== undefined && { siteSobreImagemUrl: body.siteSobreImagemUrl }),
      ...(body.siteSobreImagemUrlMobile !== undefined && { siteSobreImagemUrlMobile: body.siteSobreImagemUrlMobile }),
      ...(body.siteSobreFoco !== undefined && { siteSobreFoco: body.siteSobreFoco }),
      ...(body.siteSobreBotaoTexto !== undefined && { siteSobreBotaoTexto: body.siteSobreBotaoTexto }),
      ...(body.siteSobreBotaoUrl !== undefined && { siteSobreBotaoUrl: body.siteSobreBotaoUrl }),
      ...(body.siteProcessoTexto !== undefined && { siteProcessoTexto: body.siteProcessoTexto }),
      ...(body.siteProcessoBotaoTexto !== undefined && { siteProcessoBotaoTexto: body.siteProcessoBotaoTexto }),
      ...(body.siteProcessoBotaoUrl !== undefined && { siteProcessoBotaoUrl: body.siteProcessoBotaoUrl }),
      ...(body.siteCtaTitulo !== undefined && { siteCtaTitulo: body.siteCtaTitulo }),
      ...(body.siteCtaTexto !== undefined && { siteCtaTexto: body.siteCtaTexto }),
      ...(body.siteCtaBotaoTexto !== undefined && { siteCtaBotaoTexto: body.siteCtaBotaoTexto }),
      ...(body.siteCtaImagemUrl !== undefined && { siteCtaImagemUrl: body.siteCtaImagemUrl }),
      ...(body.siteCtaImagemUrlMobile !== undefined && { siteCtaImagemUrlMobile: body.siteCtaImagemUrlMobile }),
      ...(body.siteCtaFoco !== undefined && { siteCtaFoco: body.siteCtaFoco }),
      ...(body.siteRodapeRegiao !== undefined && { siteRodapeRegiao: body.siteRodapeRegiao }),
      ...(body.siteRodapeDireitos !== undefined && { siteRodapeDireitos: body.siteRodapeDireitos }),
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
      siteHeroTituloDestaque: body.siteHeroTituloDestaque || null,
      siteHeroIndicadores: body.siteHeroIndicadores || undefined,
      siteServicos: body.siteServicos || undefined,
      siteDiferenciais: body.siteDiferenciais || undefined,
      siteSobreTexto: body.siteSobreTexto || null,
      siteSobreImagemUrl: body.siteSobreImagemUrl || null,
      siteSobreImagemUrlMobile: body.siteSobreImagemUrlMobile || null,
      siteSobreFoco: body.siteSobreFoco || null,
      siteSobreBotaoTexto: body.siteSobreBotaoTexto || null,
      siteSobreBotaoUrl: body.siteSobreBotaoUrl || null,
      siteProcessoTexto: body.siteProcessoTexto || null,
      siteProcessoBotaoTexto: body.siteProcessoBotaoTexto || null,
      siteProcessoBotaoUrl: body.siteProcessoBotaoUrl || null,
      siteCtaTitulo: body.siteCtaTitulo || null,
      siteCtaTexto: body.siteCtaTexto || null,
      siteCtaBotaoTexto: body.siteCtaBotaoTexto || null,
      siteCtaImagemUrl: body.siteCtaImagemUrl || null,
      siteCtaImagemUrlMobile: body.siteCtaImagemUrlMobile || null,
      siteCtaFoco: body.siteCtaFoco || null,
      siteRodapeRegiao: body.siteRodapeRegiao || null,
      siteRodapeDireitos: body.siteRodapeDireitos || null,
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
