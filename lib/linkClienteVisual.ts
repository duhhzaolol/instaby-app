import { HardDrive, Palette, Globe, Instagram, Music2, Facebook, Target, Link2, BookImage, Image as ImageIcon, Video, type LucideIcon } from "lucide-react";

export const TIPOS_LINK: { valor: string; label: string; icone: LucideIcon }[] = [
  { valor: "drive", label: "Google Drive", icone: HardDrive },
  { valor: "canva", label: "Canva", icone: Palette },
  { valor: "site", label: "Site", icone: Globe },
  { valor: "instagram", label: "Instagram", icone: Instagram },
  { valor: "tiktok", label: "TikTok", icone: Music2 },
  { valor: "meta_business", label: "Meta Business", icone: Facebook },
  { valor: "google_ads", label: "Google Ads", icone: Target },
  { valor: "linktree", label: "Linktree", icone: Link2 },
  { valor: "brandbook", label: "Brandbook", icone: BookImage },
  { valor: "fotos", label: "Fotos", icone: ImageIcon },
  { valor: "videos", label: "Vídeos", icone: Video },
  { valor: "outro", label: "Outro", icone: Link2 },
];

export function visualDoTipoLink(valor: string) {
  return TIPOS_LINK.find((t) => t.valor === valor) || TIPOS_LINK[TIPOS_LINK.length - 1];
}
