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
  // Colunas novas (v151, módulo de Tráfego Pago completo) — todas opcionais porque o
  // export de hoje do Meta não traz todas; ver ImportarCampanhasMeta pro aviso de quais
  // colunas incluir nas próximas exportações.
  idExterno: string | null; // "ID da campanha" — não vem no export padrão; se vier, é a identidade mais confiável
  configAtribuicao: string | null; // usada junto do nome pra formar a chave de correspondência quando não há ID
  custoPorResultado: number | null;
  orcamentoConjunto: number | null;
  tipoOrcamento: string | null; // "Diário" | "Usando o orçamento do conjunto de anúncios" etc.
  termino: string | null; // yyyy-mm-dd — data em que o Meta encerrou a veiculação, se aplicável
};

export type ResultadoImportacaoMeta = {
  linhas: LinhaCampanhaMeta[];
  linhasIgnoradas: number;
  colunasReconhecidas: string[];
  diaADia: boolean; // true se cada linha cobre um único dia (inicio === fim) — import idempotente de verdade
  temIdExterno: boolean; // true se o arquivo trouxe uma coluna de ID de campanha reconhecível
  // true quando o próprio Meta reportou não ter nenhuma campanha nesse período (o
  // arquivo vem com uma única linha de texto "No data available.") — pra dar um aviso
  // específico em vez do genérico "não reconheci esse arquivo" (ver montarPrevia).
  semDadosNoPeriodo: boolean;
  // Nome da conta de anúncios (spec §1: "mostre cliente, CONTA, período...") — é um
  // valor por ARQUIVO, não por linha (o export do Meta é sempre de uma conta só), por
  // isso não mora em LinhaCampanhaMeta. Só vem preenchido quando o arquivo traz essa
  // coluna reconhecível; senão fica null e a prévia não mostra nada errado, só omite.
  contaAnuncios: string | null;
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
  idExterno: ["id da campanha", "identificacao da campanha", "campaign id", "campaign name and id", "nome da campanha e id"],
  configAtribuicao: ["configuracao de atribuicao", "configuração de atribuição", "attribution setting"],
  custoPorResultado: ["custo por resultados", "cost per result", "custo por resultado"],
  orcamentoConjunto: ["orcamento do conjunto de anuncios", "orçamento do conjunto de anúncios", "ad set budget"],
  tipoOrcamento: [
    "tipo de orcamento do conjunto de anuncios",
    "tipo de orçamento do conjunto de anúncios",
    "ad set budget type",
  ],
  termino: ["termino", "término", "ended", "end date"],
  contaAnuncios: ["nome da conta", "conta de anuncios", "conta de anúncios", "account name", "account", "conta"],
};

export function normalizar(texto: string) {
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

export function numeroSeguro(valor: any): number {
  if (valor === null || valor === undefined || valor === "") return 0;
  let texto = String(valor).trim();
  if (texto === "") return 0;
  // Esse relatório de campanhas do Meta vem em formato internacional — ponto é decimal,
  // sem separador de milhar (ex: "10.19", "0.16119048") — diferente do relatório antigo
  // de redes sociais (lib/parseRelatorioAds.ts), que usa vírgula decimal. Só tratamos
  // ponto como separador de milhar quando também aparece vírgula (aí sim é formato BR,
  // tipo "1.234,56"); senão o ponto fica como decimal mesmo.
  if (texto.includes(",")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  }
  const limpo = texto.replace(/[^\d.-]/g, "");
  const n = parseFloat(limpo);
  return isNaN(n) ? 0 : n;
}

// Uma métrica vazia no export não significa zero. Aceita os mesmos formatos
// numéricos do relatório (decimal com ponto ou vírgula e milhar BR), preservando
// o zero explícito e deixando ausências ou textos inválidos como não informados.
export function numeroOpcionalSeguro(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  const formatoValido = texto.includes(",")
    ? /^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+),\d+$/.test(texto)
    : /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(texto);
  if (!formatoValido) return null;
  const numero = numeroSeguro(texto);
  return Number.isFinite(numero) ? numero : null;
}

