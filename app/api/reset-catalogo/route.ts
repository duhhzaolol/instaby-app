import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const NOVO_CATALOGO = [
  // 📱 Social Media
  {
    categoria: "📱 Social Media",
    nome: "Gestão de Instagram",
    descricao: "Gestão completa do perfil, incluindo planejamento, calendário editorial e agendamento de publicações.",
    unidade: "mês",
    valorUnitario: 0,
  },
  {
    categoria: "📱 Social Media",
    nome: "Gestão de Facebook",
    descricao: "Gestão completa da página, incluindo planejamento, calendário editorial e agendamento de publicações.",
    unidade: "mês",
    valorUnitario: 0,
  },
  {
    categoria: "📱 Social Media",
    nome: "Gestão de TikTok",
    descricao: "Gestão completa do perfil, incluindo planejamento, calendário editorial e agendamento de publicações.",
    unidade: "mês",
    valorUnitario: 0,
  },
  {
    categoria: "📱 Social Media",
    nome: "Gestão de Google Meu Negócio",
    descricao: "Cadastro e gestão do perfil no Google Meu Negócio — recomendado em conjunto com a gestão de redes sociais.",
    unidade: "mês",
    valorUnitario: 0,
  },
  {
    categoria: "📱 Social Media",
    nome: "Taxa de plataforma (agendamento)",
    descricao: "Custo da ferramenta usada para agendamento e gestão de redes sociais, cobrado à parte da gestão.",
    unidade: "mês",
    valorUnitario: 0,
  },

  // 🎥 Produção de Conteúdo
  {
    categoria: "🎥 Produção de Conteúdo",
    nome: "Edição de vídeo",
    descricao: "Edição de vídeos já gravados pelo cliente. Valor por vídeo — escala conforme a quantidade escolhida.",
    unidade: "vídeo",
    valorUnitario: 0,
  },
  {
    categoria: "🎥 Produção de Conteúdo",
    nome: "Captação de vídeo (bruto)",
    descricao: "Captação de vídeo com qualidade profissional (áudio e imagem), entregue sem edição. Valor por vídeo — escala conforme a quantidade.",
    unidade: "vídeo",
    valorUnitario: 0,
  },
  {
    categoria: "🎥 Produção de Conteúdo",
    nome: "Captação e edição — Reels",
    descricao: "Captação e edição completas, formato vertical pronto para Instagram Reels.",
    unidade: "vídeo",
    valorUnitario: 0,
  },
  {
    categoria: "🎥 Produção de Conteúdo",
    nome: "Captação e edição — TikTok",
    descricao: "Captação e edição completas, formato vertical pronto para TikTok.",
    unidade: "vídeo",
    valorUnitario: 0,
  },
  {
    categoria: "🎥 Produção de Conteúdo",
    nome: "Captação e edição — YouTube",
    descricao: "Captação e edição completas, formato horizontal pronto para YouTube.",
    unidade: "vídeo",
    valorUnitario: 0,
  },
  {
    categoria: "🎥 Produção de Conteúdo",
    nome: "Vídeo com drone",
    descricao: "Captação aérea com drone. Tempo máximo de voo combinado previamente com o cliente.",
    unidade: "captação",
    valorUnitario: 0,
  },

  // 📸 Captação
  {
    categoria: "📸 Captação",
    nome: "Captação de fotos externa",
    descricao: "Sessão de fotos no local do cliente. Valor por hora.",
    unidade: "hora",
    valorUnitario: 0,
  },
  {
    categoria: "📸 Captação",
    nome: "Captação de fotos em estúdio",
    descricao: "Sessão de fotos no estúdio da Instaby. Valor por hora.",
    unidade: "hora",
    valorUnitario: 0,
  },

  // 🎯 Tráfego Pago
  {
    categoria: "🎯 Tráfego Pago",
    nome: "Gestão de Meta Ads",
    descricao: "Configuração, monitoramento e otimização de campanhas no Meta Ads (Instagram/Facebook). Foco definido com o cliente: geração de leads, remarketing, campanhas para eventos ou lançamentos.",
    unidade: "mês",
    valorUnitario: 0,
  },
  {
    categoria: "🎯 Tráfego Pago",
    nome: "Gestão de Google Ads",
    descricao: "Configuração, monitoramento e otimização de campanhas no Google Ads. Foco definido com o cliente: geração de leads, remarketing, campanhas para eventos ou lançamentos.",
    unidade: "mês",
    valorUnitario: 0,
  },
  {
    categoria: "🎯 Tráfego Pago",
    nome: "Investimento em anúncios",
    descricao: "Valor investido diretamente na plataforma (Meta ou Google Ads), repassado integralmente — definido conforme a campanha combinada.",
    unidade: "mês",
    valorUnitario: 0,
  },

  // 🌐 Desenvolvimento Web
  {
    categoria: "🌐 Desenvolvimento Web",
    nome: "Landing Page",
    descricao: "Criação de página única de conversão. Hospedagem e ferramentas combinadas à parte.",
    unidade: "criação",
    valorUnitario: 0,
  },
  {
    categoria: "🌐 Desenvolvimento Web",
    nome: "Manutenção de Landing Page",
    descricao: "Atualizações e suporte mensal da landing page (opcional).",
    unidade: "mês",
    valorUnitario: 0,
  },
  {
    categoria: "🌐 Desenvolvimento Web",
    nome: "Site institucional",
    descricao: "Criação de site institucional completo. Hospedagem e ferramentas combinadas à parte.",
    unidade: "criação",
    valorUnitario: 0,
  },
  {
    categoria: "🌐 Desenvolvimento Web",
    nome: "Hospedagem",
    descricao: "Hospedagem do site — valor combinado conforme a ferramenta escolhida em reunião.",
    unidade: "mês",
    valorUnitario: 0,
  },

  // 🎬 Cobertura de Eventos
  {
    categoria: "🎬 Cobertura de Eventos",
    nome: "Cobertura fotográfica de evento",
    descricao: "Fotografia de cobertura do evento. Valor por hora — deslocamento e tempo real cobrados à parte, se necessário.",
    unidade: "hora",
    valorUnitario: 0,
  },
  {
    categoria: "🎬 Cobertura de Eventos",
    nome: "Cobertura de vídeo de evento",
    descricao: "Filmagem de cobertura do evento. Valor por hora — deslocamento e tempo real cobrados à parte, se necessário.",
    unidade: "hora",
    valorUnitario: 0,
  },
  {
    categoria: "🎬 Cobertura de Eventos",
    nome: "Deslocamento",
    descricao: "Taxa de deslocamento até o local do evento.",
    unidade: "evento",
    valorUnitario: 0,
  },
  {
    categoria: "🎬 Cobertura de Eventos",
    nome: "Cobertura em tempo real",
    descricao: "Adicional para publicação em tempo real (stories/posts) durante o evento.",
    unidade: "evento",
    valorUnitario: 0,
  },
  {
    categoria: "🎬 Cobertura de Eventos",
    nome: "Live de vendas",
    descricao: "Transmissão ao vivo com foco em vendas.",
    unidade: "dia",
    valorUnitario: 0,
  },
  {
    categoria: "🎬 Cobertura de Eventos",
    nome: "StoryMaker com câmera profissional",
    descricao: "Profissional dedicado a captar conteúdo para Stories durante o evento, com câmera profissional.",
    unidade: "hora",
    valorUnitario: 0,
  },
];

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ erro: "Secret inválido" }, { status: 401 });
  }

  const existentes = await prisma.servico.findMany({ select: { id: true, nome: true } });

  const naoRemovidos: string[] = [];
  for (const s of existentes) {
    try {
      await prisma.servico.delete({ where: { id: s.id } });
    } catch {
      naoRemovidos.push(s.nome);
    }
  }

  const nomesAtuais = new Set((await prisma.servico.findMany({ select: { nome: true } })).map((s) => s.nome));
  const novos = NOVO_CATALOGO.filter((s) => !nomesAtuais.has(s.nome));
  if (novos.length > 0) {
    await prisma.servico.createMany({ data: novos });
  }

  return NextResponse.json({
    ok: true,
    removidos: existentes.length - naoRemovidos.length,
    naoRemovidos,
    criados: novos.length,
    aviso:
      naoRemovidos.length > 0
        ? "Alguns serviços antigos não foram removidos porque já estão em uso num orçamento, pacote ou contratação existente — edite-os manualmente se quiser ajustar."
        : undefined,
  });
}
