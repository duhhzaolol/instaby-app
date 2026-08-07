import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const NOVO_CATALOGO = [
  { categoria: "📱 Social Media", nome: "Gestão de Instagram", descricao: "Gestão completa do perfil, incluindo planejamento, calendário editorial e agendamento de publicações.", unidade: "mês", valorUnitario: 0 },
  { categoria: "📱 Social Media", nome: "Gestão de Facebook", descricao: "Gestão completa da página, incluindo planejamento, calendário editorial e agendamento de publicações.", unidade: "mês", valorUnitario: 0 },
  { categoria: "📱 Social Media", nome: "Gestão de TikTok", descricao: "Gestão completa do perfil, incluindo planejamento, calendário editorial e agendamento de publicações.", unidade: "mês", valorUnitario: 0 },
  { categoria: "📱 Social Media", nome: "Gestão de Google Meu Negócio", descricao: "Cadastro e gestão do perfil no Google Meu Negócio — recomendado em conjunto com a gestão de redes sociais.", unidade: "mês", valorUnitario: 0 },
  { categoria: "📱 Social Media", nome: "Taxa de plataforma (agendamento)", descricao: "Custo da ferramenta usada para agendamento e gestão de redes sociais, cobrado à parte da gestão.", unidade: "mês", valorUnitario: 0 },

  { categoria: "🎥 Produção de Conteúdo", nome: "Edição de vídeo", descricao: "Edição de vídeos já gravados pelo cliente. Valor por vídeo — escala conforme a quantidade escolhida.", unidade: "vídeo", valorUnitario: 0 },
  { categoria: "🎥 Produção de Conteúdo", nome: "Captação de vídeo (bruto)", descricao: "Captação de vídeo com qualidade profissional (áudio e imagem), entregue sem edição. Valor por vídeo — escala conforme a quantidade.", unidade: "vídeo", valorUnitario: 0 },
  { categoria: "🎥 Produção de Conteúdo", nome: "Captação e edição — Reels", descricao: "Captação e edição completas, formato vertical pronto para Instagram Reels.", unidade: "vídeo", valorUnitario: 0 },
  { categoria: "🎥 Produção de Conteúdo", nome: "Captação e edição — TikTok", descricao: "Captação e edição completas, formato vertical pronto para TikTok.", unidade: "vídeo", valorUnitario: 0 },
  { categoria: "🎥 Produção de Conteúdo", nome: "Captação e edição — YouTube", descricao: "Captação e edição completas, formato horizontal pronto para YouTube.", unidade: "vídeo", valorUnitario: 0 },
  { categoria: "🎥 Produção de Conteúdo", nome: "Vídeo com drone", descricao: "Captação aérea com drone. Tempo máximo de voo combinado previamente com o cliente.", unidade: "captação", valorUnitario: 0 },

  { categoria: "📸 Captação", nome: "Captação de fotos externa", descricao: "Sessão de fotos no local do cliente. Valor por hora.", unidade: "hora", valorUnitario: 0 },
  { categoria: "📸 Captação", nome: "Captação de fotos em estúdio", descricao: "Sessão de fotos no estúdio da Instaby. Valor por hora.", unidade: "hora", valorUnitario: 0 },

  { categoria: "🎯 Tráfego Pago", nome: "Gestão de Meta Ads", descricao: "Configuração, monitoramento e otimização de campanhas no Meta Ads. Foco definido com o cliente: geração de leads, remarketing, eventos ou lançamentos.", unidade: "mês", valorUnitario: 0 },
  { categoria: "🎯 Tráfego Pago", nome: "Gestão de Google Ads", descricao: "Configuração, monitoramento e otimização de campanhas no Google Ads. Foco definido com o cliente: geração de leads, remarketing, eventos ou lançamentos.", unidade: "mês", valorUnitario: 0 },
  { categoria: "🎯 Tráfego Pago", nome: "Investimento em anúncios", descricao: "Valor investido diretamente na plataforma (Meta ou Google Ads), repassado integralmente.", unidade: "mês", valorUnitario: 0 },

  { categoria: "🌐 Desenvolvimento Web", nome: "Landing Page", descricao: "Criação de página única de conversão. Hospedagem e ferramentas combinadas à parte.", unidade: "criação", valorUnitario: 0 },
  { categoria: "🌐 Desenvolvimento Web", nome: "Manutenção de Landing Page", descricao: "Atualizações e suporte mensal da landing page (opcional).", unidade: "mês", valorUnitario: 0 },
  { categoria: "🌐 Desenvolvimento Web", nome: "Site institucional", descricao: "Criação de site institucional completo. Hospedagem e ferramentas combinadas à parte.", unidade: "criação", valorUnitario: 0 },
  { categoria: "🌐 Desenvolvimento Web", nome: "Hospedagem", descricao: "Hospedagem do site — valor combinado conforme a ferramenta escolhida em reunião.", unidade: "mês", valorUnitario: 0 },

  { categoria: "🎬 Cobertura de Eventos", nome: "Cobertura fotográfica de evento", descricao: "Fotografia de cobertura do evento. Valor por hora — deslocamento e tempo real cobrados à parte.", unidade: "hora", valorUnitario: 0 },
  { categoria: "🎬 Cobertura de Eventos", nome: "Cobertura de vídeo de evento", descricao: "Filmagem de cobertura do evento. Valor por hora — deslocamento e tempo real cobrados à parte.", unidade: "hora", valorUnitario: 0 },
  { categoria: "🎬 Cobertura de Eventos", nome: "Deslocamento", descricao: "Taxa de deslocamento até o local do evento.", unidade: "evento", valorUnitario: 0 },
  { categoria: "🎬 Cobertura de Eventos", nome: "Cobertura em tempo real", descricao: "Adicional para publicação em tempo real durante o evento.", unidade: "evento", valorUnitario: 0 },
  { categoria: "🎬 Cobertura de Eventos", nome: "Live de vendas", descricao: "Transmissão ao vivo com foco em vendas.", unidade: "dia", valorUnitario: 0 },
  { categoria: "🎬 Cobertura de Eventos", nome: "StoryMaker com câmera profissional", descricao: "Profissional dedicado a captar conteúdo para Stories durante o evento.", unidade: "hora", valorUnitario: 0 },
];

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const confirmar = request.nextUrl.searchParams.get("confirmar");

  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ erro: "Secret inválido" }, { status: 401 });
  }

  if (confirmar !== "sim") {
    return NextResponse.json(
      {
        aviso:
          "Essa rota apaga TODOS os orçamentos, pacotes, serviços contratados e todo o catálogo de serviços (não mexe em Cliente, Tarefa, Cobrança, Despesa, Contrato ou Horas). Pra confirmar, adicione &confirmar=sim na URL.",
      },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    // Solta as referências opcionais antes de apagar os orçamentos
    prisma.cobranca.updateMany({ where: { orcamentoId: { not: null } }, data: { orcamentoId: null } }),
    prisma.contrato.updateMany({ where: { orcamentoId: { not: null } }, data: { orcamentoId: null } }),
    prisma.itemOrcamento.deleteMany({}),
    prisma.orcamento.deleteMany({}),
    prisma.pacoteItem.deleteMany({}),
    prisma.pacote.deleteMany({}),
    prisma.servicoContratado.deleteMany({}),
    prisma.servico.deleteMany({}),
  ]);

  await prisma.servico.createMany({ data: NOVO_CATALOGO });

  return NextResponse.json({
    ok: true,
    mensagem: `Faxina completa. Catálogo recriado com ${NOVO_CATALOGO.length} serviços, todos com valor R$ 0 — edite cada um em /dashboard/servicos pra colocar o preço real.`,
  });
}