function inteiroOpcionalSeguro(valor: unknown): number | null {
  const numero = numeroOpcionalSeguro(valor);
  return numero === null ? null : Math.round(numero);
}

export function dataSegura(valor: any): string | null {
  if (!valor) return null;
  const texto = String(valor).trim();
  // formato já vem como yyyy-mm-dd no export do Meta
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
  const d = new Date(texto);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-CA");
}

// Núcleo puro de reconhecimento de colunas + montagem das linhas — recebe as linhas já
// como objetos (o que tanto o Papa.parse quanto o XLSX.utils.sheet_to_json produzem) e
// funciona igual no navegador (ImportarCampanhasMeta.tsx, pra prévia instantânea antes
// de mandar pro servidor) e no servidor (lib/importacaoMeta.ts, autoridade final —
// nunca confia em números computados pelo cliente).
export function processarLinhasBrutas(
  linhasBrutas: Record<string, any>[],
  cabecalhosDeclarados?: string[]
): ResultadoImportacaoMeta | null {
  if (linhasBrutas.length === 0) return null;

  // Preferimos a lista de cabeçalhos DECLARADA pelo próprio arquivo (Papa.parse `meta.fields`
  // ou a primeira linha real do XLSX) em vez de `Object.keys(linhasBrutas[0])`: quando a
  // primeira linha de dados é curta/malformada (ex: o Meta manda uma única linha de texto
  // "No data available." quando não há campanhas no período), o objeto resultante tem menos
  // chaves que o cabeçalho real, e a detecção de colunas quebrava silenciosamente.
  const cabecalhos = cabecalhosDeclarados && cabecalhosDeclarados.length > 0 ? cabecalhosDeclarados : Object.keys(linhasBrutas[0]);
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

    const custoPorResultado = colunas.custoPorResultado ? numeroSeguro(linha[colunas.custoPorResultado]) : null;
    const orcamentoConjunto = colunas.orcamentoConjunto ? numeroSeguro(linha[colunas.orcamentoConjunto]) : null;
    const idExternoBruto = colunas.idExterno ? String(linha[colunas.idExterno] || "").trim() : "";

    linhas.push({
      nome,
      status,
      inicio,
      fim,
      resultados: colunas.resultados ? inteiroOpcionalSeguro(linha[colunas.resultados]) : null,
      indicadorResultado: colunas.indicadorResultado ? String(linha[colunas.indicadorResultado] || "").trim() || null : null,
      valorGasto: colunas.valorGasto ? numeroSeguro(linha[colunas.valorGasto]) : 0,
      impressoes: colunas.impressoes ? inteiroOpcionalSeguro(linha[colunas.impressoes]) : null,
      alcance: colunas.alcance ? inteiroOpcionalSeguro(linha[colunas.alcance]) : null,
      idExterno: idExternoBruto || null,
      configAtribuicao: colunas.configAtribuicao ? String(linha[colunas.configAtribuicao] || "").trim() || null : null,
      custoPorResultado: custoPorResultado && custoPorResultado > 0 ? custoPorResultado : null,
      orcamentoConjunto: orcamentoConjunto && orcamentoConjunto > 0 ? orcamentoConjunto : null,
      tipoOrcamento: colunas.tipoOrcamento ? String(linha[colunas.tipoOrcamento] || "").trim() || null : null,
      termino: colunas.termino ? dataSegura(linha[colunas.termino]) : null,
    });
  }

  const diaADia = linhas.length > 0 && linhas.every((l) => l.inicio === l.fim);
  const temIdExterno = !!colunas.idExterno && linhas.some((l) => !!l.idExterno);

  // Conta de anúncios: um valor só pro arquivo inteiro (não por linha) — pega o primeiro
  // não vazio. Um export do Meta pode, em tese, misturar contas na mesma planilha; como
  // isso é só informativo na prévia/histórico (nunca decide nada sozinho), não vale a
  // pena tratar esse caso raro como erro — só mostramos a primeira que aparecer.
  let contaAnuncios: string | null = null;
  if (colunas.contaAnuncios) {
    for (const linha of linhasBrutas) {
      const valor = String(linha[colunas.contaAnuncios] || "").trim();
      if (valor) {
        contaAnuncios = valor;
        break;
      }
    }
  }

  // O Meta não manda um arquivo vazio quando não há campanhas no período — ele manda uma
  // única linha com o texto "No data available." numa célula só. Detectamos isso aqui (e não
  // só pelo `linhas.length === 0`) pra poder dar um aviso específico em vez do genérico "não
  // reconheci esse arquivo" (ver montarPrevia em lib/importacaoMeta.ts).
  const semDadosNoPeriodo =
    linhas.length === 0 &&
    linhasBrutas.some((linha) => Object.values(linha).some((v) => String(v || "").toLowerCase().includes("no data available")));

  return {
    linhas,
    linhasIgnoradas: ignoradas,
    colunasReconhecidas: reconhecidas,
    diaADia,
    temIdExterno,
    semDadosNoPeriodo,
    contaAnuncios,
  };
}

