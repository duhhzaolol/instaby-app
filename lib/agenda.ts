import { chaveDiaSaoPaulo } from "@/lib/dataHora";
import { publicacaoParaInput } from "@/lib/midiaRevisao";

export type FiltrosAgenda = {
  mes: string;
  cliente?: string;
  tipos?: string;
  status?: string;
  visao?: string;
};

export function linkAgenda(
  filtros: FiltrosAgenda,
  alteracoes: Partial<FiltrosAgenda> & { tarefa?: string } = {},
) {
  const params = new URLSearchParams();
  for (const [nome, valor] of Object.entries({ ...filtros, ...alteracoes })) {
    if (valor !== undefined && (valor !== "" || nome === "tipos"))
      params.set(nome, valor);
  }
  return `/dashboard/agenda?${params.toString()}`;
}

export function periodoAgenda(
  mesPedido: string | undefined,
  hoje = new Date(),
) {
  const match = /^(\d{4})-(\d{1,2})$/.exec(mesPedido || "");
  const mesValido =
    match &&
    Number(match[1]) >= 1900 &&
    Number(match[1]) <= 2100 &&
    Number(match[2]) >= 1 &&
    Number(match[2]) <= 12;
  const mesChave = mesValido
    ? `${match![1]}-${match![2].padStart(2, "0")}`
    : chaveDiaSaoPaulo(hoje).slice(0, 7);
  const [ano, numeroMes] = mesChave.split("-").map(Number);
  const inicio = new Date(Date.UTC(ano, numeroMes - 1, 1));
  const fim = new Date(Date.UTC(ano, numeroMes, 0));
  const inicioGrade = new Date(inicio);
  inicioGrade.setUTCDate(inicioGrade.getUTCDate() - inicioGrade.getUTCDay());
  const fimGrade = new Date(fim);
  fimGrade.setUTCDate(fimGrade.getUTCDate() + 6 - fimGrade.getUTCDay());
  const dias: string[] = [];
  for (
    let d = new Date(inicioGrade);
    d <= fimGrade;
    d.setUTCDate(d.getUTCDate() + 1)
  )
    dias.push(d.toISOString().slice(0, 10));
  const depois = new Date(fimGrade);
  depois.setUTCDate(depois.getUTCDate() + 1);
  return {
    mesChave,
    ano,
    mes: numeroMes - 1,
    dias,
    // Limites em Brasília: inclui todo o último dia, mesmo depois das 21h.
    inicioConsulta: new Date(`${dias[0]}T00:00:00-03:00`),
    fimConsulta: new Date(
      `${depois.toISOString().slice(0, 10)}T00:00:00-03:00`,
    ),
    mesAnterior: new Date(Date.UTC(ano, numeroMes - 2, 1))
      .toISOString()
      .slice(0, 7),
    mesSeguinte: new Date(Date.UTC(ano, numeroMes, 1))
      .toISOString()
      .slice(0, 7),
  };
}

export function camposPrazo(prazo: string | null) {
  const [data = "", hora = ""] = publicacaoParaInput(prazo).split("T");
  return { data, hora: hora === "00:00" ? "" : hora };
}

export function filtrarClientesAgenda<T extends { nome: string }>(
  clientes: T[],
  busca: string,
) {
  const normalizar = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const termo = normalizar(busca.trim());
  return clientes.filter((c) => normalizar(c.nome).includes(termo));
}
