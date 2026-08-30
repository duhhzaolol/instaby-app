export type CategoriaFinanceira =
  | "custo"
  | "despesa_fixa"
  | "despesa_variavel"
  | "despesa_financeira"
  | "imposto"
  | "investimento"
  | "transferencia";

export const CATEGORIAS_FINANCEIRAS: {
  valor: CategoriaFinanceira;
  label: string;
  cor: string;
  sugestoes: string[];
  contaComoDespesa: boolean; // false só pra transferência/retirada — não entra no lucro
}[] = [
  {
    valor: "custo",
    label: "Custo direto",
    cor: "#A855F7",
    sugestoes: ["Material utilizado no serviço", "Terceiros", "Freelancers", "Comissões"],
    contaComoDespesa: true,
  },
  {
    valor: "despesa_fixa",
    label: "Despesa fixa",
    cor: "#F97316",
    sugestoes: [
      "Aluguel", "Internet", "Energia", "Água", "Celular",
      "Contabilidade", "Softwares", "Salários", "Pró-labore", "Seguros",
    ],
    contaComoDespesa: true,
  },
  {
    valor: "despesa_variavel",
    label: "Despesa variável",
    cor: "#E63946",
    sugestoes: [
      "Alimentação", "Transporte", "Marketing", "Manutenção",
      "Material de escritório", "Compras eventuais", "Outras despesas",
    ],
    contaComoDespesa: true,
  },
  {
    valor: "despesa_financeira",
    label: "Despesa financeira",
    cor: "#EF4444",
    sugestoes: ["Tarifas bancárias", "Juros", "Multas", "Taxas"],
    contaComoDespesa: true,
  },
  {
    valor: "imposto",
    label: "Imposto",
    cor: "#6B7280",
    sugestoes: ["Impostos sobre vendas", "Outros impostos"],
    contaComoDespesa: true,
  },
  {
    valor: "investimento",
    label: "Investimento / Ativo",
    cor: "#06B6D4",
    sugestoes: ["Computador", "Câmera", "HD/SSD", "Móveis", "Equipamentos", "Outros ativos"],
    contaComoDespesa: true,
  },
  {
    valor: "transferencia",
    label: "Retirada / Transferência",
    cor: "#9CA3AF",
    sugestoes: ["Retirada pessoal", "Distribuição de lucros"],
    contaComoDespesa: false,
  },
];

export const CATEGORIAS_RECEITA = ["Serviços", "Produtos", "Mensalidades", "Recorrências", "Outras receitas"];

export function visualDaCategoriaFinanceira(valor: string | null | undefined) {
  return CATEGORIAS_FINANCEIRAS.find((c) => c.valor === valor) || null;
}
