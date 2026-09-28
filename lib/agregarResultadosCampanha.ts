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
};

// Soma sem duplicar exportações "mês corrido": o fluxo real é exportar sempre a partir
// do dia 1 do mês, com data final crescente (1–10, depois 1–20, depois 1–30...) — cada
// exportação nova já inclui as anteriores, então somar todas infla o total. Agrupa por
// mês do início; se o grupo inteiro compartilha o mesmo início, é esse caso — conta só a
// entrada mais recente (maior fim). Se os inícios diferem dentro do mesmo grupo (ex:
// exportação dia a dia, ou lançamentos manuais de períodos pontuais), são períodos de
// fato distintos — soma todos normalmente.
export function agruparPorMes<T extends ResultadoParaAgregar>(lista: T[]): T[] {
  const porMes = new Map<string, T[]>();
  for (const r of lista) {
    const d = new Date(r.inicio);
    const chave = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    const grupo = porMes.get(chave);
    if (grupo) grupo.push(r);
    else porMes.set(chave, [r]);
  }

  const contados: T[] = [];
  for (const grupo of Array.from(porMes.values())) {
    const iniciosUnicos = new Set(grupo.map((r) => new Date(r.inicio).getTime()));
    if (grupo.length > 1 && iniciosUnicos.size === 1) {
      contados.push(grupo.reduce((a, b) => (new Date(b.fim) > new Date(a.fim) ? b : a)));
    } else {
      contados.push(...grupo);
    }
  }
  return contados;
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
  const custoPorResultado = totalResultados > 0 ? totalInvestido / totalResultados : null;
  const totalPlanosFechados = contados.reduce((s, r) => s + (r.planosFechados || 0), 0);
  const totalRetorno = contados.reduce((s, r) => s + (r.valorRetorno ? Number(r.valorRetorno) : 0), 0);
  const roi = totalInvestido > 0 && totalRetorno > 0 ? totalRetorno / totalInvestido : null;
  return { totalInvestido, totalResultados, totalImpressoes, totalAlcance, custoPorResultado, totalPlanosFechados, totalRetorno, roi };
}
