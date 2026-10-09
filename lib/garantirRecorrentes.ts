import { prisma } from "@/lib/prisma";
import { montarCicloDeTarefas } from "@/lib/templatesTarefas";
import { sincronizarMensalidadeCliente, vencimentoMensal } from "@/lib/mensalidades";
import { chaveDiaSaoPaulo } from "@/lib/dataHora";
import { diaFinanceiro, mesFinanceiro } from "@/lib/datasFinanceiro";
import { categoriaFinanceiraDaDespesa, tipoDaDespesa } from "@/lib/classificacaoDespesa";

// Evita rodar a checagem de recorrentes em toda navegação (isso rodava só na página
// Financeiro antes, e ficou pesado quando movido pro layout do dashboard). Com esse
// cache em memória, a checagem de verdade só roda de novo a cada 10 minutos por
// instância do servidor — nas outras requisições, é só um "if" e segue o jogo.
let ultimaChecagem = 0;
let checagemEmAndamento: Promise<void> | null = null;
const INTERVALO_MS = 10 * 60 * 1000;
const despesasEmAndamento = new Map<string, Promise<void>>();

/**
 * Garante que toda despesa marcada como recorrente tenha uma cópia lançada
 * no mês atual (nasce sempre "pendente" — só vira "pago" quando for baixada de verdade).
 */
export function garantirDespesasRecorrentesDoMes(agora = new Date()): Promise<void> {
  const mes = chaveDiaSaoPaulo(agora).slice(0, 7);
  const emAndamento = despesasEmAndamento.get(mes);
  if (emAndamento) return emAndamento;
  // Layout e página compartilham só a execução corrente. Após concluir, uma
  // visita já pode encontrar novos modelos, sem esperar o cache de dez minutos.
  const checagem = gerarDespesasRecorrentesDoMes(mes);
  despesasEmAndamento.set(mes, checagem);
  const liberar = () => { if (despesasEmAndamento.get(mes) === checagem) despesasEmAndamento.delete(mes); };
  checagem.then(liberar, liberar);
  return checagem;
}

