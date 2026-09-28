// Tabela curada de cidades da região de atuação da Instaby (Araras + entorno
// de Campinas/Piracicaba), com coordenadas reais — usada pelo mapa de verdade
// da seção "Onde a gente atende" (components/landing/MapaAtuacao.tsx) e pelo
// formulário de Configurações → Site → Mapa (MapaForm.tsx).
//
// Por quê uma tabela fixa no código, em vez de pedir coordenada pra cada
// cidade: o pedido original foi "deixa algumas cidades disponíveis lá nas
// configurações pra quando eu clicar, ela marcar" — ou seja, uma lista pra
// marcar/desmarcar, não um campo de latitude/longitude pra preencher à mão.
// O que fica salvo no banco (Configuracao.siteMapaLocais) continua sendo só
// o nome de cada cidade, na mesma forma de sempre ({ nome: string }[]) — o
// mapa casa o nome salvo com esta tabela pra achar a coordenada. Se algum dia
// quiser uma cidade fora desta lista, é só pedir pra eu adicionar aqui.
//
// Coordenadas são o centro aproximado de cada cidade (grau suficiente pra um
// mapa ilustrativo de "onde atendemos", não pra navegação turn-by-turn).

export type CidadeRegiao = { nome: string; lat: number; lng: number };

export const CIDADES_REGIAO: CidadeRegiao[] = [
  { nome: "Araras, SP", lat: -22.3573, lng: -47.3823 },
  { nome: "Leme, SP", lat: -22.1889, lng: -47.3897 },
  { nome: "Limeira, SP", lat: -22.5647, lng: -47.4017 },
  { nome: "Rio Claro, SP", lat: -22.4149, lng: -47.5651 },
  { nome: "Piracicaba, SP", lat: -22.7253, lng: -47.6492 },
  { nome: "Conchal, SP", lat: -22.3283, lng: -47.1811 },
  { nome: "Pirassununga, SP", lat: -21.9967, lng: -47.4258 },
  { nome: "Campinas, SP", lat: -22.9099, lng: -47.0626 },
  { nome: "Americana, SP", lat: -22.7392, lng: -47.3314 },
  { nome: "Santa Bárbara d'Oeste, SP", lat: -22.7548, lng: -47.4142 },
  { nome: "Cordeirópolis, SP", lat: -22.4803, lng: -47.4547 },
  { nome: "Iracemápolis, SP", lat: -22.5836, lng: -47.5192 },
  { nome: "Santa Cruz da Conceição, SP", lat: -22.1358, lng: -47.4322 },
  { nome: "Corumbataí, SP", lat: -22.2217, lng: -47.6197 },
  { nome: "Ipeúna, SP", lat: -22.4342, lng: -47.7181 },
  { nome: "Analândia, SP", lat: -22.1225, lng: -47.6558 },
  { nome: "Mogi Guaçu, SP", lat: -22.3673, lng: -46.9419 },
  { nome: "Mogi Mirim, SP", lat: -22.4319, lng: -46.9578 },
  { nome: "Porto Ferreira, SP", lat: -21.8508, lng: -47.4808 },
  { nome: "Descalvado, SP", lat: -21.9042, lng: -47.6197 },
  { nome: "São Carlos, SP", lat: -22.0175, lng: -47.8908 },
  { nome: "Rio das Pedras, SP", lat: -22.8228, lng: -47.6822 },
];

export function coordenadaDe(nome: string): { lat: number; lng: number } | null {
  const achado = CIDADES_REGIAO.find((c) => c.nome === nome);
  return achado ? { lat: achado.lat, lng: achado.lng } : null;
}
