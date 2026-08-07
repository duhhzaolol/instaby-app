"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function WhatsappAgenciaForm({ whatsappAtual }: { whatsappAtual: string }) {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState(whatsappAtual);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsappAgencia: whatsapp.replace(/\D/g, "") }),
    });
    setSalvando(false);
    setSalvo(true);
    router.refresh();
    setTimeout(() => setSalvo(false), 2000);
  }

  return (
    <form onSubmit={salvar} className="flex max-w-sm items-end gap-2">
      <div className="flex-1">
        <Label>WhatsApp da agência (com DDI e DDD, só números)</Label>
        <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5519999999999" />
      </div>
      <Button type="submit" size="md" disabled={salvando}>
        {salvo ? "Salvo ✓" : salvando ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
