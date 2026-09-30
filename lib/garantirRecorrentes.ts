import { prisma } from "@/lib/prisma";
import { montarCicloDeTarefas } from "@/lib/templatesTarefas";

// Evita rodar a checagem de recorrentes em toda navegação (isso rodava só na página
// Financeiro antes, e ficou pesado quando movido pro layout do dashboard). Com esse
// cache em memória, a checagem de verdade só roda de novo a cada 10 minutos por
// instância do servidor — nas outras requisições, é só um "if" e segue o jogo.
let ultimaChecagem = 0;
const INTERVALO_MS = 10 * 60 * 1000;

/**
 * Garante que toda despesa marcada como recorrente tenha uma cópia lançada
 * no mês atual (nasce sempre "pendente" — só vira "pago" quando for baixada de verdade).
 */
export async function garantirDespesasRecorrentesDoMes() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const modelos = await prisma.despesa.findMany({ where: { recorrente: true } });

  for (const modelo of modelos) {
    const jaExisteEsseMes = await prisma.despesa.findFirst({
      where: {
        data: { gte: inicioMes },
        OR: [{ id: modelo.id }, { origemRecorrenteId: modelo.id }],
      },
    });

    if (!jaExisteEsseMes) {
      const diaVencimento = modelo.data.getDate();
      const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), Math.min(diaVencimento, 28));

      await prisma.despesa.create({
        data: {
          descricao: modelo.descricao,
          valor: modelo.valor,
          tipo: modelo.tipo,
          categoriaFinanceira: modelo.categoriaFinanceira,
          categoria: modelo.categoria,
          subcategoria: modelo.subcategoria,
          clienteId: modelo.clienteId,
          recorrente: false,
          origemRecorrenteId: modelo.id,
          status: "pendente",
          vencimento,
          data: inicioMes,
        },
      });
    }
  }
}

/**
 * Garante que todo cliente ativo com mensalidade configurada (via serviços contratados)
 * tenha uma Cobrança lançada no mês atual. Sem isso, a mensalidade fica só "configurada"
 * mas nunca vira uma cobrança de verdade — e por isso "Próxima cobrança" ficava vazio
 * mesmo em clientes com mensalidade.
 */
export async function garantirCobrancasMensaisDoMes() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const diaVencimentoPadrao = 5;
  const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimentoPadrao);

  const clientesAtivos = await prisma.cliente.findMany({
    where: { status: "ativo" },
    include: { servicosContratados: { where: { ativo: true } } },
  });

  for (const cliente of clientesAtivos) {
    const somaServicos = cliente.servicosContratados.reduce((soma, sc) => soma + Number(sc.valor), 0);
    const mensalidade = Math.max(0, somaServicos - Number(cliente.descontoMensal) + Number(cliente.acrescimoMensal));

    if (mensalidade <= 0) continue;

    const jaExisteEsseMes = await prisma.cobranca.findFirst({
      where: {
        clienteId: cliente.id,
        tipo: "recorrente",
        createdAt: { gte: inicioMes },
      },
    });

    if (!jaExisteEsseMes) {
      await prisma.cobranca.create({
        data: {
          clienteId: cliente.id,
          valor: mensalidade,
          tipo: "recorrente",
          categoria: "Mensalidade",
          dataCompetencia: inicioMes,
          vencimento,
          status: "pendente",
        },
      });
    }
  }
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
  if (agora - ultimaChecagem < INTERVALO_MS) return;
  ultimaChecagem = agora;

  await garantirDespesasRecorrentesDoMes();
  await garantirCobrancasMensaisDoMes();
  await garantirRotinasMensaisDoMes();
}
