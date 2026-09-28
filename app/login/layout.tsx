import { fontesPainel } from "@/lib/fontes";

// Login com o mesmo visual do painel (redesign fase 1) — cores e fontes de
// styles/tokens-painel.css. A lógica de entrar continua toda em page.tsx.
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className={`tema-painel ${fontesPainel} bg-base text-text`}>{children}</div>;
}
