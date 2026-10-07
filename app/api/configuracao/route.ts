import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";
import { CAMPOS_DADOS_AGENCIA, ErroDadosAgencia, normalizarDadosAgencia } from "@/lib/dadosAgencia";

const selectDadosAgencia = {
  nomeAgencia: true, whatsappAgencia: true, siteAgencia: true,
  linkBioInstagram: true, logoAgenciaUrl: true,
} as const;

function semSegredos<T extends { googleDriveRefreshToken?: string | null }>(config: T) {
  const { googleDriveRefreshToken: _token, ...dados } = config;
  return dados;
}

export async function GET() {
  const config = await prisma.configuracao.findUnique({ where: { id: "config" } });
  return NextResponse.json(
    config ? semSegredos(config) : { id: "config", nomeAgencia: null, siteAgencia: null, logoAgenciaUrl: null, whatsappAgencia: null, metaFaturamentoMensal: null, custoHoraPadrao: null, templateOnboarding: [] }
  );
}

export async function PATCH(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Não foi possível ler os dados. Tente salvar novamente." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ erro: "Envie os dados da configuração em um formato válido." }, { status: 400 });
  }

  const alteraAgencia = CAMPOS_DADOS_AGENCIA.some((campo) => Object.hasOwn(body, campo));
  if (alteraAgencia) {
    const { erro } = await exigirPermissaoApi("gerenciarConfiguracoes");
    if (erro) return erro;
    try {
      Object.assign(body, normalizarDadosAgencia(body));
    } catch (erro) {
      if (erro instanceof ErroDadosAgencia) {
        return NextResponse.json({ erro: erro.message, campo: erro.campo }, { status: 400 });
      }
      throw erro;
    }
  }

  // O cadastro central só devolve os cinco campos públicos que ele usa.
  const somenteAgencia = alteraAgencia && Object.keys(body).every((campo) =>
    (CAMPOS_DADOS_AGENCIA as readonly string[]).includes(campo)
  );
  if (somenteAgencia) {
    try {
      const dados = normalizarDadosAgencia(body);
      const config = await prisma.configuracao.upsert({
        where: { id: "config" },
        update: dados,
        create: { id: "config", ...dados },
        select: selectDadosAgencia,
      });
      return NextResponse.json(config);
    } catch {
      return NextResponse.json({ erro: "Não foi possível salvar os dados da agência. Tente novamente." }, { status: 500 });
    }
  }

  const config = await prisma.configuracao.upsert({
    where: { id: "config" },
    update: {
      ...(body.nomeAgencia !== undefined && { nomeAgencia: body.nomeAgencia }),
      ...(body.siteAgencia !== undefined && { siteAgencia: body.siteAgencia }),
      ...(body.logoAgenciaUrl !== undefined && { logoAgenciaUrl: body.logoAgenciaUrl }),
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
      ...(body.siteProvaSocialTitulo !== undefined && { siteProvaSocialTitulo: body.siteProvaSocialTitulo }),
      ...(body.siteProvaSocialTexto !== undefined && { siteProvaSocialTexto: body.siteProvaSocialTexto }),
      ...(body.siteProcessoTexto !== undefined && { siteProcessoTexto: body.siteProcessoTexto }),
      ...(body.siteProcessoBotaoTexto !== undefined && { siteProcessoBotaoTexto: body.siteProcessoBotaoTexto }),
      ...(body.siteProcessoBotaoUrl !== undefined && { siteProcessoBotaoUrl: body.siteProcessoBotaoUrl }),
      ...(body.siteProcessoImagemUrl !== undefined && { siteProcessoImagemUrl: body.siteProcessoImagemUrl }),
      ...(body.siteProcessoImagemUrlMobile !== undefined && { siteProcessoImagemUrlMobile: body.siteProcessoImagemUrlMobile }),
      ...(body.siteProcessoFoco !== undefined && { siteProcessoFoco: body.siteProcessoFoco }),
      ...(body.siteProcessoEtapas !== undefined && { siteProcessoEtapas: body.siteProcessoEtapas }),
      ...(body.siteCtaTitulo !== undefined && { siteCtaTitulo: body.siteCtaTitulo }),
      ...(body.siteCtaTexto !== undefined && { siteCtaTexto: body.siteCtaTexto }),
      ...(body.siteCtaBotaoTexto !== undefined && { siteCtaBotaoTexto: body.siteCtaBotaoTexto }),
      ...(body.siteCtaImagemUrl !== undefined && { siteCtaImagemUrl: body.siteCtaImagemUrl }),
      ...(body.siteCtaImagemUrlMobile !== undefined && { siteCtaImagemUrlMobile: body.siteCtaImagemUrlMobile }),
      ...(body.siteCtaFoco !== undefined && { siteCtaFoco: body.siteCtaFoco }),
      ...(body.siteRodapeRegiao !== undefined && { siteRodapeRegiao: body.siteRodapeRegiao }),
      ...(body.siteRodapeDireitos !== undefined && { siteRodapeDireitos: body.siteRodapeDireitos }),
      ...(body.siteRodapeTexto !== undefined && { siteRodapeTexto: body.siteRodapeTexto }),
      ...(body.siteCorTitulo !== undefined && { siteCorTitulo: body.siteCorTitulo }),
      ...(body.siteCorTexto !== undefined && { siteCorTexto: body.siteCorTexto }),
      ...(body.siteAberturaTitulo !== undefined && { siteAberturaTitulo: body.siteAberturaTitulo }),
      ...(body.siteAberturaSubtitulo !== undefined && { siteAberturaSubtitulo: body.siteAberturaSubtitulo }),
      ...(body.sitePilares !== undefined && { sitePilares: body.sitePilares }),
      ...(body.siteAlbunsTitulo !== undefined && { siteAlbunsTitulo: body.siteAlbunsTitulo }),
      ...(body.siteAlbunsTexto !== undefined && { siteAlbunsTexto: body.siteAlbunsTexto }),
      ...(body.siteHeroGaleria !== undefined && { siteHeroGaleria: body.siteHeroGaleria }),
      ...(body.siteMapaTitulo !== undefined && { siteMapaTitulo: body.siteMapaTitulo }),
      ...(body.siteMapaTexto !== undefined && { siteMapaTexto: body.siteMapaTexto }),
      ...(body.siteMapaLocais !== undefined && { siteMapaLocais: body.siteMapaLocais }),
      ...(body.linkBioIntroTexto !== undefined && { linkBioIntroTexto: body.linkBioIntroTexto }),
      ...(body.linkBioRodapeTexto !== undefined && { linkBioRodapeTexto: body.linkBioRodapeTexto }),
      ...(body.linkBioImagemUrl !== undefined && { linkBioImagemUrl: body.linkBioImagemUrl }),
      ...(body.linkBioTagline !== undefined && { linkBioTagline: body.linkBioTagline }),
      ...(body.linkBioTags !== undefined && { linkBioTags: body.linkBioTags }),
      ...(body.linkBioInstagram !== undefined && { linkBioInstagram: body.linkBioInstagram }),
      ...(body.linkBioYoutube !== undefined && { linkBioYoutube: body.linkBioYoutube }),
      ...(body.linkBioTiktok !== undefined && { linkBioTiktok: body.linkBioTiktok }),
      ...(body.linkBioLinkedin !== undefined && { linkBioLinkedin: body.linkBioLinkedin }),
      ...(body.instrucoesCobranca !== undefined && { instrucoesCobranca: body.instrucoesCobranca }),
    },
    create: {
      id: "config",
      nomeAgencia: body.nomeAgencia || null,
      siteAgencia: body.siteAgencia || null,
      logoAgenciaUrl: body.logoAgenciaUrl || null,
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
      siteProvaSocialTitulo: body.siteProvaSocialTitulo || null,
      siteProvaSocialTexto: body.siteProvaSocialTexto || null,
      siteProcessoTexto: body.siteProcessoTexto || null,
      siteProcessoBotaoTexto: body.siteProcessoBotaoTexto || null,
      siteProcessoBotaoUrl: body.siteProcessoBotaoUrl || null,
      siteProcessoImagemUrl: body.siteProcessoImagemUrl || null,
      siteProcessoImagemUrlMobile: body.siteProcessoImagemUrlMobile || null,
      siteProcessoFoco: body.siteProcessoFoco || null,
      siteProcessoEtapas: body.siteProcessoEtapas || undefined,
      siteCtaTitulo: body.siteCtaTitulo || null,
      siteCtaTexto: body.siteCtaTexto || null,
      siteCtaBotaoTexto: body.siteCtaBotaoTexto || null,
      siteCtaImagemUrl: body.siteCtaImagemUrl || null,
      siteCtaImagemUrlMobile: body.siteCtaImagemUrlMobile || null,
      siteCtaFoco: body.siteCtaFoco || null,
      siteRodapeRegiao: body.siteRodapeRegiao || null,
      siteRodapeDireitos: body.siteRodapeDireitos || null,
      siteRodapeTexto: body.siteRodapeTexto || null,
      siteCorTitulo: body.siteCorTitulo || null,
      siteCorTexto: body.siteCorTexto || null,
      siteAberturaTitulo: body.siteAberturaTitulo || null,
      siteAberturaSubtitulo: body.siteAberturaSubtitulo || null,
      sitePilares: body.sitePilares || undefined,
      siteAlbunsTitulo: body.siteAlbunsTitulo || null,
      siteAlbunsTexto: body.siteAlbunsTexto || null,
      siteHeroGaleria: body.siteHeroGaleria || undefined,
      siteMapaTitulo: body.siteMapaTitulo || null,
      siteMapaTexto: body.siteMapaTexto || null,
      siteMapaLocais: body.siteMapaLocais || undefined,
      linkBioIntroTexto: body.linkBioIntroTexto || null,
      linkBioRodapeTexto: body.linkBioRodapeTexto || null,
      linkBioImagemUrl: body.linkBioImagemUrl || null,
      linkBioTagline: body.linkBioTagline || null,
      linkBioTags: body.linkBioTags || null,
      linkBioInstagram: body.linkBioInstagram || null,
      linkBioYoutube: body.linkBioYoutube || null,
      linkBioTiktok: body.linkBioTiktok || null,
      linkBioLinkedin: body.linkBioLinkedin || null,
      instrucoesCobranca: body.instrucoesCobranca || null,
    },
  });

  return NextResponse.json(semSegredos(config));
}
