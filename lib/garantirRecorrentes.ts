import { prisma } from "@/lib/prisma";

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

export async function garantirRecorrentesDoMes() {
  const agora = Date.now();
  if (agora - ultimaChecagem < INTERVALO_MS) return;
  ultimaChecagem = agora;

  await garantirDespesasRecorrentesDoMes();
  await garantirCobrancasMensaisDoMes();
}
