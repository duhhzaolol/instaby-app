import Link from "next/link";
import { Globe, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import DepoimentosForm from "./DepoimentosForm";
import WhatsappAgenciaForm from "./WhatsappAgenciaForm";
import LogosClientesForm from "./LogosClientesForm";
import MetaFaturamentoForm from "./MetaFaturamentoForm";
import CustoHoraForm from "./CustoHoraForm";
import TemplateOnboardingForm from "./TemplateOnboardingForm";
import TemplatesTarefasForm from "./TemplatesTarefasForm";

export default async function ConfiguracoesPage() {
  const [depoimentos, config, clientesComLogo, templatesTarefas] = await Promise.all([
    prisma.depoimento.findMany({ where: { ativo: true }, orderBy: { id: "desc" } }),
    prisma.configuracao.findUnique({ where: { id: "config" } }),
    prisma.cliente.findMany({
      where: { logoUrl: { not: null } },
      select: { id: true, nome: true, logoUrl: true, exibirLogoPublico: true },
      orderBy: { nome: "asc" },
    }),
    prisma.templateTarefas.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <p className="text-lg font-medium text-text">Configurações</p>

      <Link
        href="/dashboard/configuracoes/site"
        className="flex items-center justify-between rounded-2xl border border-accent/20 bg-accent/5 p-5 transition-colors hover:bg-accent/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Globe size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-text">Site &amp; Link na bio</p>
            <p className="text-xs text-muted">
              Edite textos, imagens, portfólio e os links da página /link — sem precisar de código.
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-muted" />
      </Link>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Meta de faturamento</p>
        <p className="mb-4 text-sm text-muted">
          Usada na Visão Geral pra mostrar o progresso do mês.
        </p>
        <MetaFaturamentoForm metaAtual={config?.metaFaturamentoMensal ? Number(config.metaFaturamentoMensal) : 0} />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Custo por hora</p>
        <p className="mb-4 text-sm text-muted">
          Quanto uma hora sua "custa" pra agência — usado pra calcular a rentabilidade de cada cliente descontando
          o tempo trabalhado, não só o dinheiro que entrou e saiu.
        </p>
        <CustoHoraForm custoAtual={config?.custoHoraPadrao ? Number(config.custoHoraPadrao) : 0} />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Checklist padrão de onboarding</p>
        <p className="mb-4 text-sm text-muted">
          Usado toda vez que você clica em "Iniciar onboarding" num cliente novo. Personalize do seu jeito.
        </p>
        <TemplateOnboardingForm templateAtual={config?.templateOnboarding || []} />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Templates de tarefas</p>
        <p className="mb-4 text-sm text-muted">
          Checklists reaproveitáveis — ex: "Captação" com preparar pauta, conferir equipamento, captação, backup,
          seleção, edição. Aplica de uma vez num conteúdo ou cliente, sem digitar tarefa por tarefa.
        </p>
        <TemplatesTarefasForm templates={templatesTarefas} />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text">WhatsApp da agência</p>
        <p className="mb-4 text-sm text-muted">
          Usado no botão "Falar com a gente" que aparece na proposta pública.
        </p>
        <WhatsappAgenciaForm whatsappAtual={config?.whatsappAgencia || ""} />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Logos na proposta</p>
        <p className="mb-4 text-sm text-muted">
          Escolha quais clientes aparecem na vitrine "Empresas que confiam" das propostas — o logo
          aparece em cinza automaticamente, mesmo se o original for colorido.
        </p>
        <LogosClientesForm
          clientes={clientesComLogo.map((c) => ({
            id: c.id,
            nome: c.nome,
            logoUrl: c.logoUrl!,
            exibirLogoPublico: c.exibirLogoPublico,
          }))}
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Depoimentos</p>
        <p className="mb-4 text-sm text-muted">
          Aparecem automaticamente em toda página pública de orçamento que você enviar.
        </p>
        <DepoimentosForm
          depoimentos={depoimentos.map((d) => ({ id: d.id, nomeCliente: d.nomeCliente, texto: d.texto }))}
        />
      </div>
    </div>
  );
}
