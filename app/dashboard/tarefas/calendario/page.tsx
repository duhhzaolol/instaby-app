import { redirect } from "next/navigation";
import { linkAgenda, periodoAgenda } from "@/lib/agenda";

// Links antigos continuam funcionando, agora no calendário único da Agenda.
export default function CalendarioTarefasPage({
  searchParams,
}: {
  searchParams: {
    mes?: string;
    cliente?: string;
    status?: string;
    tarefa?: string;
  };
}) {
  redirect(
    linkAgenda(
      {
        mes: periodoAgenda(searchParams.mes).mesChave,
        cliente: searchParams.cliente,
        status: searchParams.status === "todas" ? "todas" : "pendentes",
        visao: "tarefas",
      },
      { tarefa: searchParams.tarefa },
    ),
  );
}
