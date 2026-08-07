import { notFound } from "next/navigation";
import { FileSignature, ShieldCheck, CalendarClock, RefreshCw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { visualDaCategoria } from "@/lib/categoriaVisual";

const statusLabel: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Aguardando assinatura",
  assinado: "Assinado",
};

function gerarCodigo(id: string, data: Date) {
  return `CT-${data.getFullYear()}-${id.slice(0, 3).toUpperCase()}`;
}

function formatarData(d: Date) {
  return d.toLocaleDateString("pt-BR");
}

export default async function ContratoPublicoPage({ params }: { params: { id: string } }) {
  const contrato = await prisma.contrato.findUnique({
    where: { id: params.id },
    include: { cliente: true },
  });

  if (!contrato) notFound();

  // Monta os itens estruturados: prioriza o orçamento de origem, senão os serviços
  // contratados atuais do cliente — sempre com ícone/cor por categoria.
  let itens: { nome: string; texto: string; categoria: string; valor: number }[] = [];

  if (contrato.orcamentoId) {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id: contrato.orcamentoId },
      include: { itens: { include: { servico: true } } },
    });
    if (orcamento) {
      itens = orcamento.itens.map((i) => ({
        nome: i.servico.nome,
        texto: i.servico.clausulaContrato || i.servico.descricao,
        categoria: i.servico.categoria,
        valor: Number(i.valor),
      }));
    }
  }

  if (itens.length === 0) {
    const servicosContratados = await prisma.servicoContratado.findMany({
      where: { clienteId: contrato.clienteId, ativo: true },
      include: { servico: true },
    });
    itens = servicosContratados.map((sc) => ({
      nome: sc.servico.nome,
      texto: sc.servico.clausulaContrato || sc.servico.descricao,
      categoria: sc.servico.categoria,
      valor: Number(sc.valor),
    }));
  }

  const total = itens.reduce((soma, i) => soma + i.valor, 0);
  const codigo = gerarCodigo(contrato.id, contrato.createdAt);

  return (
    <div className="min-h-screen bg-[#0B0D12]">
      <div className="border-b border-white/[0.06] px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-[#9CA3AF]">Contrato de Prestação de Serviços</span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-[#F9FAFB]">
              #{codigo}
            </span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-[#9CA3AF]">
              {statusLabel[contrato.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-white/[0.06] bg-gradient-to-br from-[#0B0D12] via-[#151822] to-[#1a0e10] px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-block h-[1.5px] w-5 bg-[#E63946]" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-[#E63946]">contrato</span>
          </div>
          <p className="text-4xl font-medium leading-tight text-[#F9FAFB]">Instaby Agência</p>
          <p className="mb-4 text-4xl font-medium leading-tight text-[#E63946]">& {contrato.cliente.nome}</p>
          <p className="max-w-md text-sm leading-relaxed text-[#9CA3AF]">
            Termos e serviços combinados entre as partes, descritos abaixo.
          </p>
        </div>
      </div>

      <div className="px-4 py-10">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#111827]/50 px-5 py-4">
              <FileSignature size={16} className="text-[#E63946]" />
              <p className="text-sm font-medium text-[#F9FAFB]">Serviços contratados</p>
            </div>

            {itens.length > 0 ? (
              <div className="flex flex-col gap-3">
                {itens.map((item, i) => {
                  const { icone: Icon, cor } = visualDaCategoria(item.categoria);
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-[#111827]/50 p-4"
                    >
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${cor}1A`, color: cor }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-[#F9FAFB]">{item.nome}</p>
                          <span className="shrink-0 text-sm font-medium text-[#E63946]">
                            R$ {item.valor.toFixed(0)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">{item.texto}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-[#111827]/50 p-5">
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#c2c0b6]">
                  {contrato.conteudo}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            {total > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#111827]/70 p-5">
                <p className="mb-1 text-xs text-[#9CA3AF]">Valor mensal</p>
                <p className="text-2xl font-medium text-[#E63946]">R$ {total.toFixed(0)}</p>
              </div>
            )}

            {(contrato.cliente.prazoContratoMeses || contrato.cliente.valorRenovacao) && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#111827]/70 p-5">
                {contrato.cliente.prazoContratoMeses && (
                  <p className="mb-2 flex items-center gap-2 text-xs text-[#c2c0b6]">
                    <CalendarClock size={13} className="text-[#E63946]" />
                    Vigência de {contrato.cliente.prazoContratoMeses} meses
                  </p>
                )}
                {contrato.cliente.valorRenovacao && (
                  <p className="flex items-center gap-2 text-xs text-[#c2c0b6]">
                    <RefreshCw size={13} className="text-[#E63946]" />
                    Renovação por R$ {Number(contrato.cliente.valorRenovacao).toFixed(0)}/mês
                  </p>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-white/[0.06] bg-[#111827]/70 p-5">
              <p className="mb-2 text-xs text-[#9CA3AF]">Emitido em</p>
              <p className="text-sm text-[#F9FAFB]">{formatarData(contrato.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 pb-10 text-[10px] text-[#6B7280]">
        <ShieldCheck size={11} /> Documento confidencial — Instaby Agência
      </div>
    </div>
  );
}
