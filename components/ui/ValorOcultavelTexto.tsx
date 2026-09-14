"use client";

import { useOcultarValores, ValorSensivel } from "./OcultarValores";

export function ValorOcultavelTexto({ children }: { children: React.ReactNode }) {
  const { oculto } = useOcultarValores();
  return <ValorSensivel oculto={oculto}>{children}</ValorSensivel>;
}
