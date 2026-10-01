// Algumas falhas da hospedagem devolvem HTML em vez de JSON. Todas as saídas,
// inclusive rede e prazo esgotado, precisam liberar o estado de carregamento.
export async function requisicaoImportacaoMeta<T>(
  endpoint: string,
  corpo: unknown,
  tempoLimite = 75000
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), tempoLimite);
  const confirmacao = endpoint.endsWith("/confirmar");
  const mensagem = confirmacao
    ? "Não recebi a confirmação da importação. Confira o Histórico de importações antes de tentar novamente, pois ela pode ter sido salva."
    : "Não foi possível carregar a prévia. Confira a conexão e tente novamente.";
  try {
    const resp = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo), signal: controller.signal,
    });
    const json: unknown = await resp.json();
    if (!json || typeof json !== "object") throw new Error(mensagem);
    return { resp, json: json as T & { erro?: string } };
  } catch {
    throw new Error(controller.signal.aborted ? `A resposta demorou demais. ${mensagem}` : mensagem);
  } finally {
    clearTimeout(timer);
  }
}
