// Só permite voltar a uma página interna do painel, inclusive após normalizar
// segmentos como /../. O mesmo destino é usado pelo servidor e pelo formulário.
export function destinoLogin(callbackUrl?: string | null): string {
  if (!callbackUrl || !callbackUrl.startsWith("/") || /[\\\u0000-\u0020\u007f]/.test(callbackUrl)) {
    return "/dashboard";
  }

  try {
    const base = "https://instaby.invalid";
    const destino = new URL(callbackUrl, base);
    if (
      destino.origin !== base ||
      !(destino.pathname === "/dashboard" || destino.pathname.startsWith("/dashboard/")) ||
      /%(?:5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(destino.pathname)
    ) {
      return "/dashboard";
    }
    return `${destino.pathname}${destino.search}${destino.hash}`;
  } catch {
    return "/dashboard";
  }
}
