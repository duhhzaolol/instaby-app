"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { normalizarDadosAgencia, obterDadosAgencia, type ConfiguracaoDadosAgencia } from "@/lib/dadosAgencia";

export default function DadosAgenciaForm({ dadosIniciais }: { dadosIniciais: ConfiguracaoDadosAgencia }) {
  const router = useRouter();
  const [nome, setNome] = useState(dadosIniciais.nomeAgencia || "");
  const [whatsapp, setWhatsapp] = useState(dadosIniciais.whatsappAgencia || "");
  const [site, setSite] = useState(dadosIniciais.siteAgencia || "");
  const [instagram, setInstagram] = useState(dadosIniciais.linkBioInstagram || "");
  const [logoUrl, setLogoUrl] = useState<string | null>(dadosIniciais.logoAgenciaUrl || null);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);

  function alterou() { setSalvo(false); setErro(""); }

  async function enviarLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    alterou();
    if (!["image/png", "image/jpeg"].includes(arquivo.type)) {
      setErro("Escolha uma imagem PNG ou JPEG para o logo.");
      return;
    }
    if (arquivo.size === 0 || arquivo.size > 2 * 1024 * 1024) {
      setErro("O logo deve ter até 2 MB. Escolha uma imagem menor.");
      return;
    }
    setEnviando(true);
    try {
      const form = new FormData();
      form.append("arquivo", arquivo);
      const resposta = await fetch("/api/upload-logo-agencia", { method: "POST", body: form });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível enviar o logo. Tente novamente.");
      const logo = normalizarDadosAgencia({ logoAgenciaUrl: dados.url });
      setLogoUrl(logo.logoAgenciaUrl || null);
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : "Não foi possível enviar o logo. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    alterou();
    setSalvando(true);
    try {
      const dados = normalizarDadosAgencia({
        nomeAgencia: nome, whatsappAgencia: whatsapp, siteAgencia: site,
        linkBioInstagram: instagram, logoAgenciaUrl: logoUrl,
      });
      const resposta = await fetch("/api/configuracao", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const atualizado = await resposta.json();
      if (!resposta.ok) throw new Error(atualizado.erro || "Não foi possível salvar os dados. Tente novamente.");
      setNome(atualizado.nomeAgencia || "");
      setWhatsapp(atualizado.whatsappAgencia || "");
      setSite(atualizado.siteAgencia || "");
      setInstagram(atualizado.linkBioInstagram || "");
      setLogoUrl(atualizado.logoAgenciaUrl || null);
      setSalvo(true);
      router.refresh();
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : "Não foi possível salvar os dados. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  const ocupado = salvando || enviando;
  const agencia = obterDadosAgencia({ nomeAgencia: nome, logoAgenciaUrl: logoUrl });

  return (
    <form onSubmit={salvar} className="max-w-2xl space-y-4" aria-busy={ocupado}>
      <fieldset disabled={ocupado} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="agencia-nome">Nome da agência</Label>
          <Input id="agencia-nome" value={nome} onChange={(e) => { alterou(); setNome(e.target.value); }} maxLength={120} placeholder="Instaby" autoComplete="organization" />
        </div>
        <div>
          <Label htmlFor="agencia-whatsapp">Celular / WhatsApp</Label>
          <Input id="agencia-whatsapp" type="tel" value={whatsapp} onChange={(e) => { alterou(); setWhatsapp(e.target.value); }} maxLength={40} placeholder="(19) 99999-9999" autoComplete="tel" aria-describedby="agencia-whatsapp-ajuda" />
          <p id="agencia-whatsapp-ajuda" className="mt-1.5 text-xs text-muted">Informe o DDD. O código 55 é incluído ao salvar.</p>
        </div>
        <div>
          <Label htmlFor="agencia-site">Site</Label>
          <Input id="agencia-site" value={site} onChange={(e) => { alterou(); setSite(e.target.value); }} maxLength={2048} placeholder="suaagencia.com.br" inputMode="url" autoComplete="url" />
        </div>
        <div>
          <Label htmlFor="agencia-instagram">Instagram</Label>
          <Input id="agencia-instagram" value={instagram} onChange={(e) => { alterou(); setInstagram(e.target.value); }} maxLength={2048} placeholder="@suaagencia ou link do perfil" autoCapitalize="none" spellCheck={false} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="agencia-logo">Logo da agência</Label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-20 w-40 shrink-0 items-center justify-center rounded-xl border border-border bg-card p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={agencia.logoUrl} alt={`Logo de ${agencia.nome}`} className="max-h-full max-w-full object-contain" onError={(e) => { if (e.currentTarget.getAttribute("src") !== "/logo.png") e.currentTarget.src = "/logo.png"; }} />
            </div>
            <div className="min-w-0 space-y-2">
              <input id="agencia-logo" type="file" accept="image/png,image/jpeg" onChange={enviarLogo} aria-describedby="agencia-logo-ajuda" className="block w-full text-sm text-muted file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-xl file:border file:border-border file:bg-card file:px-3 file:text-sm file:text-text hover:file:bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text" />
              <p id="agencia-logo-ajuda" className="text-xs text-muted">PNG ou JPEG, até 2 MB. Salve para aplicar as alterações.</p>
              {logoUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { alterou(); setLogoUrl(null); }}>Remover logo e usar o padrão</Button>
              )}
            </div>
          </div>
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={ocupado}>{enviando ? "Enviando logo..." : salvando ? "Salvando..." : "Salvar dados da agência"}</Button>
        <p role="status" className="text-sm text-muted">{salvo ? "Dados da agência salvos." : enviando ? "Enviando logo..." : ""}</p>
      </div>
      {erro && <p role="alert" className="text-sm text-danger-text">{erro}</p>}
    </form>
  );
}
