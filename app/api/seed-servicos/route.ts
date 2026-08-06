import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CATALOGO = [
  {
    categoria: "📱 Social Media",
    nome: "Gestão de Conteúdo para Instagram",
    descricao:
      "Planejamento, organização e gestão estratégica do perfil no Instagram, incluindo acompanhamento do calendário editorial.",
    unidade: "gestão/mês",
    valorUnitario: 600,
  },
  {
    categoria: "📱 Social Media",
    nome: "Planejamento de Conteúdo",
    descricao:
      "Desenvolvimento do planejamento mensal com definição de temas, pautas e estratégia de comunicação.",
    unidade: "planejamento/mês",
    valorUnitario: 250,
  },
  {
    categoria: "📱 Social Media",
    nome: "Agendamento de Publicações",
    descricao: "Programação e organização das publicações em plataforma de gerenciamento.",
    unidade: "agendamento/mês",
    valorUnitario: 120,
  },
  {
    categoria: "📱 Social Media",
    nome: "Publicação e Monitoramento",
    descricao: "Publicação dos conteúdos e acompanhamento básico do desempenho das postagens.",
    unidade: "gestão/mês",
    valorUnitario: 180,
  },
  {
    categoria: "🎥 Produção de Conteúdo",
    nome: "Captação de Conteúdo Presencial",
    descricao: "Sessão presencial para produção de fotos e vídeos destinados às redes sociais.",
    unidade: "captação",
    valorUnitario: 350,
  },
  {
    categoria: "🎥 Produção de Conteúdo",
    nome: "Reels (4 unidades)",
    descricao: "Produção, edição e publicação de até 4 vídeos curtos (Reels) no mês.",
    unidade: "4 reels/mês",
    valorUnitario: 600,
  },
  {
    categoria: "🎥 Produção de Conteúdo",
    nome: "Reels (6 unidades)",
    descricao: "Produção, edição e publicação de até 6 vídeos curtos (Reels) no mês.",
    unidade: "6 reels/mês",
    valorUnitario: 850,
  },
  {
    categoria: "🎥 Produção de Conteúdo",
    nome: "Reels (8 unidades)",
    descricao: "Produção, edição e publicação de até 8 vídeos curtos (Reels) no mês.",
    unidade: "8 reels/mês",
    valorUnitario: 1100,
  },
  {
    categoria: "🎥 Produção de Conteúdo",
    nome: "Reels Avulso",
    descricao: "Produção, edição e entrega de um Reel individual.",
    unidade: "reel",
    valorUnitario: 180,
  },
  {
    categoria: "🎯 Tráfego Pago",
    nome: "Gestão de Meta Ads",
    descricao: "Configuração, monitoramento e otimização de campanhas no Meta Ads.",
    unidade: "gestão/mês",
    valorUnitario: 800,
  },
  {
    categoria: "🎯 Tráfego Pago",
    nome: "Campanha de Geração de Leads",
    descricao: "Criação e otimização de campanhas focadas em captação de novos contatos.",
    unidade: "campanha/mês",
    valorUnitario: 350,
  },
  {
    categoria: "🎯 Tráfego Pago",
    nome: "Campanha de Reconhecimento de Marca",
    descricao: "Campanhas voltadas para fortalecimento da marca e aumento de alcance.",
    unidade: "campanha/mês",
    valorUnitario: 300,
  },
  {
    categoria: "📊 Relatórios",
    nome: "Relatório Mensal de Performance",
    descricao:
      "Relatório com indicadores, resultados, métricas e análise do desempenho das ações realizadas.",
    unidade: "relatório/mês",
    valorUnitario: 120,
  },
  {
    categoria: "🛠️ Ferramentas",
    nome: "Plataforma de Gestão e Agendamento",
    descricao: "Utilização de plataforma especializada para agendamento de conteúdos e acompanhamento de métricas.",
    unidade: "licença/mês",
    valorUnitario: 80,
  },
];

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ erro: "Secret inválido" }, { status: 401 });
  }

  const existentes = await prisma.servico.findMany({ select: { nome: true } });
  const nomesExistentes = new Set(existentes.map((s) => s.nome));

  const novos = CATALOGO.filter((s) => !nomesExistentes.has(s.nome));

  if (novos.length === 0) {
    return NextResponse.json({ ok: true, mensagem: "Todos os serviços dessa lista já estavam cadastrados." });
  }

  await prisma.servico.createMany({ data: novos });

  return NextResponse.json({
    ok: true,
    mensagem: `${novos.length} serviços adicionados ao catálogo.`,
    adicionados: novos.map((s) => s.nome),
  });
}
