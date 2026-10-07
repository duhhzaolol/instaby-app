import type { ApresentacaoOrcamento } from "@/lib/apresentacaoOrcamento";

export type DadosPdfOrcamento = {
  codigo: string;
  criadoEm: string;
  validoAte: string;
  status: string;
  aceitoEm: string | null;
  clienteNome: string;
  apresentacao: ApresentacaoOrcamento;
  whatsappAgencia: string | null;
  urlPublica: string;
  personalizado: boolean;
  itens: Array<{
    id: string;
    nome: string;
    descricao: string;
    unidade: string | null;
    quantidade: number;
    totalCentavos: number;
  }>;
};

export type ItemSalvoPdfOrcamento = {
  id: string;
  nomeServico: string | null;
  descricaoServico: string | null;
  quantidade: number;
  valor: number;
  servico: { nome: string; descricao: string; unidade: string | null };
};

export type ItemSelecaoPdfOrcamento = { id: string; quantidade: number };

// A seleção pública altera somente a simulação deste documento, nunca o banco.
export const LIMITE_QUANTIDADE_PDF_ORCAMENTO = 10_000;

export class ErroSelecaoPdfOrcamento extends Error {
  constructor(message: string, public readonly status: 400 | 409 = 400) {
    super(message);
    this.name = "ErroSelecaoPdfOrcamento";
  }
}

const dataBrasilia = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatarDataDocumentoOrcamento(data: Date): string {
  return dataBrasilia.format(data);
}

export function obterMetadadosOrcamento(id: string, createdAt: Date) {
  const partes = dataBrasilia.formatToParts(createdAt);
  const obterParte = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)!.value);
  const ano = obterParte("year");
  // Somar dias do calendário local evita depender do fuso do servidor.
  const validade = new Date(Date.UTC(ano, obterParte("month") - 1, obterParte("day") + 15, 12));

  return {
    codigo: `PC-${ano}-${id.slice(0, 3).toUpperCase()}`,
    criadoEm: formatarDataDocumentoOrcamento(createdAt),
    validoAte: formatarDataDocumentoOrcamento(validade),
  };
}

function objetoSimples(valor: unknown): valor is Record<string, unknown> {
  return !!valor && typeof valor === "object" && !Array.isArray(valor);
}

export function validarSelecaoPdfOrcamento(
  body: unknown,
  itensSalvos: ReadonlyArray<Pick<ItemSalvoPdfOrcamento, "id" | "quantidade">>,
  status: string,
): { itens: ItemSelecaoPdfOrcamento[]; personalizado: boolean } {
  if (!objetoSimples(body) || Object.keys(body).length !== 1 || !Array.isArray(body.itens)) {
    throw new ErroSelecaoPdfOrcamento("Envie apenas os itens e suas quantidades.");
  }
  if (body.itens.length !== itensSalvos.length || body.itens.length === 0) {
    throw new ErroSelecaoPdfOrcamento("Envie a seleção completa desta proposta, incluindo os itens removidos.");
  }

  const conhecidos = new Map(itensSalvos.map((item) => [item.id, item.quantidade]));
  const recebidos = new Set<string>();
  const itens: ItemSelecaoPdfOrcamento[] = [];
  let personalizado = false;

  for (const item of body.itens) {
    if (!objetoSimples(item) || Object.keys(item).length !== 2 ||
      !Object.prototype.hasOwnProperty.call(item, "id") ||
      !Object.prototype.hasOwnProperty.call(item, "quantidade") ||
      typeof item.id !== "string" || !conhecidos.has(item.id) || recebidos.has(item.id) ||
      typeof item.quantidade !== "number" || !Number.isSafeInteger(item.quantidade) ||
      item.quantidade < 0 || item.quantidade > LIMITE_QUANTIDADE_PDF_ORCAMENTO) {
      throw new ErroSelecaoPdfOrcamento("Confira os itens e as quantidades da proposta.");
    }
    recebidos.add(item.id);
    personalizado ||= item.quantidade !== conhecidos.get(item.id);
    itens.push({ id: item.id, quantidade: item.quantidade });
  }

  if (!itens.some((item) => item.quantidade > 0)) {
    throw new ErroSelecaoPdfOrcamento("Selecione pelo menos um serviço para baixar o PDF.");
  }
  if ((status === "aceito" || status === "recusado") && personalizado) {
    throw new ErroSelecaoPdfOrcamento("Esta proposta já foi concluída. Baixe o PDF com os itens registrados.", 409);
  }

  return { itens, personalizado };
}

export function calcularItensPdfOrcamento(
  itensSalvos: ReadonlyArray<ItemSalvoPdfOrcamento>,
  selecao?: ReadonlyArray<ItemSelecaoPdfOrcamento>,
): DadosPdfOrcamento["itens"] {
  const quantidades = selecao ? new Map(selecao.map((item) => [item.id, item.quantidade])) : null;
  let totalDocumento = 0;

  return itensSalvos.flatMap((item) => {
    const quantidade = quantidades ? quantidades.get(item.id) : item.quantidade;
    if (quantidade === undefined || !Number.isSafeInteger(quantidade) || quantidade < 0 ||
      !Number.isSafeInteger(item.quantidade) || item.quantidade < 0 ||
      !Number.isFinite(item.valor) || item.valor < 0) {
      throw new Error("Valores de proposta inválidos.");
    }
    if (quantidade === 0) return [];

    // ItemOrcamento.valor já é o total da linha. O aceite usa esta mesma
    // proporção e arredonda o resultado final da linha, não o valor unitário.
    const unitario = item.quantidade > 0 ? item.valor / item.quantidade : item.valor;
    const totalCentavos = selecao
      ? Math.round(unitario * quantidade * 100)
      : Math.round(item.valor * 100);
    totalDocumento += totalCentavos;
    if (!Number.isSafeInteger(totalCentavos) || !Number.isSafeInteger(totalDocumento)) {
      throw new Error("Valor de proposta fora do limite.");
    }

    return [{
      id: item.id,
      nome: item.nomeServico ?? item.servico.nome,
      descricao: item.descricaoServico ?? item.servico.descricao,
      unidade: item.servico.unidade,
      quantidade,
      totalCentavos,
    }];
  });
}

export function obterUrlPublicaOrcamento(
  slug: string,
  base: string | undefined = process.env.NEXTAUTH_URL,
): string {
  const fallback = "https://instaby-app.vercel.app";
  let origem = fallback;
  if (base) {
    try {
      const url = new URL(base);
      const local = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
      if (!url.username && !url.password && (url.protocol === "https:" || (local && url.protocol === "http:"))) {
        origem = url.origin;
      }
    } catch {
      // Uma configuração inválida nunca deve criar um link arbitrário no PDF.
    }
  }
  return `${origem}/orcamento/${encodeURIComponent(slug)}`;
}
