import {
  Video,
  Palette,
  Film,
  Camera,
  Megaphone,
  Users,
  MessageCircle,
  FileText,
  Lightbulb,
  FileEdit,
  type LucideIcon,
} from "lucide-react";

export type CategoriaTarefa =
  | "gravacao"
  | "arte"
  | "reel"
  | "fotos"
  | "campanha"
  | "reuniao"
  | "contato"
  | "orcamento"
  | "ideia"
  | "outra";

export const CATEGORIAS_TAREFA: { valor: CategoriaTarefa; label: string; sub: string; icone: LucideIcon; cor: string }[] = [
  { valor: "gravacao", label: "Gravação", sub: "Marcar uma gravação", icone: Video, cor: "#E63946" },
  { valor: "arte", label: "Criar arte", sub: "Criar uma imagem/peça", icone: Palette, cor: "#A855F7" },
  { valor: "reel", label: "Criar Reel", sub: "Produção de vídeo", icone: Film, cor: "#EC4899" },
  { valor: "fotos", label: "Fotos", sub: "Sessão de fotos", icone: Camera, cor: "#3B82F6" },
  { valor: "campanha", label: "Campanha", sub: "Criar ou ajustar campanha", icone: Megaphone, cor: "#22C55E" },
  { valor: "reuniao", label: "Reunião", sub: "Marcar reunião", icone: Users, cor: "#F59E0B" },
  { valor: "contato", label: "Contato", sub: "Entrar em contato com cliente", icone: MessageCircle, cor: "#06B6D4" },
  { valor: "orcamento", label: "Orçamento", sub: "Criar orçamento", icone: FileText, cor: "#E63946" },
  { valor: "ideia", label: "Nova ideia", sub: "Registrar uma ideia", icone: Lightbulb, cor: "#EAB308" },
  { valor: "outra", label: "Outra tarefa", sub: "Digitar manualmente", icone: FileEdit, cor: "#9CA3AF" },
];

export function visualDaCategoriaTarefa(categoria: string | null | undefined) {
  return CATEGORIAS_TAREFA.find((c) => c.valor === categoria) || CATEGORIAS_TAREFA[9];
}

export const PRIORIDADES = [
  { valor: "alta", label: "🔥 Alta", cor: "#EF4444" },
  { valor: "media", label: "◆ Média", cor: "#F59E0B" },
  { valor: "baixa", label: "○ Baixa", cor: "#6B7280" },
];
