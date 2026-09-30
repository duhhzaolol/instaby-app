import { getUsuarioAtual, permissoesDe } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import {
  proximasSemanas,
  capacidadeDaSemana,
  trabalhoPrevistoDaSemana,
  tarefasSemEstimativaNaSemana,
  conflitosDeAusencia,
  nivelDaSemana,
} from "@/lib/capacidade";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import { CapacidadeEquipe } from "@/components/dashboard/CapacidadeEquipe";

// Tipos explícitos pro retorno do Prisma (ver nota em lib/prisma.ts: o cliente
// gerado neste sandbox fica genérico sem "prisma generate", o que faz .map()/
// .filter() encadeado direto no resultado perder o tipo do parâmetro — anotando
// aqui evita isso, sem afetar o app rodando com o cliente de verdade).
type PessoaRaw = { id: string; nome: string; fotoUrl: string | null; cargaHorariaSemanal: number };
type AusenciaRaw = {
  id: string;
  usuarioId: string;
  tipo: string;
  inicio: Date;
  fim: Date;
  diaInteiro: boolean;
  horasPorDia: number | null;
  descricao: string | null;
};
type TarefaRaw = {
  id: string;
  titulo: string;
  prazo: Date | null;
  status: string;
  estimativaHoras: number | null;
  responsavelId: string | null;
};

// "Comparar trabalho previsto com capacidade disponível por semana" +
// "alertar sobre sobrecarga e conflitos" (Etapa 4 v158). Permissão: QUALQUER
// pessoa logada vê a PRÓPRIA capacidade (autoatendimento — não é financeiro,
// contrato nem honorário, então Editor/Gestor de Tráfego enxergam a própria
// linha normalmente); gerenciarEquipe também vê a equipe inteira, porque é
// quem monta a escala/planejamento (decisão reversível, documentada no README).
export default async function CapacidadePage() {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return null;

  const podeVerEquipe = permissoesDe(usuarioAtual).gerenciarEquipe;

  const pessoas: PessoaRaw[] = await prisma.usuario.findMany({
    where: { ativo: true, ...(podeVerEquipe ? {} : { id: usuarioAtual.id }) },
    select: { id: true, nome: true, fotoUrl: true, cargaHorariaSemanal: true },
    orderBy: { nome: "asc" },
  });
  const idsRelevantes = pessoas.map((p) => p.id);

  const semanas = proximasSemanas(new Date(), 4);
  const primeiraSemana = semanas[0];
  const ultimaSemana = semanas[semanas.length - 1];

  const [ausenciasRaw, tarefasRaw]: [AusenciaRaw[], TarefaRaw[]] = await Promise.all([
    prisma.ausencia.findMany({
      where: { usuarioId: { in: idsRelevantes }, fim: { gte: primeiraSemana.inicio } },
      orderBy: { inicio: "asc" },
    }),
    prisma.tarefa.findMany({
      where: {
        responsavelId: { in: idsRelevantes },
        status: { not: "feito" },
        prazo: { gte: primeiraSemana.inicio, lte: ultimaSemana.fim },
      },
      select: { id: true, titulo: true, prazo: true, status: true, estimativaHoras: true, responsavelId: true },
    }),
  ]);

  const dados = pessoas.map((pessoa) => {
    const ausenciasPessoa = ausenciasRaw.filter((a) => a.usuarioId === pessoa.id);
    const semanasCalculadas = semanas.map((semana) => {
      const capacidade = capacidadeDaSemana(pessoa, ausenciasPessoa, semana);
      const previsto = trabalhoPrevistoDaSemana(tarefasRaw, pessoa.id, semana);
      const semEstimativa = tarefasSemEstimativaNaSemana(tarefasRaw, pessoa.id, semana);
      return {
        inicio: semana.inicio.toISOString(),
        fim: semana.fim.toISOString(),
        capacidade,
        previsto,
        semEstimativa,
        nivel: nivelDaSemana(previsto, capacidade),
      };
    });
    const conflitos = conflitosDeAusencia(tarefasRaw, pessoa.id, ausenciasPessoa);

    return {
      id: pessoa.id,
      nome: pessoa.nome,
      fotoUrl: pessoa.fotoUrl,
      cargaHorariaSemanal: pessoa.cargaHorariaSemanal,
      semanas: semanasCalculadas,
      conflitos: conflitos.map((c) => ({ ...c, prazo: c.prazo.toISOString() })),
      ausencias: ausenciasPessoa.map((a) => ({
        id: a.id,
        tipo: a.tipo,
        inicio: a.inicio.toISOString(),
        fim: a.fim.toISOString(),
        diaInteiro: a.diaInteiro,
        horasPorDia: a.horasPorDia,
        descricao: a.descricao,
      })),
    };
  });

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-lg font-medium text-text">
          Capacidade da equipe
          <AjudaContextual
            titulo="Capacidade da equipe"
            texto="Compara o trabalho previsto (tarefas com responsável, prazo e estimativa de horas) com a capacidade disponível de cada pessoa, semana a semana. Cadastre folgas, férias e compromissos pra a conta considerar isso automaticamente."
            exemplo="Ex.: uma semana em vermelho significa mais trabalho previsto do que capacidade disponível — vale remanejar uma tarefa ou ajustar o prazo."
          />
        </p>
      </div>
      <p className="mb-6 text-sm text-muted">
        {podeVerEquipe ? "Próximas 4 semanas, toda a equipe." : "Suas próximas 4 semanas."} Só entram na conta
        tarefas com responsável, prazo e estimativa de horas preenchidos.
      </p>

      {dados.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma pessoa ativa encontrada.</p>
      ) : (
        <CapacidadeEquipe pessoas={dados} usuarioAtualId={usuarioAtual.id} podeGerenciarEquipe={podeVerEquipe} />
      )}
    </div>
  );
}
