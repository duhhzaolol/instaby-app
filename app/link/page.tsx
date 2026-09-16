import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LinkPage } from "@/components/landing/LinkPage";

export const metadata: Metadata = {
  title: "Instaby Agência — Links",
  description: "Todos os links da Instaby Agência em um só lugar.",
};

// Lista de links — editar aqui é o jeito de adicionar/alterar links depois.
// Deixe "url: null" pra um link que ainda não existe (ele não aparece na página).
const LINKS = [
  { label: "Site", url: "/" },
  { label: "Portfólio", url: "#" },
  { label: "Instagram", url: "https://instagram.com/instabyagencia" },
  { label: "Instagram pessoal (Duhzao)", url: null as string | null },
];

export default async function LinkPageRoute() {
  const config = await prisma.configuracao.findUnique({ where: { id: "config" } });
  const whatsappAgencia = config?.whatsappAgencia || null;

  return <LinkPage links={LINKS} whatsappAgencia={whatsappAgencia} />;
}
