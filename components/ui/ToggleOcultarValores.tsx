"use client";

import { useOcultarValores, BotaoOcultarValores } from "./OcultarValores";

export function ToggleOcultarValores() {
  const { oculto, alternar } = useOcultarValores();
  return <BotaoOcultarValores oculto={oculto} onClick={alternar} />;
}
