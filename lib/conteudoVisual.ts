import { Film, BookOpen, Layers, Image as ImageIcon, Camera, Video, Target, FileEdit, type LucideIcon } from "lucide-react";

export const FORMATOS_CONTEUDO: { valor: string; label: string; icone: LucideIcon; cor: string }[] = [
  { valor: "reel", label: "Reel", icone: Film, cor: "#E63946" },
  { valor: "story", label: "Story", icone: BookOpen, cor: "#F97316" },
  { valor: "carrossel", label: "Carrossel", icone: Layers, cor: "#A855F7" },
  { valor: "post", label: "Post", icone: ImageIcon, cor: "#3B82F6" },
  { valor: "foto", label: "Foto", icone: Camera, cor: "#06B6D4" },
  { valor: "video", label: "Vídeo", icone: Video, cor: "#22C55E" },
  { valor: "ads", label: "Ads", icone: Target, cor: "#EAB308" },
  { valor: "outro", label: "Outro", icone: FileEdit, cor: "#9CA3AF" },
];

export function visualDoFormato(valor: string | null | undefined) {
  return FORMATOS_CONTEUDO.find((f) => f.valor === valor) || FORMATOS_CONTEUDO[7];
}

export const STATUS_CONTEUDO: { valor: string; label: string; cor: string }[] = [
  { valor: "ideia", label: "Ideia", cor: "#9CA3AF" },
  { valor: "planejado", label: "Planejado", cor: "#3B82F6" },
  { valor: "producao", label: "Em produção", cor: "#F97316" },
  { valor: "edicao", label: "Em edição", cor: "#A855F7" },
  { valor: "revisao_interna", label: "Revisão interna", cor: "#EAB308" },
  { valor: "aguardando_aprovacao", label: "Aguardando aprovação", cor: "#06B6D4" },
  { valor: "alteracao_solicitada", label: "Alteração solicitada", cor: "#EF4444" },
  { valor: "aprovado", label: "Aprovado", cor: "#22C55E" },
  { valor: "agendado", label: "Agendado", cor: "#6366F1" },
  { valor: "publicado", label: "Publicado", cor: "#10B981" },
];

export function visualDoStatusConteudo(valor: string) {
  return STATUS_CONTEUDO.find((s) => s.valor === valor) || STATUS_CONTEUDO[0];
}