async function gerarDespesasRecorrentesDoMes(mes: string): Promise<void> {
  const modelos = await prisma.despesa.findMany({ where: { recorrente: true, status: { not: "cancelado" } }, select: { id: true } });
  for (const item of modelos) {
    await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`despesa-recorrente:${item.id}`}))`;
      const modelo = await tx.despesa.findUnique({ where: { id: item.id } });
      if (!modelo || !modelo.recorrente || modelo.status === "cancelado") return;
      if (mesFinanceiro(modelo.data) > mes) return;
      const lancamentos = await tx.despesa.findMany({ where: { OR: [{ id: modelo.id }, { origemRecorrenteId: modelo.id }] } });
      if (lancamentos.some(d => mesFinanceiro(d.data) === mes)) return;
      const dataBase = modelo.vencimento || modelo.data;
      const dia = Number(diaFinanceiro(dataBase).slice(8));
      await tx.despesa.create({ data: {
        descricao: modelo.descricao, valor: modelo.valor, tipo: tipoDaDespesa(modelo),
        categoriaFinanceira: categoriaFinanceiraDaDespesa(modelo), categoria: modelo.categoria,
        subcategoria: modelo.subcategoria, clienteId: modelo.clienteId,
        recorrente: false, origemRecorrenteId: modelo.id, status: "pendente",
        vencimento: vencimentoMensal(mes, dia), data: new Date(`${mes}-01T00:00:00-03:00`),
      } });
    }, { maxWait: 15000, timeout: 20000 });
  }
}

/**
 * Gera uma mensalidade por cliente e competência, apenas quando a recorrência
 * foi ativada. A chave única e a trava no banco protegem acessos simultâneos e
 * servidores distintos. Criar serviços ou uma cobrança avulsa não ativa isso.
 */
export async function garantirCobrancasMensaisDoMes() {
  const clientes = await prisma.cliente.findMany({
    where: { status: "ativo", cobrancaRecorrenteAtiva: true }, select: { id: true },
  });
  for (const cliente of clientes) await sincronizarMensalidadeCliente(cliente.id);
}

/**
 * "Gerar rotinas mensais conforme os serviços contratados, sem duplicações" +
 * "permitir suspender a geração quando o contrato estiver pausado" (Etapa 4
 * v158). Mesmo padrão idempotente de garantirCobrancasMensaisDoMes: só cliente
 * ATIVO e sem rotinasPausadas, só serviço contratado ATIVO cujo Servico tenha um
 * templateRotina com pelo menos 1 etapa configurada, e nunca gera duas vezes pro
 * mesmo (serviço contratado, mês, ano) — RotinaGerada é o registro que impede a
 * duplicata (constraint única no banco, não só uma checagem solta no código).
 *
 * Data-alvo do ciclo (entrega/publicação): usa o ÚLTIMO DIA do mês atual — decisão
 * reversível e documentada, mesmo espírito do "dia 28" já usado em
 * garantirDespesasRecorrentesDoMes pra evitar mês sem esse dia. Um ciclo
 * disparado automaticamente não tem como saber a data de publicação real
 * combinada com o cliente; quem precisar de uma data específica usa "Aplicar
 * template" na mão, que pede a data.
 */
export async function garantirRotinasMensaisDoMes() {
  const hoje = new Date();
  const mes = hoje.getMonth();
  const ano = hoje.getFullYear();
  const dataAlvo = new Date(ano, mes + 1, 0); // dia 0 do mês seguinte = último dia deste mês

  const clientes = await prisma.cliente.findMany({
    where: { status: "ativo", rotinasPausadas: false },
    include: {
      servicosContratados: {
        where: { ativo: true, servico: { templateRotinaId: { not: null } } },
        include: {
          servico: { include: { templateRotina: { include: { etapas: { orderBy: { ordem: "asc" } } } } } },
        },
      },
    },
  });

  for (const cliente of clientes) {
    for (const sc of cliente.servicosContratados) {
      const template = sc.servico.templateRotina;
      if (!template || template.etapas.length === 0) continue;

      const jaGerado = await prisma.rotinaGerada.findUnique({
        where: { servicoContratadoId_mes_ano: { servicoContratadoId: sc.id, mes, ano } },
      });
      if (jaGerado) continue;

      const rotina = await prisma.rotinaGerada.create({
        data: { clienteId: cliente.id, servicoContratadoId: sc.id, templateId: template.id, mes, ano },
      });

      const ciclo = montarCicloDeTarefas(template.etapas, dataAlvo);
      let anteriorId: string | null = null;
      for (const etapa of ciclo) {
        const tarefa = await prisma.tarefa.create({
          data: {
            titulo: etapa.titulo,
            categoria: etapa.categoria,
            clienteId: cliente.id,
            prazo: etapa.prazo,
            estimativaHoras: etapa.estimativaHoras,
            rotinaGeradaId: rotina.id,
          },
        });
        if (anteriorId) {
          await prisma.dependenciaTarefa.create({ data: { tarefaId: tarefa.id, dependeDeId: anteriorId } });
        }
        anteriorId = tarefa.id;
        // Pasta do Drive fica de fora do caminho automático de propósito — criar
        // pasta sozinho, sem ninguém pedir, pra N tarefas de N clientes todo mês
        // seria bem mais chamada à API do Drive acontecendo em silêncio. Quem abrir
        // a tarefa usa o botão "Gerar pasta" (v155) já existente, na hora que quiser.
      }
    }
  }
}

export async function garantirRecorrentesDoMes() {
  const agora = Date.now();
  if (checagemEmAndamento) return checagemEmAndamento;
  if (agora - ultimaChecagem < INTERVALO_MS) return;
  checagemEmAndamento = (async () => {
    await garantirDespesasRecorrentesDoMes();
    await garantirCobrancasMensaisDoMes();
    await garantirRotinasMensaisDoMes();
    ultimaChecagem = Date.now();
  })();
  try { await checagemEmAndamento; } finally { checagemEmAndamento = null; }
}
