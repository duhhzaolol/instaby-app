import { manrope, jetbrainsMono } from "@/lib/fonts";

// Login usa o mesmo visual novo do painel (pedido explícito do redesign),
// então entra no escopo de .tema-painel + fontes novas igual o dashboard —
// ver app/dashboard/layout.tsx pro mesmo padrão.
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`tema-painel ${manrope.variable} ${jetbrainsMono.variable}`}>
      {children}
    </div>
  );
}