// Entrada a partir de texto CSV bruto — funciona no navegador e no servidor (Papa.parse
// não depende da API File, só de string).
export function processarTextoCsv(texto: string): ResultadoImportacaoMeta | null {
  const resultado = Papa.parse<Record<string, any>>(texto, { header: true, skipEmptyLines: true });
  return processarLinhasBrutas(resultado.data, resultado.meta.fields || undefined);
}

// Extrai a linha de cabeçalho "crua" de uma aba XLSX (a primeira linha da planilha, célula
// por célula) — usamos isso em vez de `Object.keys()` da primeira linha de dados pelo mesmo
// motivo do CSV: a primeira linha de dados pode ter menos células que o cabeçalho real.
function cabecalhosDaAbaXlsx(aba: XLSX.WorkSheet): string[] | undefined {
  const primeiraLinha = XLSX.utils.sheet_to_json<any[]>(aba, { header: 1, defval: "" })[0] as any[] | undefined;
  if (!primeiraLinha) return undefined;
  return primeiraLinha.map((c) => String(c ?? "").trim());
}

// Entrada a partir de um buffer XLSX bruto (ArrayBuffer ou Buffer do Node) — usada só
// no servidor, já que o navegador já lê o arquivo como texto/arrayBuffer sozinho.
export function processarBufferXlsx(buffer: ArrayBuffer | Buffer): ResultadoImportacaoMeta | null {
  const planilha = XLSX.read(buffer, { type: "buffer" });
  const primeiraAba = planilha.Sheets[planilha.SheetNames[0]];
  const linhasBrutas = XLSX.utils.sheet_to_json<Record<string, any>>(primeiraAba, { defval: "" });
  return processarLinhasBrutas(linhasBrutas, cabecalhosDaAbaXlsx(primeiraAba));
}

async function linhasEcabecalhosDoArquivo(
  arquivo: File
): Promise<{ linhas: Record<string, any>[]; cabecalhos?: string[] }> {
  const nome = arquivo.name.toLowerCase();

  if (nome.endsWith(".csv")) {
    const texto = await arquivo.text();
    const resultado = Papa.parse<Record<string, any>>(texto, { header: true, skipEmptyLines: true });
    return { linhas: resultado.data, cabecalhos: resultado.meta.fields || undefined };
  }

  const buffer = await arquivo.arrayBuffer();
  const planilha = XLSX.read(buffer, { type: "array" });
  const primeiraAba = planilha.Sheets[planilha.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<Record<string, any>>(primeiraAba, { defval: "" });
  return { linhas, cabecalhos: cabecalhosDaAbaXlsx(primeiraAba) };
}

export async function importarCampanhasMeta(arquivo: File): Promise<ResultadoImportacaoMeta | null> {
  const { linhas, cabecalhos } = await linhasEcabecalhosDoArquivo(arquivo);
  return processarLinhasBrutas(linhas, cabecalhos);
}
