export type FormatoPauta = "Reel" | "Carrossel" | "Outro";
export type ComentarioPautaPublico = {
  id: string; autor: string; texto: string; origem: string; createdAt: string;
};
export type PautaPublica = {
  id: string; titulo: string; formato: string; dataPrevista: string;
  textoCliente: string; comentarios: ComentarioPautaPublico[];
};

export function formatoDaPauta(titulo: string, categoria: string | null): FormatoPauta {
  if (/carrossel|carrocel/i.test(titulo) || categoria === "arte") return "Carrossel";
  if (/\breel\b/i.test(titulo) || categoria === "reel") return "Reel";
  return "Outro";
}

export function tituloDaPauta(titulo: string) {
  return titulo.replace(/^\s*\d+\s*[—–-]\s*(?:Reel|Carrossel|Carrocel)\s*[—–-]\s*/i, "");
}

// Só sugere o trecho identificado como roteiro. A descrição interna inteira
// nunca é publicada automaticamente; a equipe confere o texto na prévia.
export function sugestaoRoteiro(descricao: string | null) {
  if (!descricao) return "";
  const inicio = /(?:^|\n)\s*(?:\d+[.)]\s*)?(?:Roteiro(?:\s+de\s+exemplo)?|Exemplo\s+de\s+roteiro|Falas(?:\s+de\s+exemplo)?)\s*[:—–-]/i.exec(descricao);
  if (!inicio) return "";
  const restante = descricao.slice(inicio.index + inicio[0].length).trim();
  return restante.split(/\n\s*(?:Produção|Observações internas|Checklist|Aprovação|Prazo de produção)\s*[:—–-]/i)[0].trim();
}

export function dataPauta(data: string) {
  return new Date(`${data.slice(0, 10)}T12:00:00-03:00`).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long",
  });
}

export function nomeMesCronograma(mes: string) {
  return new Date(`${mes}-15T12:00:00-03:00`).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo", month: "long", year: "numeric",
  });
}
