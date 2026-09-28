// Avatar de uma pessoa da equipe — foto (Usuario.fotoUrl, redesign v144 Parte 3)
// se ela tiver colocado uma em Configurações pessoais, senão iniciais numa
// bolinha colorida (cor derivada do nome, então cada pessoa fica com uma cor
// própria e estável, não só 3 cores por papel). Usado em Agenda e Horas.
// Não mexe no círculo de iniciais por PAPEL que já existia em Sidebar/EquipeAgora.
const CORES_AVATAR = ["#E63946", "#3B82F6", "#A855F7", "#22C55E", "#F59E0B", "#06B6D4", "#EC4899", "#F97316"];

export function iniciaisNome(nome: string): string {
  return nome
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function corPorNome(nome: string): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  return CORES_AVATAR[Math.abs(hash) % CORES_AVATAR.length];
}

export function AvatarPessoa({
  nome,
  fotoUrl,
  tamanho = 20,
}: {
  nome: string;
  fotoUrl?: string | null;
  tamanho?: number;
}) {
  const cor = corPorNome(nome);

  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fotoUrl}
        alt={nome}
        title={nome}
        className="shrink-0 rounded-full object-cover ring-1 ring-white/10"
        style={{ width: tamanho, height: tamanho }}
      />
    );
  }

  return (
    <div
      title={nome}
      className="flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-white/10"
      style={{ width: tamanho, height: tamanho, backgroundColor: `${cor}2A`, color: cor, fontSize: Math.max(8, Math.round(tamanho * 0.4)) }}
    >
      {iniciaisNome(nome)}
    </div>
  );
}
