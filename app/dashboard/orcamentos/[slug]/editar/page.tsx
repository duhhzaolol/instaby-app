import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { obterApresentacaoOrcamento } from "@/lib/apresentacaoOrcamento";
import { exigirPermissao, podeVerCliente } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import EditarApresentacaoForm from "./EditarApresentacaoForm";

export default async function EditarOrcamentoPage({ params }: { params: { slug: string } }) {
  const usuario = await exigirPermissao("verOrcamentos");
  const orcamento = await prisma.orcamento.findUnique({
    where: { slug: params.slug },
    include: { cliente: true, itens: { include: { servico: true } } },
  });
  if (!orcamento || !(await podeVerCliente(usuario, orcamento.clienteId))) notFound();

  const apresentacao = obterApresentacaoOrcamento(
    orcamento.apresentacao,
    orcamento.cliente.nome,
    orcamento.itens.map((item) => item.servico.unidade)
  );

  return (
    <div className="min-w-0">
      <Link
        href={`/dashboard/clientes/${orcamento.clienteId}?aba=orcamentos`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text"
      >
        <ArrowLeft size={13} aria-hidden="true" /> {orcamento.cliente.nome}
      </Link>
      <h1 className="mb-1 text-lg font-medium text-text">Personalizar orçamento</h1>
      <p className="mb-5 text-sm text-muted">
        Ajuste a abertura da proposta de {orcamento.cliente.nome}. Ao salvar, o endereço compartilhado continua o mesmo.
      </p>
      <EditarApresentacaoForm
        slug={orcamento.slug}
        clienteNome={orcamento.cliente.nome}
        apresentacaoInicial={apresentacao}
        aceito={orcamento.status === "aceito"}
        itens={orcamento.itens.map((item) => ({
          id: item.id,
          nome: item.nomeServico ?? item.servico.nome,
          descricao: item.descricaoServico ?? item.servico.descricao,
          quantidade: item.quantidade,
          valor: Number(item.valor),
        }))}
      />
    </div>
  );
}
