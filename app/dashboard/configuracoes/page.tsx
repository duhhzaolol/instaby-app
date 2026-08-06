import { Settings } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ConfiguracoesPage() {
  return (
    <div>
      <p className="mb-6 text-lg font-medium text-text">Configurações</p>
      <EmptyState
        icon={Settings}
        title="Chegando em breve"
        description="Depoimentos fixos, métricas da agência e outras preferências vão morar aqui."
      />
    </div>
  );
}
