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
      ...(body.siteSobreTexto !== undefined && { siteSobreTexto: body.siteSobreTexto }),
      ...(body.siteSobreImagemUrl !== undefined && { siteSobreImagemUrl: body.siteSobreImagemUrl }),
      ...(body.siteRodapeTexto !== undefined && { siteRodapeTexto: body.siteRodapeTexto }),
      ...(body.linkBioIntroTexto !== undefined && { linkBioIntroTexto: body.linkBioIntroTexto }),
      ...(body.linkBioRodapeTexto !== undefined && { linkBioRodapeTexto: body.linkBioRodapeTexto }),
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
      siteSobreTexto: body.siteSobreTexto || null,
      siteSobreImagemUrl: body.siteSobreImagemUrl || null,
      siteRodapeTexto: body.siteRodapeTexto || null,
      linkBioIntroTexto: body.linkBioIntroTexto || null,
      linkBioRodapeTexto: body.linkBioRodapeTexto || null,
    },
  });

  return NextResponse.json(config);
}
