import { randomBytes } from "crypto";

export function gerarSlug(nomeCliente: string) {
  const base = nomeCliente
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // O link do or\u00e7amento (/orcamento/{slug}) \u00e9 p\u00fablico de prop\u00f3sito \u2014 qualquer
  // pessoa com o link pode ver e aceitar, sem precisar de login. Por isso quem
  // protege esse link \u00e9 s\u00f3 o quanto ele \u00e9 dif\u00edcil de adivinhar. Antes, o sufixo
  // vinha de Math.random() com s\u00f3 4 caracteres (pouco mais de 1 milh\u00e3o de
  // combina\u00e7\u00f5es) \u2014 combinado com um nome de cliente que muitas vezes \u00e9 p\u00fablico
  // (nome da empresa), dava pra um script tentar todas as combina\u00e7\u00f5es e cair no
  // or\u00e7amento de outra pessoa. Agora o sufixo usa o gerador criptogr\u00e1fico do
  // Node (crypto.randomBytes) com 16 caracteres em hexadecimal \u2014 16 quintilh\u00f5es
  // de vezes mais combina\u00e7\u00f5es, imposs\u00edvel de adivinhar por tentativa e erro.
  const sufixo = randomBytes(8).toString("hex");

  return `${base}-${sufixo}`;
}
