export function gerarSlug(nomeCliente: string) {
  const base = nomeCliente
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const sufixo = Math.random().toString(36).slice(2, 6);

  return `${base}-${sufixo}`;
}
