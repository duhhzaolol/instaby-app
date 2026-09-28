"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Trash2, Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { UploadImagem } from "@/components/ui/UploadImagem";
import { TIPOS_LINK_USUARIO, visualDoTipoLinkUsuario } from "@/lib/linkUsuarioVisual";

export type LinkUsuarioData = { id: string; tipo: string; label: string | null; url: string };

// Configurações pessoais — disponível pra QUALQUER pessoa logada, master
// incluso (redesign v144, Parte 3). Diferente de Configurações → Equipe (que é
// só pra quem tem gerenciarEquipe mexer em OUTRAS contas): aqui é sempre a
// própria conta, e a API (/api/perfil) sempre usa o id da sessão, nunca um id
// do formulário.
export function PerfilForm({
  usuarioId,
  nomeInicial,
  emailInicial,
  fotoUrlInicial,
  linksIniciais,
}: {
  usuarioId: string;
  nomeInicial: string;
  emailInicial: string;
  fotoUrlInicial: string | null;
  linksIniciais: LinkUsuarioData[];
}) {
  const router = useRouter();
  const { update } = useSession();

  const [nome, setNome] = useState(nomeInicial);
  const [email, setEmail] = useState(emailInicial);
  const [fotoUrl, setFotoUrl] = useState<string | null>(fotoUrlInicial);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [okPerfil, setOkPerfil] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [okSenha, setOkSenha] = useState(false);

  const [links, setLinks] = useState(linksIniciais);
  const [novoTipo, setNovoTipo] = useState(TIPOS_LINK_USUARIO[0].valor);
  const [novoLabel, setNovoLabel] = useState("");
  const [novaUrl, setNovaUrl] = useState("");
  const [salvandoLink, setSalvandoLink] = useState(false);

  async function salvarFoto(url: string | null) {
    setFotoUrl(url);
    await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fotoUrl: url }),
    });
    router.refresh();
  }

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoPerfil(true);
    setOkPerfil(false);

    const emailMudou = email.trim().toLowerCase() !== emailInicial.toLowerCase();
    const res = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email }),
    });
    setSalvandoPerfil(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.erro || "Não consegui salvar seu perfil.");
      return;
    }

    // Atualiza a sessão (nome/e-mail) sem precisar sair e entrar de novo — ver
    // o callback jwt em lib/auth.ts, que existe justamente pra isso.
    await update({ name: nome, email });

    if (emailMudou) {
      alert("E-mail atualizado. Por segurança, você vai precisar entrar de novo com o novo e-mail.");
      signOut({ callbackUrl: "/login" });
      return;
    }

    setOkPerfil(true);
    router.refresh();
    setTimeout(() => setOkPerfil(false), 2500);
  }

  async function salvarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      alert("A confirmação não bate com a nova senha.");
      return;
    }
    setSalvandoSenha(true);
    setOkSenha(false);
    const res = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });
    setSalvandoSenha(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.erro || "Não consegui trocar sua senha.");
      return;
    }
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setOkSenha(true);
    setTimeout(() => setOkSenha(false), 2500);
  }

  async function adicionarLink(e: React.FormEvent) {
    e.preventDefault();
    if (!novaUrl.trim()) return;
    setSalvandoLink(true);
    const res = await fetch("/api/perfil/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: novoTipo, label: novoLabel.trim() || null, url: novaUrl.trim() }),
    });
    setSalvandoLink(false);
    if (!res.ok) {
      alert("Não consegui adicionar esse link.");
      return;
    }
    const criado = await res.json();
    setLinks((prev) => [...prev, criado]);
    setNovoLabel("");
    setNovaUrl("");
  }

  async function removerLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    const res = await fetch(`/api/perfil/links/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Não consegui remover esse link.");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text">Foto de perfil</p>
        <UploadImagem value={fotoUrl} onChange={salvarFoto} pasta="avatares" tamanhoRecomendado="400 × 400px" proporcao="1:1" />
      </Card>

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text">Seus dados</p>
        <form onSubmit={salvarPerfil} className="flex flex-col gap-3">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div>
            <Label>E-mail (usado pra entrar)</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={salvandoPerfil}>
              {salvandoPerfil ? "Salvando..." : "Salvar"}
            </Button>
            {okPerfil && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Check size={13} /> Salvo
              </span>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <p className="mb-1 text-sm font-medium text-text">Trocar senha</p>
        <p className="mb-4 text-xs text-muted">Deixe em branco se não quiser trocar agora.</p>
        <form onSubmit={salvarSenha} className="flex flex-col gap-3">
          <div>
            <Label>Senha atual</Label>
            <Input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Nova senha</Label>
              <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoComplete="new-password" />
            </div>
            <div>
              <Label>Confirmar nova senha</Label>
              <Input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" variant="secondary" disabled={salvandoSenha || !senhaAtual || !novaSenha}>
              {salvandoSenha ? "Salvando..." : "Trocar senha"}
            </Button>
            {okSenha && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Check size={13} /> Senha atualizada
              </span>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <p className="mb-1 text-sm font-medium text-text">Links de contato</p>
        <p className="mb-4 text-xs text-muted">Discord, WhatsApp etc. — pra sua equipe achar você mais rápido.</p>

        <div className="mb-3 flex flex-col gap-2">
          {links.map((l) => {
            const { icone: Icon, label: labelTipo } = visualDoTipoLinkUsuario(l.tipo);
            return (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border border-border bg-base/40 px-3 py-2">
                <Icon size={14} className="shrink-0 text-muted" />
                <a href={l.url} target="_blank" className="min-w-0 flex-1 truncate text-sm text-text hover:underline">
                  {l.label || labelTipo}
                </a>
                <button onClick={() => removerLink(l.id)} className="shrink-0 text-muted hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
          {links.length === 0 && <p className="text-xs text-muted">Nenhum link adicionado ainda.</p>}
        </div>

        <form onSubmit={adicionarLink} className="flex flex-col gap-2 sm:flex-row">
          <Select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} className="sm:w-40">
            {TIPOS_LINK_USUARIO.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.label}
              </option>
            ))}
          </Select>
          <Input placeholder="Rótulo (opcional)" value={novoLabel} onChange={(e) => setNovoLabel(e.target.value)} className="sm:w-40" />
          <Input placeholder="Link ou usuário" value={novaUrl} onChange={(e) => setNovaUrl(e.target.value)} className="flex-1" />
          <Button type="submit" size="sm" variant="secondary" disabled={salvandoLink || !novaUrl.trim()}>
            <Plus size={13} /> Adicionar
          </Button>
        </form>
      </Card>
    </div>
  );
}
