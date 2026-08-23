import { prisma } from "@/lib/prisma";
import DepoimentosForm from "./DepoimentosForm";
import WhatsappAgenciaForm from "./WhatsappAgenciaForm";
import LogosClientesForm from "./LogosClientesForm";
import MetaFaturamentoForm from "./MetaFaturamentoForm";

export default async function ConfiguracoesPage() {
  const [depoimentos, config, clientesComLogo] = await Promise.all([
    prisma.depoimento.findMany({ where: { ativo: true }, orderBy: { id: "desc" } }),
    prisma.configuracao.findUnique({ where: { id: "config" } }),
    prisma.cliente.findMany({
      where: { logoUrl: { not: null } },
      select: { id: true, nome: true, logoUrl: true, exibirLogoPublico: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <p className="text-lg font-medium text-text">Configurações</p>

      <div>
        <p className="mb-1 text-sm font-medium text-text">Meta de faturamento</p>
        <p className="mb-4 text-sm text-muted">
          Usada na Visão Geral pra mostrar o progresso do mês.
        </p>
        <MetaFaturamentoForm metaAtual={config?.metaFaturamentoMensal ? Number(config.metaFaturamentoMensal) : 0} />
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
