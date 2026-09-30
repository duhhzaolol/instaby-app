import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigirPermissao } from "@/lib/permissoes";
import OrcamentoBuilder from "./OrcamentoBuilder";

// Falha de segurança corrigida de passagem (Etapa 3 v157, achada revisando este
// mesmo arquivo pra somar o vínculo com Solicitação): esta página nunca teve
// NENHUMA checagem de permissão própria (só "estar logado", do layout raiz do
// painel) — ao contrário de /dashboard/orcamentos (lista geral, protegida por
// `app/dashboard/orcamentos/layout.tsx`), esta é uma árvore de rotas diferente
// (`clientes/[id]/orcamentos/novo`) e não herda aquele layout. Isso deixava
// visível pra QUALQUER pessoa logada — mesmo sem verOrcamentos, ex. um Editor —
// os serviços contratados do cliente (valor incluso) pré-selecionados, e agora
// também o texto de uma solicitação específica, sabendo/adivinhando a URL. A
// aba "Orçamentos" já escondia o link, mas a rota em si ficava aberta. Corrigido
// aplicando a mesma trava que o POST desta mesma funcionalidade já exige
// (`exigirPermissaoApi("verOrcamentos")` em .../api/clientes/[id]/orcamentos).
export default async function NovoOrcamentoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { solicitacaoId?: string };
}) {
  await exigirPermissao("verOrcamentos");

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: { servicosContratados: { where: { ativo: true } } },
  });
  if (!cliente) notFound();

  const [servicos, pacotes] = await Promise.all([
    prisma.servico.findMany({ orderBy: [{ categoria: "asc" }, { nome: "asc" }] }),
    prisma.pacote.findMany({ include: { itens: true }, orderBy: { createdAt: "desc" } }),
  ]);

  // Etapa 3 (v157) — chegando do botão "Preparar orçamento" de uma solicitação
  // fora do escopo: pula o pré-preenchimento padrão (serviços já contratados, que
  // não tem nada a ver com um pedido EXTRA) e tenta sugerir só o serviço do
  // catálogo marcado com a mesma categoria de entrega do pedido (ver
  // Servico.categoriaTarefa) — se nenhum bater, a pessoa escolhe na mão, mas já
  // vê do que se trata.
  let solicitacao: { id: string; descricao: string; categoria: string | null } | null = null;
  let selecaoDaSolicitacao: { servicoId: string; quantidade: number }[] | undefined;
  if (searchParams.solicitacaoId) {
    const s = await prisma.solicitacao.findUnique({
      where: { id: searchParams.solicitacaoId },
      select: { id: true, descricao: true, categoria: true, clienteId: true },
    });
    if (s && s.clienteId === params.id) {
      solicitacao = { id: s.id, descricao: s.descricao, categoria: s.categoria };
      const servicoCorrespondente = s.categoria ? servicos.find((sv) => sv.categoriaTarefa === s.categoria) : null;
      selecaoDaSolicitacao = servicoCorrespondente ? [{ servicoId: servicoCorrespondente.id, quantidade: 1 }] : [];
    }
  }

  return (
    <div>
      <Link
        href={`/dashboard/clientes/${cliente.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text"
      >
        <ArrowLeft size={13} /> {cliente.nome}
      </Link>

      <p className="mb-1 text-lg font-medium text-text">Novo orçamento — {cliente.nome}</p>
      <p className="mb-5 text-sm text-muted">
        {solicitacao
          ? "Orçamento adicional a partir de um pedido fora do escopo — ajuste os serviços e valores antes de gerar"
          : cliente.servicosContratados.length > 0
          ? "Já veio com os serviços contratados dele marcados — ajuste se precisar"
          : "Selecione os serviços do catálogo — a página vai ganhando forma ao lado"}
      </p>

      {solicitacao && (
        <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
          <p className="text-xs text-amber-200">
            <span className="font-medium">Pedido de origem:</span> {solicitacao.descricao}
          </p>
        </div>
      )}

      {servicos.length === 0 ? (
        <p className="text-sm text-muted">
          Nenhum serviço no catálogo ainda.{" "}
          <Link href="/dashboard/servicos/novo" className="text-accent">
            Cadastre um serviço primeiro
          </Link>
          .
        </p>
      ) : (
        <OrcamentoBuilder
          clienteId={cliente.id}
          clienteNome={cliente.nome}
          servicos={servicos.map((s) => ({ ...s, valorUnitario: Number(s.valorUnitario) }))}
          pacotes={pacotes.map((p) => ({
            id: p.id,
            nome: p.nome,
            itens: p.itens.map((i) => ({ servicoId: i.servicoId, quantidade: i.quantidade })),
          }))}
          selecaoInicial={
            solicitacao
              ? selecaoDaSolicitacao
              : cliente.servicosContratados.map((sc) => ({
                  servicoId: sc.servicoId,
                  quantidade: sc.quantidade,
                }))
          }
          solicitacaoId={solicitacao?.id}
        />
      )}
    </div>
  );
}
