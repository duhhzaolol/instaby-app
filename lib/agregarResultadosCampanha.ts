// Agregação de ResultadoCampanha — extraído do componente ResultadosCampanha.tsx
// (redesign v144, Parte 2) pra poder ser usado tanto lá (client, por campanha,
// sob demanda) quanto no Início do gestor de tráfego (server, somando várias
// campanhas de uma vez). Mesma conta nos dois lugares de propósito — números
// diferentes em telas diferentes pareceriam bug.
export type ResultadoParaAgregar = {
  inicio: Date | string;
  fim: Date | string;
  verbaInvestida: number | null;
  impressoes: number | null;
  alcance: number | null;
  cliques?: number | null;
  resultados: number | null;
  planosFechados: number | null;
  valorRetorno: number | null;
  campanhaId?: string;
  origem?: string;
  createdAt?: Date | string;
  indicadorResultado?: string | null;
};

export function ehAcumuladoMensal(r: ResultadoParaAgregar) {
  const inicio = new Date(r.inicio);
  const fim = new Date(r.fim);
  return inicio.getUTCDate() === 1 && inicio.getUTCFullYear() === fim.getUTCFullYear()
    && inicio.getUTCMonth() === fim.getUTCMonth();
}

// Cada campanha/mês usa o acumulado mensal com maior data final, e a última
// correção em empate. Registros diários ou antigos que se sobrepõem a ele ficam
// apenas no histórico. Períodos sem sobreposição continuam sendo somados.
export function agruparPorMes<T extends ResultadoParaAgregar>(lista: T[]): T[] {
  const porCampanha = new Map<string, T[]>();
  for (const r of lista) {
    const chave = r.campanhaId || "campanha";
    const grupo = porCampanha.get(chave);
    if (grupo) grupo.push(r);
    else porCampanha.set(chave, [r]);
  }

  const contados: T[] = [];
  for (const grupo of Array.from(porCampanha.values())) {
    const escolhidos: T[] = [];
    const ordenados = [...grupo].sort((a, b) => {
      const prioridade = Number(ehAcumuladoMensal(b)) - Number(ehAcumuladoMensal(a));
      if (prioridade) return prioridade;
      const fim = new Date(b.fim).getTime() - new Date(a.fim).getTime();
      if (fim) return fim;
      const duracaoA = new Date(a.fim).getTime() - new Date(a.inicio).getTime();
      const duracaoB = new Date(b.fim).getTime() - new Date(b.inicio).getTime();
      return duracaoB - duracaoA || new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    for (const r of ordenados) {
      const sobreposto = escolhidos.some((e) => {
        const fim = new Date(e.fim);
        // Um acumulado mensal já é a fonte daquele mês inteiro. Não juntar
        // lançamentos diários soltos com um marco de 1–10 ou de 1–20.
        const limite = ehAcumuladoMensal(e) ? new Date(Date.UTC(fim.getUTCFullYear(), fim.getUTCMonth() + 1, 0, 23, 59, 59, 999)) : fim;
        return new Date(r.inicio) <= limite && new Date(r.fim) >= new Date(e.inicio);
      });
      if (!sobreposto) escolhidos.push(r);
    }
    contados.push(...escolhidos);
  }
  return contados;
}

// Um marco por data final. Reimportações corrigem o mesmo marco; importar um
// relatório mais antigo depois não altera o acumulado mais recente do mês.
export function marcosAcumuladosMensais<T extends ResultadoParaAgregar>(lista: T[]): T[] {
  const porData = new Map<string, T>();
  for (const r of lista.filter(ehAcumuladoMensal)) {
    const chave = new Date(r.fim).toISOString().slice(0, 10);
    const anterior = porData.get(chave);
    if (!anterior || new Date(r.createdAt || 0) >= new Date(anterior.createdAt || 0)) porData.set(chave, r);
  }
  return Array.from(porData.values()).sort((a, b) => new Date(a.fim).getTime() - new Date(b.fim).getTime());
}

export type TotaisResultados = {
  totalInvestido: number;
  totalResultados: number;
  totalImpressoes: number;
  totalAlcance: number;
  custoPorResultado: number | null;
  totalPlanosFechados: number;
  totalRetorno: number;
  roi: number | null; // múltiplo do investido (ex: 5.2 = 5.2x)
  alcanceComparavel: boolean;
  resultadosComparaveis: boolean;
};

// Ritmo de gasto da verba mensal de uma campanha (Início do gestor de tráfego,
// redesign v144, Parte 2): compara o que já foi investido nesse mês (deduplicado)
// contra o que "deveria" ter sido investido até hoje, proporcional aos dias já
// passados — pra campanha que começou no meio do mês, conta só a partir do início
// dela, não do dia 1. Devolve null se não dá pra calcular (verba zerada).
export function calcularRitmoVerba(params: {
  verbaMensal: number;
  investidoNoMes: number;
  dataInicioCampanha: Date;
  hoje?: Date;
}): number | null {
  const { verbaMensal, investidoNoMes, dataInicioCampanha } = params;
  if (verbaMensal <= 0) return null;
  const hoje = params.hoje || new Date();

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const inicioContagem = dataInicioCampanha > inicioMes ? dataInicioCampanha : inicioMes;

  const diasTotalPeriodo = diasNoMes - inicioContagem.getDate() + 1;
  if (diasTotalPeriodo <= 0) return null; // campanha começa só no futuro

  const diasDecorridos = Math.min(
    diasTotalPeriodo,
    Math.floor((hoje.getTime() - inicioContagem.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  if (diasDecorridos <= 0) return null;

  const esperadoAteHoje = verbaMensal * (diasDecorridos / diasTotalPeriodo);
  if (esperadoAteHoje <= 0) return null;
  return investidoNoMes / esperadoAteHoje;
}

export function totalizarResultados(lista: ResultadoParaAgregar[]): TotaisResultados {
  const contados = agruparPorMes(lista);
  const totalInvestido = contados.reduce((s, r) => s + (r.verbaInvestida ? Number(r.verbaInvestida) : 0), 0);
  const totalResultados = contados.reduce((s, r) => s + (r.resultados || 0), 0);
  const totalImpressoes = contados.reduce((s, r) => s + (r.impressoes || 0), 0);
  const totalAlcance = contados.reduce((s, r) => s + (r.alcance || 0), 0);
  // Alcance é de pessoas únicas no período; somar dias/campanhas não produz um
  // alcance único. Resultados de tipos diferentes também não têm custo comum.
  const alcanceComparavel = contados.length === 1 && contados[0].alcance != null;
  const indicadores = new Set(contados.filter((r) => r.resultados != null).map((r) => r.indicadorResultado || "não informado"));
  const resultadosComparaveis = indicadores.size <= 1;
  const custoPorResultado = totalResultados > 0 && resultadosComparaveis ? totalInvestido / totalResultados : null;
  const totalPlanosFechados = contados.reduce((s, r) => s + (r.planosFechados || 0), 0);
  const totalRetorno = contados.reduce((s, r) => s + (r.valorRetorno ? Number(r.valorRetorno) : 0), 0);
  const roi = totalInvestido > 0 && totalRetorno > 0 ? totalRetorno / totalInvestido : null;
  return { totalInvestido, totalResultados, totalImpressoes, totalAlcance, custoPorResultado, totalPlanosFechados, totalRetorno, roi, alcanceComparavel, resultadosComparaveis };
}
