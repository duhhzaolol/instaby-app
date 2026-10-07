export type TipoProposta = "mensal" | "pontual";

export type ApresentacaoOrcamento = {
  selo: string;
  titulo: string;
  destaque: string;
  complemento: string;
  descricao: string;
  tipo: TipoProposta;
};

const limites = {
  selo: 80,
  titulo: 160,
  destaque: 200,
  complemento: 100,
  descricao: 1200,
} as const;

export function apresentacaoPadrao(
  nome: string,
  unidades: (string | null)[] = [],
): ApresentacaoOrcamento {
  const unidadesPreenchidas = unidades
    .filter((unidade): unidade is string => typeof unidade === "string" && !!unidade.trim())
    .map((unidade) => unidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
  const mensal = unidadesPreenchidas.length === 0 || unidadesPreenchidas.some((unidade) => /\b(mes|mensal)\b/.test(unidade));

  return {
    selo: "proposta comercial",
    titulo: "gestão estratégica",
    destaque: `pra ${nome}`,
    complemento: "crescer.",
    descricao: "Conteúdo, tráfego e produção trabalhando juntos, com clareza de valor em cada etapa.",
    tipo: mensal ? "mensal" : "pontual",
  };
}

export function validarApresentacaoOrcamento(
  valor: unknown,
): { apresentacao: ApresentacaoOrcamento; erro?: undefined } | { erro: string; apresentacao?: undefined } {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return { erro: "Apresentação inválida." };
  }

  const dados = valor as Record<string, unknown>;
  const campos = Object.keys(limites) as (keyof typeof limites)[];
  if (Object.keys(dados).some((campo) => campo !== "tipo" && !Object.prototype.hasOwnProperty.call(limites, campo))) {
    return { erro: "A apresentação contém campos desconhecidos." };
  }
  if (dados.tipo !== "mensal" && dados.tipo !== "pontual") {
    return { erro: "Selecione uma proposta mensal ou pontual." };
  }

  const textos = {} as Record<keyof typeof limites, string>;
  for (const campo of campos) {
    const texto = dados[campo];
    if (typeof texto !== "string") {
      return { erro: `O campo ${campo} deve ser um texto.` };
    }
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(texto)) {
      return { erro: `O campo ${campo} contém caracteres inválidos.` };
    }
    const normalizado = texto.trim();
    if (normalizado.length > limites[campo]) {
      return { erro: `O campo ${campo} deve ter no máximo ${limites[campo]} caracteres.` };
    }
    textos[campo] = normalizado;
  }
  if (!textos.titulo) {
    return { erro: "Preencha o título da proposta." };
  }

  return { apresentacao: { ...textos, tipo: dados.tipo } };
}

export function obterApresentacaoOrcamento(
  valor: unknown,
  nome: string,
  unidades: (string | null)[] = [],
): ApresentacaoOrcamento {
  const validacao = validarApresentacaoOrcamento(valor);
  return validacao.apresentacao ?? apresentacaoPadrao(nome, unidades);
}
