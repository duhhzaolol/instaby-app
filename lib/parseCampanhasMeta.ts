import Papa from "papaparse";
import * as XLSX from "xlsx";

export type LinhaCampanhaMeta = {
  nome: string;
  status: string; // ativa | pausada (mapeado de "Veiculação da campanha")
  inicio: string; // yyyy-mm-dd
  fim: string; // yyyy-mm-dd
  resultados: number | null;
  indicadorResultado: string | null;
  valorGasto: number;
  impressoes: number | null;
  alcance: number | null;
};

export type ResultadoImportacaoMeta = {
  linhas: LinhaCampanhaMeta[];
  linhasIgnoradas: number;
  colunasReconhecidas: string[];
  diaADia: boolean; // true se cada linha cobre um único dia (inicio === fim) — import idempotente de verdade
};

// Nomes de coluna variam um pouco conforme o tipo de relatório/idioma exportado do Meta.
const MAPA_COLUNAS: Record<string, string[]> = {
  inicio: ["inicio dos relatorios", "início dos relatórios", "reporting starts", "dia", "day"],
  fim: ["encerramento dos relatorios", "encerramento dos relatórios", "reporting ends", "dia", "day"],
  nome: ["nome da campanha", "campaign name"],
  status: ["veiculacao da campanha", "veiculação da campanha", "campaign delivery", "status da campanha"],
  resultados: ["resultados", "results"],
  indicadorResultado: ["indicador de resultados", "result indicator", "result type"],
  valorGasto: ["valor gasto (brl)", "valor usado (brl)", "amount spent (brl)", "valor gasto", "amount spent"],
  impressoes: ["impressoes", "impressões", "impressions"],
  alcance: ["alcance", "reach"],
};

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

function dataSegura(valor: any): string | null {
  if (!valor) return null;
  const texto = String(valor).trim();
  // formato já vem como yyyy-mm-dd no export do Meta
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
  const d = new Date(texto);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-CA");
}

async function linhasDoArquivo(arquivo: File): Promise<Record<string, any>[]> {
  const nome = arquivo.name.toLowerCase();

  if (nome.endsWith(".csv")) {
    const texto = await arquivo.text();
    const resultado = Papa.parse<Record<string, any>>(texto, { header: true, skipEmptyLines: true });
    return resultado.data;
  }

  const buffer = await arquivo.arrayBuffer();
  const planilha = XLSX.read(buffer, { type: "array" });
  const primeiraAba = planilha.Sheets[planilha.SheetNames[0]];
  return XLSX.utils.sheet_to_json(primeiraAba, { defval: "" });
}

export async function importarCampanhasMeta(arquivo: File): Promise<ResultadoImportacaoMeta | null> {
  const linhasBrutas = await linhasDoArquivo(arquivo);
  if (linhasBrutas.length === 0) return null;

  const cabecalhos = Object.keys(linhasBrutas[0]);
  const colunas: Partial<Record<string, string>> = {};
  const reconhecidas: string[] = [];

  for (const campo of Object.keys(MAPA_COLUNAS)) {
    const coluna = encontrarColuna(cabecalhos, MAPA_COLUNAS[campo]);
    if (coluna) {
      colunas[campo] = coluna;
      if (!reconhecidas.includes(coluna)) reconhecidas.push(coluna);
    }
  }

  const linhas: LinhaCampanhaMeta[] = [];
  let ignoradas = 0;

  for (const linha of linhasBrutas) {
    const primeiraCelula = String(Object.values(linha)[0] || "").toLowerCase();
    if (primeiraCelula.includes("total")) continue; // linha de total do Meta, não é campanha

    const nome = colunas.nome ? String(linha[colunas.nome] || "").trim() : "";
    const inicio = colunas.inicio ? dataSegura(linha[colunas.inicio]) : null;
    const fim = colunas.fim ? dataSegura(linha[colunas.fim]) : null;

    if (!nome || !inicio || !fim) {
      ignoradas++;
      continue;
    }

    const statusBruto = colunas.status ? normalizar(String(linha[colunas.status] || "")) : "";
    const status = statusBruto.includes("active") || statusBruto.includes("ativ") ? "ativa" : "pausada";

    linhas.push({
      nome,
      status,
      inicio,
      fim,
      resultados: colunas.resultados ? Math.round(numeroSeguro(linha[colunas.resultados])) : null,
      indicadorResultado: colunas.indicadorResultado ? String(linha[colunas.indicadorResultado] || "").trim() || null : null,
      valorGasto: colunas.valorGasto ? numeroSeguro(linha[colunas.valorGasto]) : 0,
      impressoes: colunas.impressoes ? Math.round(numeroSeguro(linha[colunas.impressoes])) : null,
      alcance: colunas.alcance ? Math.round(numeroSeguro(linha[colunas.alcance])) : null,
    });
  }

  const diaADia = linhas.length > 0 && linhas.every((l) => l.inicio === l.fim);

  return { linhas, linhasIgnoradas: ignoradas, colunasReconhecidas: reconhecidas, diaADia };
}
