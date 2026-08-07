import {
  Video,
  Camera,
  Instagram,
  Target,
  Globe,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const ICONE_POR_CATEGORIA: Record<string, { icone: LucideIcon; cor: string }> = {
  "📱 Social Media": { icone: Instagram, cor: "#3B82F6" },
  "🎥 Produção de Conteúdo": { icone: Video, cor: "#E63946" },
  "📸 Captação": { icone: Camera, cor: "#A855F7" },
  "🎯 Tráfego Pago": { icone: Target, cor: "#22C55E" },
  "🌐 Desenvolvimento Web": { icone: Globe, cor: "#06B6D4" },
  "🎬 Cobertura de Eventos": { icone: Sparkles, cor: "#F59E0B" },
};

export function visualDaCategoria(categoria: string) {
  return ICONE_POR_CATEGORIA[categoria] || { icone: Zap, cor: "#E63946" };
}
