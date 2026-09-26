import { FolderOpen, Image as ImageIcon, FileSignature, HardDrive } from "lucide-react";

// Sem "use client" de propósito — só mostra links prontos que a página (Server
// Component) já preparou via lib/google.ts. Nenhuma interação daqui precisa de
// estado no navegador ainda.
export default function ArquivosTab({
  pastas,
  podeVerContratos,
}: {
  pastas: { logotipos: string; conteudo: string; contratos: string } | null;
  podeVerContratos: boolean;
}) {
  if (!pastas) {
    return (
      <div className="rounded-xl border border-border bg-card/60 p-5 text-sm text-muted">
        <p className="mb-1 flex items-center gap-1.5 font-medium text-text">
          <HardDrive size={14} /> Pastas ainda não disponíveis
        </p>
        <p>
          Confirma se o Google Drive da agência está conectado (Configurações → Google Drive). Assim que
          estiver, as pastas desse cliente são criadas automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <a
        href={pastas.logotipos}
        target="_blank"
        className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:bg-hover"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <ImageIcon size={16} />
        </div>
        <div>
          <p className="text-sm font-medium text-text">Logotipos</p>
          <p className="text-xs text-muted">Marca do cliente em alta resolução, pra quem for criar arte ou editar.</p>
        </div>
      </a>

      <a
        href={pastas.conteudo}
        target="_blank"
        className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:bg-hover"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <FolderOpen size={16} />
        </div>
        <div>
          <p className="text-sm font-medium text-text">Conteúdo</p>
          <p className="text-xs text-muted">
            Organizado por semana — é ali que o material bruto entra e o editado sai. As pastas de cada semana
            também aparecem dentro da tarefa (aba Tarefas) quando têm categoria de mídia.
          </p>
        </div>
      </a>

      {podeVerContratos && (
        <a
          href={pastas.contratos}
          target="_blank"
          className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:bg-hover"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <FileSignature size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-text">Contratos</p>
            <p className="text-xs text-muted">Só pra quem tem acesso a Contratos — nunca é compartilhada por link com o resto da equipe.</p>
          </div>
        </a>
      )}
    </div>
  );
}
