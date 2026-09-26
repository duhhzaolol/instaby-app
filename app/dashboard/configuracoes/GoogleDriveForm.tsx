"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HardDrive, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const MENSAGENS: Record<string, string> = {
  cancelado: "Conexão cancelada — você saiu da tela do Google sem autorizar.",
  erro: "Não deu pra conectar. Tenta de novo, e se continuar assim me chama.",
  sem_refresh_token: "O Google não devolveu um acesso permanente — tenta desconectar (se já tiver conectado antes) e conectar de novo.",
  faltam_chaves: "Faltam as chaves do Google configuradas no Vercel (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).",
};

export default function GoogleDriveForm({ conectadoEm }: { conectadoEm: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [desconectando, setDesconectando] = useState(false);

  const aviso = searchParams.get("google");
  const mensagemAviso = aviso && aviso !== "conectado" ? MENSAGENS[aviso] : null;

  async function desconectar() {
    if (!confirm("Desconectar o Google Drive? As pastas já criadas continuam lá, só paramos de criar/ver novas por aqui.")) return;
    setDesconectando(true);
    await fetch("/api/google/desconectar", { method: "POST" });
    setDesconectando(false);
    router.refresh();
  }

  return (
    <div className="flex max-w-md flex-col gap-3">
      {aviso === "conectado" && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-400">
          <CheckCircle2 size={14} /> Conectado com sucesso.
        </p>
      )}
      {mensagemAviso && <p className="text-sm text-red-400">{mensagemAviso}</p>}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-base/60 px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <HardDrive size={16} className="text-muted" />
          <div>
            <p className="text-sm text-text">{conectadoEm ? "Conectado" : "Não conectado"}</p>
            {conectadoEm && <p className="text-xs text-muted">Desde {conectadoEm}</p>}
          </div>
        </div>
        {conectadoEm ? (
          <Button variant="secondary" size="sm" onClick={desconectar} disabled={desconectando}>
            {desconectando ? "Desconectando..." : "Desconectar"}
          </Button>
        ) : (
          <a href="/api/google/conectar">
            <Button size="sm">Conectar</Button>
          </a>
        )}
      </div>
    </div>
  );
}
