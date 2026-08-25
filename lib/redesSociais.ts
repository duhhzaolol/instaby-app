import { Instagram, Music2, Facebook, Search, Target, type LucideIcon } from "lucide-react";

export type Rede = "instagram" | "tiktok" | "facebook" | "google" | "meta_ads";

export const REDES: { valor: Rede; label: string; icone: LucideIcon; cor: string; paga: boolean }[] = [
  { valor: "instagram", label: "Instagram", icone: Instagram, cor: "#E1306C", paga: false },
  { valor: "tiktok", label: "TikTok", icone: Music2, cor: "#25F4EE", paga: false },
  { valor: "facebook", label: "Facebook", icone: Facebook, cor: "#1877F2", paga: false },
  { valor: "google", label: "Google Ads", icone: Search, cor: "#4285F4", paga: true },
  { valor: "meta_ads", label: "Meta Ads", icone: Target, cor: "#0866FF", paga: true },
];

export function visualDaRede(rede: string) {
  return REDES.find((r) => r.valor === rede) || REDES[0];
}
