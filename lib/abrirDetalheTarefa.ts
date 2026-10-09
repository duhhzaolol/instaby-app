/** Abre o detalhe sem refazer a consulta da página atual. */
export function abrirDetalheTarefa(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("tarefa", id);
  window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
