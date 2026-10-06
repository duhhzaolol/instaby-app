import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Instaby App",
    short_name: "Instaby",
    description: "Painel interno da Instaby Agência",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#101318",
    theme_color: "#101318",
    lang: "pt-BR",
  };
}
