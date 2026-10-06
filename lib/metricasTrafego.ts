/** Métricas derivadas dos números informados pelo relatório, sem estimar dados ausentes. */
export function custoPorMilImpressoes(gasto: number, impressoes: number | null | undefined): number | null {
  return Number.isFinite(gasto) && impressoes != null && Number.isFinite(impressoes) && impressoes > 0
    ? (gasto / impressoes) * 1000
    : null;
}

/** Frequência só é comparável dentro da mesma campanha e do mesmo período. */
export function frequenciaCampanha(impressoes: number | null | undefined, alcance: number | null | undefined): number | null {
  return impressoes != null && Number.isFinite(impressoes) && alcance != null && Number.isFinite(alcance) && alcance > 0
    ? impressoes / alcance
    : null;
}

export function resumirImpressoes(itens: { impressoes: number | null; gastoAcumuladoArquivo: unknown }[]) {
  const informadas = itens.filter((item) => item.impressoes != null);
  return {
    impressoes: informadas.length ? informadas.reduce((total, item) => total + item.impressoes!, 0) : null,
    // Linhas sem gasto e sem impressões não tornam incompleto o total das campanhas que veicularam.
    impressoesParciais: itens.some((item) => item.impressoes == null && Number(item.gastoAcumuladoArquivo) > 0),
  };
}
