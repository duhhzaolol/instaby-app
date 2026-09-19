import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import SiteTextosForm from "./SiteTextosForm";
import ServicosForm from "./ServicosForm";
import DiferenciaisForm from "./DiferenciaisForm";
import ProcessoCtaForm from "./ProcessoCtaForm";
import CasesForm from "./CasesForm";
import LinkBioForm from "./LinkBioForm";

export default async function SiteConfigPage() {
  const [config, cases, links] = await Promise.all([
    prisma.configuracao.findUnique({ where: { id: "config" } }),
    prisma.caseTrabalho.findMany({ orderBy: { ordem: "asc" } }),
    prisma.linkBio.findMany({ orderBy: { ordem: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/dashboard/configuracoes" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
          <ArrowLeft size={13} /> Configurações
        </Link>
        <p className="text-lg font-medium text-text">Site &amp; Link na bio</p>
        <p className="text-sm text-muted">
          Edite o conteúdo do site público e da página de links você mesmo, sem precisar mexer em código.{" "}
          <a href="/" target="_blank" className="inline-flex items-center gap-1 text-accent hover:underline">
            Ver site <ExternalLink size={11} />
          </a>{" "}
          ·{" "}
          <a href="/link" target="_blank" className="inline-flex items-center gap-1 text-accent hover:underline">
            Ver /link <ExternalLink size={11} />
          </a>
        </p>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Abertura, "Quem somos" e rodapé</p>
        <p className="mb-4 text-sm text-muted">
          Frase de impacto, indicadores, banners de fundo (com ponto de enquadramento e versão pro celular) e o
          rodapé. Cada imagem mostra o tamanho recomendado antes de você enviar.
        </p>
        <SiteTextosForm
          config={{
            siteHeroTitulo: config?.siteHeroTitulo || null,
            siteHeroSubtitulo: config?.siteHeroSubtitulo || null,
            siteHeroTituloDestaque: config?.siteHeroTituloDestaque || null,
            siteHeroImagemUrl: config?.siteHeroImagemUrl || null,
            siteHeroImagemUrlMobile: config?.siteHeroImagemUrlMobile || null,
            siteHeroFoco: config?.siteHeroFoco || null,
            siteHeroIndicadores: (config?.siteHeroIndicadores as { valor: string; legenda: string }[] | null) || null,
            siteSobreTexto: config?.siteSobreTexto || null,
            siteSobreImagemUrl: config?.siteSobreImagemUrl || null,
            siteSobreImagemUrlMobile: config?.siteSobreImagemUrlMobile || null,
            siteSobreFoco: config?.siteSobreFoco || null,
            siteSobreBotaoTexto: config?.siteSobreBotaoTexto || null,
            siteSobreBotaoUrl: config?.siteSobreBotaoUrl || null,
            siteRodapeRegiao: config?.siteRodapeRegiao || null,
            siteRodapeDireitos: config?.siteRodapeDireitos || null,
            siteRodapeTexto: config?.siteRodapeTexto || null,
          }}
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Serviços</p>
        <p className="mb-4 text-sm text-muted">Os 8 cartões da seção "Serviços" do site.</p>
        <ServicosForm servicos={(config?.siteServicos as { nome: string; descricao: string; destino: string }[] | null) || null} />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Diferenciais</p>
        <p className="mb-4 text-sm text-muted">A faixa de 4 itens logo abaixo do "Quem somos".</p>
        <DiferenciaisForm diferenciais={(config?.siteDiferenciais as { titulo: string; texto: string }[] | null) || null} />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Portfólio (seção "Trabalhos" do site)</p>
        <p className="mb-4 text-sm text-muted">
          Cada trabalho vira um card no site — marque como "destaque" pra aparecer como projeto principal (com
          resultados e botão), e reordene com as setas quando quiser mudar a ordem de exibição.
        </p>
        <CasesForm
          cases={cases.map((c) => ({
            id: c.id,
            nome: c.nome,
            categoria: c.categoria,
            imagemUrl: c.imagemUrl,
            imagemFoco: c.imagemFoco,
            descricao: c.descricao,
            descricaoCompleta: c.descricaoCompleta,
            botaoTexto: c.botaoTexto,
            resultados: (c.resultados as { valor: string; legenda: string }[] | null) || null,
            link: c.link,
            destaque: c.destaque,
            ordem: c.ordem,
          }))}
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Processo e chamada final</p>
        <p className="mb-4 text-sm text-muted">A faixa "Processo" e a chamada final antes do rodapé.</p>
        <ProcessoCtaForm
          config={{
            siteProcessoTexto: config?.siteProcessoTexto || null,
            siteProcessoBotaoTexto: config?.siteProcessoBotaoTexto || null,
            siteProcessoBotaoUrl: config?.siteProcessoBotaoUrl || null,
            siteCtaTitulo: config?.siteCtaTitulo || null,
            siteCtaTexto: config?.siteCtaTexto || null,
            siteCtaBotaoTexto: config?.siteCtaBotaoTexto || null,
            siteCtaImagemUrl: config?.siteCtaImagemUrl || null,
            siteCtaImagemUrlMobile: config?.siteCtaImagemUrlMobile || null,
            siteCtaFoco: config?.siteCtaFoco || null,
          }}
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Página de links (/link)</p>
        <p className="mb-4 text-sm text-muted">
          Estilo Linktree — adicione quantos links quiser, com foto de capa, e reordene quando quiser. Os links de
          rede social daqui também aparecem no rodapé do site.
        </p>
        <LinkBioForm
          links={links.map((l) => ({
            id: l.id,
            titulo: l.titulo,
            descricao: l.descricao,
            url: l.url,
            imagemUrl: l.imagemUrl,
            destaque: l.destaque,
            ordem: l.ordem,
          }))}
          introTexto={config?.linkBioIntroTexto || ""}
          rodapeTexto={config?.linkBioRodapeTexto || ""}
          imagemUrl={config?.linkBioImagemUrl || null}
          tagline={config?.linkBioTagline || ""}
          tags={config?.linkBioTags || ""}
          instagram={config?.linkBioInstagram || ""}
          youtube={config?.linkBioYoutube || ""}
          tiktok={config?.linkBioTiktok || ""}
          linkedin={config?.linkBioLinkedin || ""}
        />
      </div>
    </div>
  );
}
