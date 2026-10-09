import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PreferenciasMovimento } from "@/components/layout/PreferenciasMovimento";
import { PainelDetalheTarefaHost } from "@/components/dashboard/PainelDetalheTarefaHost";
import { garantirRecorrentesDoMes } from "@/lib/garantirRecorrentes";
import { getUsuarioAtual, permissoesDe, clienteIdsPermitidos } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { calcularStatusEfetivo } from "@/lib/statusFinanceiro";
import { manrope, jetbrainsMono } from "@/lib/fonts";
import { tarefaAtrasada } from "@/lib/organizacaoTarefas";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Trava aqui em cima protege TODA a árvore de /dashboard de uma vez: sem isso,
  // alguém com um cookie de sessão ainda válido mas desativado nas Configurações
  // (usuario.ativo=false) — o middleware só confere se o cookie existe, não se a
  // conta ainda tá ativa, e a sessão dura até 30 dias — caía aqui com
  // usuarioAtual=null. Isso vinha degradando "sem querer" pra um objeto de
  // permissão de dono (tudo true) só pra a Sidebar não quebrar, o que é o
  // oposto do que devia acontecer (auditoria v147, achado revisando o resto).
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) redirect("/login");

  // A compilação e visitas sem sessão não podem lançar valores no banco.
  await garantirRecorrentesDoMes();

  const nome = usuarioAtual.nome;
  const primeiroNome = nome.split(" ")[0];
  const cargo = usuarioAtual.cargo || "Adm Master";
  const pode = permissoesDe(usuarioAtual);

  // Mesmo filtro de cliente-por-permissão já usado em Tarefas/Agenda/Horas —
  // pra ninguém ver, nem em contador do menu nem no seletor do cronômetro/nova
  // tarefa, um cliente que não é dela.
  const idsPermitidos = await clienteIdsPermitidos(usuarioAtual);
  const filtroClienteId = idsPermitidos ? { id: { in: idsPermitidos } } : {};
  const filtroTarefaCliente = idsPermitidos
    ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] }
    : {};

  // Contadores do menu lateral (redesign v144, Parte 1) e lista de clientes
  // usada nos seletores do cronômetro e do "Nova tarefa" da barra do topo.
  const [tarefasAtrasadas, clientesAtivos, cobrancasVencidas, clientesParaMenu] = await Promise.all([
    prisma.tarefa.findMany({
      where: { tipo: { not: "ideia" }, status: { not: "feito" }, prazo: { not: null }, ...filtroTarefaCliente },
      select: { tipo: true, status: true, prazo: true },
    }).then(tarefas => tarefas.filter(t => tarefaAtrasada(t)).length),
    prisma.cliente.count({ where: { status: "ativo", ...filtroClienteId } }),
    pode.verFinanceiro
      ? prisma.cobranca.findMany({ where: { status: { notIn: ["pago", "cancelado"] }, ...(idsPermitidos ? { clienteId: { in: idsPermitidos } } : {}) }, include: { pagamentos: true } }).then(cobrancas => cobrancas.filter(c => calcularStatusEfetivo({ status: c.status, valor: Number(c.valor), totalPago: c.pagamentos.reduce((s, p) => s + Number(p.valor), 0), vencimento: c.vencimento }) === "atrasado").length)
      : Promise.resolve(0),
    prisma.cliente.findMany({
      where: { status: { not: "inativo" }, ...filtroClienteId },
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className={`tema-painel ${manrope.variable} ${jetbrainsMono.variable} min-h-screen bg-base`}>
      <PreferenciasMovimento>
      <a href="#conteudo-principal" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-card focus:px-4 focus:py-3 focus:text-text">
        Ir para o conteúdo
      </a>
      <Sidebar
        nome={nome}
        cargo={cargo}
        fotoUrl={usuarioAtual.fotoUrl}
        pode={pode}
        contadores={{ tarefasAtrasadas, clientesAtivos, cobrancasVencidas }}
      />
      <div className="md:pl-[248px] print:pl-0">
        <Header nomePrimeiro={primeiroNome} clientes={clientesParaMenu} />
        <main id="conteudo-principal" tabIndex={-1} className="scroll-mt-32 px-4 py-6 outline-none sm:px-6 sm:py-8 print:px-0 print:py-0">{children}</main>
        <footer className="mt-12 border-t border-border px-6 py-8 text-center text-xs text-muted print:hidden">
          <img src="/logo.png" alt="Instaby" className="mx-auto mb-2 h-4 w-auto opacity-40 grayscale" />
          Instaby App · painel interno da agência
        </footer>
      </div>
      {/* Painel lateral de tarefa (Etapa 1 v152) — montado uma vez pro dashboard
         inteiro, abre sozinho quando a URL tem "?tarefa=ID" (ver PainelDetalheTarefaHost). */}
      <Suspense fallback={null}>
        <PainelDetalheTarefaHost />
      </Suspense>
      </PreferenciasMovimento>
    </div>
  );
}
