// Os rótulos mudam apenas a apresentação. O código original do Meta continua
// sendo a identidade do indicador, para não somar resultados de tipos distintos.
export const INDICADOR_LABEL: Record<string, string> = {
  "actions:onsite_conversion.messaging_conversation_started_7d": "Conversas iniciadas por mensagem",
  "actions:onsite_conversion.total_messaging_connection": "Conexões de mensagem",
  "actions:post_engagement": "Engajamentos com a publicação",
  "actions:link_click": "Cliques no link",
  "actions:landing_page_view": "Visualizações da página de destino",
  "actions:offsite_conversion.fb_pixel_purchase": "Compras (pixel)",
  "actions:offsite_conversion.fb_pixel_add_to_cart": "Adições ao carrinho",
  "actions:offsite_conversion.fb_pixel_initiate_checkout": "Finalizações de compra iniciadas",
  "actions:offsite_conversion.fb_pixel_view_content": "Visualizações de conteúdo",
  "actions:offsite_conversion.fb_pixel_lead": "Cadastros (leads do pixel)",
  "actions:lead": "Cadastros (leads)",
  "actions:onsite_conversion.lead_grouped": "Cadastros no Facebook ou Instagram",
  "actions:purchase": "Compras",
  "actions:omni_purchase": "Compras",
  "actions:offsite_conversion.custom": "Conversões personalizadas",
  video_thruplay_watched_actions: "Visualizações do vídeo (ThruPlay)",
  reach: "Contas alcançadas",
  impressions: "Impressões",
};

export function labelIndicador(indicador: string | null | undefined): string {
  const codigo = indicador?.trim();
  if (!codigo || codigo === "(sem indicador)") return "Indicador não informado";
  if (Object.prototype.hasOwnProperty.call(INDICADOR_LABEL, codigo)) return INDICADOR_LABEL[codigo];
  // O Meta acrescenta o ID da conversão personalizada ao código. Reconhecer só
  // esse formato conhecido mantém códigos desconhecidos sem semântica inventada.
  if (/^actions:offsite_conversion\.custom\.\d+$/.test(codigo)) return "Conversões personalizadas";
  return "Outro resultado informado pelo Meta";
}
