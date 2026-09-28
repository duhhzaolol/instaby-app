import { MessageCircle, Phone, Instagram, Mail, Link2, type LucideIcon } from "lucide-react";

// Mesmo padrão de lib/linkClienteVisual.ts, só que pros links de contato
// pessoais de Configurações pessoais (redesign v144, Parte 3).
export const TIPOS_LINK_USUARIO: { valor: string; label: string; icone: LucideIcon }[] = [
  { valor: "discord", label: "Discord", icone: MessageCircle },
  { valor: "whatsapp", label: "WhatsApp", icone: Phone },
  { valor: "instagram", label: "Instagram", icone: Instagram },
  { valor: "email", label: "E-mail", icone: Mail },
  { valor: "outro", label: "Outro", icone: Link2 },
];

export function visualDoTipoLinkUsuario(valor: string) {
  return TIPOS_LINK_USUARIO.find((t) => t.valor === valor) || TIPOS_LINK_USUARIO[TIPOS_LINK_USUARIO.length - 1];
}
