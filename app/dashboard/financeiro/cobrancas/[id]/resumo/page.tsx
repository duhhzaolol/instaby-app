import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";
import { calcularStatusEfetivo, LABEL_STATUS_EFETIVO } from "@/lib/statusFinanceiro";
import { BotaoImprimirResumo } from "@/components/dashboard/BotaoImprimirResumo";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function ResumoCobrancaPage({ params }: { params: { id: string } }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) redirect("/login");

  const cobranca = await prisma.cobranca.findUnique({
    where: { id: params.id },
    include: {
      cliente: {
        include: { servicosContratados: { where: { ativo: true }, include: { servico: true }, orderBy: { createdAt: "asc" } } },
      },
      pagamentos: true,
    },
  });
  if (!cobranca) notFound();
  if (!(await podeVerCliente(usuarioAtual, cobranca.clienteId))) notFound();

  const config = await prisma.configuracao.findUnique({ where: { id: "config" } });

  const totalPago = cobranca.pagamentos.reduce((s, p) => s + Number(p.valor), 0);
  const saldo = Math.max(0, Number(cobranca.valor) - totalPago);
  const statusEfetivo = calcularStatusEfetivo({
    status: cobranca.status,
    valor: Number(cobranca.valor),
    totalPago,
    vencimento: cobranca.vencimento,
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diasAtraso =
    statusEfetivo === "atrasado" && cobranca.vencimento
      ? Math.round((hoje.getTime() - new Date(cobranca.vencimento).setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
      : null;

  const servicos = cobranca.cliente.servicosContratados;
  const totalServicos = servicos.reduce((s, sc) => s + Number(sc.valor) * sc.quantidade, 0);
  const emitidoEm = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <div className="mx-auto max-w-2xl">
      <BotaoImprimirResumo voltarHref="/dashboard/financeiro/contas-a-receber" />

      <div className="rounded-2xl border border-border bg-card/60 p-8 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black">
        <div className="mb-8 flex items-center justify-between border-b border-border pb-6 print:border-black/20">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Instaby" className="h-8 w-auto print:hidden" />
            <div>
              <p className="text-base font-medium text-text print:text-black">Instaby Agência</p>
              <p className="text-xs text-muted print:text-black/60">Resumo de cobrança</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted print:text-black/60">Emitido em</p>
            <p className="text-sm text-text print:text-black">{emitidoEm}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted print:text-black/50">Cobrança para</p>
          <p className="text-lg font-medium text-text print:text-black">{cobranca.cliente.nome}</p>
          {cobranca.cliente.whatsapp && (
            <p className="text-xs text-muted print:text-black/60">{cobranca.cliente.whatsapp}</p>
          )}
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3 rounded-xl border border-border bg-base/40 p-4 print:border-black/20 print:bg-transparent">
          <div>
            <p className="text-[11px] text-muted print:text-black/50">Valor cobrado</p>
            <p className="text-base font-medium text-text print:text-black">R$ {fmt(Number(cobranca.valor))}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted print:text-black/50">Vencimento</p>
            <p className="text-base font-medium text-text print:text-black">
              {cobranca.vencimento ? new Date(cobranca.vencimento).toLocaleDateString("pt-BR") : "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted print:text-black/50">Situação</p>
            <p
              className={`text-base font-medium ${
                statusEfetivo === "atrasado" ? "text-red-400 print:text-red-700" : "text-text print:text-black"
              }`}
            >
              {LABEL_STATUS_EFETIVO[statusEfetivo]}
              {diasAtraso !== null && diasAtraso > 0 && ` (${diasAtraso}d)`}
            </p>
          </div>
        </div>

        {totalPago > 0 && saldo > 0 && (
          <p className="mb-6 text-xs text-muted print:text-black/60">
            Já recebido: R$ {fmt(totalPago)} · Saldo em aberto: R$ {fmt(saldo)}
          </p>
        )}

        {servicos.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted print:text-black/50">Serviços inclusos</p>
            <div className="flex flex-col gap-1.5">
              {servicos.map((sc) => (
                <div key={sc.id} className="flex items-center justify-between text-sm">
                  <span className="text-text print:text-black">
                    {sc.servico.nome}
                    {sc.quantidade > 1 && ` (${sc.quantidade}x)`}
                  </span>
                  <span className="text-muted print:text-black/70">R$ {fmt(Number(sc.valor) * sc.quantidade)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm font-medium print:border-black/20">
              <span className="text-text print:text-black">Total dos serviços</span>
              <span className="text-text print:text-black">R$ {fmt(totalServicos)}</span>
            </div>
            {Math.abs(totalServicos - Number(cobranca.valor)) > 0.01 && (
              <p className="mt-1 text-[11px] text-muted print:text-black/50">
                O valor cobrado nessa cobrança pode diferir do total dos serviços por desconto, acréscimo ou por
                cobrir um período diferente.
              </p>
            )}
          </div>
        )}

        {config?.instrucoesCobranca && (
          <div className="mb-2 rounded-xl border border-accent/20 bg-accent/5 p-4 print:border-black/20 print:bg-transparent">
            <p className="mb-1 text-xs uppercase tracking-wide text-accent print:text-black/50">Pagamento</p>
            <p className="whitespace-pre-line text-sm text-text print:text-black">{config.instrucoesCobranca}</p>
          </div>
        )}

        {config?.whatsappAgencia && (
          <p className="mt-6 text-center text-xs text-muted print:text-black/50">
            Dúvidas? Fale com a gente: {config.whatsappAgencia}
          </p>
        )}
      </div>
    </div>
  );
}
