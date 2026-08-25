import Papa from "papaparse";
import * as XLSX from "xlsx";

export type DadosImportados = {
  investimento: number;
  alcance: number;
  impressoes: number;
  cliques: number;
  leads: number;
  linhasProcessadas: number;
  colunasReconhecidas: string[];
};

// Cada campo aceita várias variações de nome de coluna (PT/EN, com/sem acento),
// porque o Meta Ads exporta com nomes diferentes dependendo do idioma da conta.
const MAPA_COLUNAS: Record<keyof Omit<DadosImportados, "linhasProcessadas" | "colunasReconhecidas">, string[]> = {
  investimento: ["valor usado (brl)", "valor usado", "amount spent (brl)", "amount spent", "gasto"],
  alcance: ["alcance", "reach"],
  impressoes: ["impressoes", "impressões", "impressions"],
  cliques: ["cliques (todos)", "cliques no link", "cliques", "clicks (all)", "link clicks", "clicks"],
  leads: ["resultados", "results", "leads", "conversas por mensagem iniciadas", "cadastros"],
};

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function encontrarColuna(cabecalhos: string[], variantes: string[]) {
  const normalizados = cabecalhos.map(normalizar);
  for (const variante of variantes) {
    const idx = normalizados.indexOf(normalizar(variante));
    if (idx !== -1) return cabecalhos[idx];
  }
  return null;
}

function numeroSeguro(valor: any): number {
  if (valor === null || valor === undefined || valor === "") return 0;
  const limpo = String(valor).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = parseFloat(limpo);
  return isNaN(n) ? 0 : n;
}

async function linhasDoArquivo(arquivo: File): Promise<Record<string, any>[]> {
  const nome = arquivo.name.toLowerCase();

  if (nome.endsWith(".csv")) {
    const texto = await arquivo.text();
    const resultado = Papa.parse<Record<string, any>>(texto, { header: true, skipEmptyLines: true });
    return resultado.data;
  }

  // xlsx/xls
  const buffer = await arquivo.arrayBuffer();
  const planilha = XLSX.read(buffer, { type: "array" });
  const primeiraAba = planilha.Sheets[planilha.SheetNames[0]];
  return XLSX.utils.sheet_to_json(primeiraAba, { defval: "" });
}

export async function importarRelatorioAds(arquivo: File): Promise<DadosImportados | null> {
  const linhas = await linhasDoArquivo(arquivo);
  if (linhas.length === 0) return null;

  const cabecalhos = Object.keys(linhas[0]);
  const colunas: Partial<Record<string, string>> = {};
  const reconhecidas: string[] = [];

  for (const campo of Object.keys(MAPA_COLUNAS) as (keyof typeof MAPA_COLUNAS)[]) {
    const coluna = encontrarColuna(cabecalhos, MAPA_COLUNAS[campo]);
    if (coluna) {
      colunas[campo] = coluna;
      reconhecidas.push(coluna);
    }
  }

  const soma = { investimento: 0, alcance: 0, impressoes: 0, cliques: 0, leads: 0 };

  linhas.forEach((linha) => {
    // pula a linha de "Total" que o Meta Ads às vezes inclui, pra não somar em dobro
    const primeiraCelula = String(Object.values(linha)[0] || "").toLowerCase();
    if (primeiraCelula.includes("total")) return;

    (Object.keys(soma) as (keyof typeof soma)[]).forEach((campo) => {
      const coluna = colunas[campo];
      if (coluna) soma[campo] += numeroSeguro(linha[coluna]);
    });
  });

  return { ...soma, linhasProcessadas: linhas.length, colunasReconhecidas: reconhecidas };
}
