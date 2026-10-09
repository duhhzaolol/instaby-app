"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Copy, Eye, EyeOff, ExternalLink, KeyRound, LockKeyhole, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";

type Acesso = {
  id: string;
  plataforma: string;
  url: string | null;
  login: string;
  responsavel: string | null;
  observacoes: string | null;
  temSenha: boolean;
  updatedAt: string;
};
type Formulario = { plataforma: string; url: string; login: string; senha: string; responsavel: string; observacoes: string; removerSenha: boolean };
const vazio: Formulario = { plataforma: "", url: "", login: "", senha: "", responsavel: "", observacoes: "", removerSenha: false };
const campo = "min-h-11 placeholder:text-muted";

export default function AcessosClienteTab({ clienteId }: { clienteId: string }) {
  const base = `/api/clientes/${encodeURIComponent(clienteId)}/acessos`;
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [configurado, setConfigurado] = useState(true);
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [editando, setEditando] = useState<Acesso | null>(null);
  const [senhaNovaVisivel, setSenhaNovaVisivel] = useState(false);
  const [revelada, setRevelada] = useState<{ id: string; senha: string } | null>(null);
  const [excluirId, setExcluirId] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [bloqueioPendente, setBloqueioPendente] = useState(false);
  const geracao = useRef(0);
  const formularioRef = useRef<HTMLFormElement>(null);
  const expiracao = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formularioAberto = formulario !== null;

  const limpar = useCallback(() => {
    geracao.current += 1;
    setAcessos([]);
    setDesbloqueado(false);
    setRevelada(null);
    setFormulario(null);
    setEditando(null);
    setSenhaNovaVisivel(false);
    setSenhaAtual("");
    setExcluirId(null);
    setCopiado(null);
    if (expiracao.current) clearTimeout(expiracao.current);
  }, []);

  const carregar = useCallback(async () => {
    const atual = geracao.current;
    setCarregando(true);
    try {
      const res = await fetch(base, { cache: "no-store" });
      const data = await res.json();
      if (atual !== geracao.current) return;
      if (!res.ok) throw new Error(data.erro || "Não foi possível consultar os acessos. Tente novamente.");
      setConfigurado(data.configurado !== false);
      if (!data.desbloqueado) {
        limpar();
      } else {
        setDesbloqueado(true);
        setAcessos(data.acessos);
        if (expiracao.current) clearTimeout(expiracao.current);
        const fim = data.desbloqueadoAte ? new Date(data.desbloqueadoAte).getTime() : Date.now() + 600_000;
        expiracao.current = setTimeout(() => { limpar(); setAviso("O acesso foi bloqueado automaticamente. Confirme sua senha para continuar."); }, Math.max(0, fim - Date.now()));
      }
    } catch (e) {
      if (atual === geracao.current) { limpar(); setErro(e instanceof Error ? e.message : "Não foi possível consultar os acessos."); }
    } finally { setCarregando(false); }
  }, [base, limpar]);

  useEffect(() => {
    limpar();
    void carregar();
    const esconder = () => { if (document.hidden) { geracao.current += 1; setRevelada(null); setSenhaNovaVisivel(false); } };
    document.addEventListener("visibilitychange", esconder);
    return () => { geracao.current += 1; if (expiracao.current) clearTimeout(expiracao.current); document.removeEventListener("visibilitychange", esconder); };
  }, [carregar, limpar]);

  useEffect(() => {
    if (formularioAberto) formularioRef.current?.querySelector<HTMLInputElement>("#acesso-plataforma")?.focus();
  }, [formularioAberto, editando?.id]);

  useEffect(() => {
    if (!revelada) return;
    const timer = setTimeout(() => setRevelada(null), 30_000);
    return () => clearTimeout(timer);
  }, [revelada]);

  useEffect(() => {
    if (!copiado) return;
    const timer = setTimeout(() => setCopiado(null), 2500);
    return () => clearTimeout(timer);
  }, [copiado]);

  async function requisicao(caminho: string, method: string, body?: unknown) {
    const res = await fetch(`${base}${caminho}`, {
      method, cache: "no-store", headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 423) limpar();
      throw new Error(data.erro || "Não foi possível concluir. Tente novamente.");
    }
    return data;
  }

  async function desbloquear(event: FormEvent) {
    event.preventDefault();
    setErro(""); setAviso(""); setOcupado("desbloquear");
    const senha = senhaAtual;
    setSenhaAtual("");
    try { await requisicao("/desbloquear", "POST", { senhaAtual: senha }); await carregar(); }
    catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível desbloquear."); }
    finally { setOcupado(null); }
  }

  async function bloquear() {
    limpar(); setErro(""); setAviso(""); setOcupado("bloquear");
    try { await requisicao("/desbloquear", "DELETE"); setBloqueioPendente(false); }
    catch { setBloqueioPendente(true); setErro("A consulta foi fechada nesta tela, mas não foi possível encerrar a autorização no servidor. Tente bloquear novamente."); }
    finally { setOcupado(null); }
  }

  function abrirFormulario(acesso?: Acesso) {
    setErro(""); setAviso(""); setRevelada(null); setExcluirId(null); setSenhaNovaVisivel(false);
    setEditando(acesso || null);
    setFormulario(acesso ? { plataforma: acesso.plataforma, url: acesso.url || "", login: acesso.login, senha: "", responsavel: acesso.responsavel || "", observacoes: acesso.observacoes || "", removerSenha: false } : { ...vazio });
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    if (!formulario) return;
    setOcupado("salvar"); setErro(""); setAviso("");
    const payload = { ...formulario, ...(editando && !formulario.senha && !formulario.removerSenha ? { senha: undefined } : {}) };
    try {
      await requisicao(editando ? `/${encodeURIComponent(editando.id)}` : "", editando ? "PATCH" : "POST", payload);
      setFormulario(null); setEditando(null); setSenhaNovaVisivel(false);
      await carregar(); setAviso(editando ? "Acesso atualizado." : "Acesso cadastrado.");
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível salvar. Seu preenchimento foi mantido."); }
    finally { setOcupado(null); }
  }

  async function consultarSenha(acesso: Acesso, copiar: boolean) {
    const atual = geracao.current;
    setOcupado(`${copiar ? "copiar" : "revelar"}-${acesso.id}`); setErro(""); setAviso("");
    try {
      const data = await requisicao(`/${encodeURIComponent(acesso.id)}/revelar`, "POST");
      if (atual !== geracao.current || document.hidden) return;
      if (copiar) {
        if (!navigator.clipboard?.writeText) throw new Error("Não foi possível copiar neste navegador. Use Visualizar senha para copiar manualmente.");
        await navigator.clipboard.writeText(data.senha);
        setCopiado(`senha-${acesso.id}`); setAviso("Senha copiada.");
      } else setRevelada({ id: acesso.id, senha: data.senha });
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível consultar a senha."); }
    finally { setOcupado(null); }
  }

  async function copiarLogin(acesso: Acesso) {
    try { await navigator.clipboard.writeText(acesso.login); setCopiado(`login-${acesso.id}`); setAviso("Usuário copiado."); setErro(""); }
    catch { setErro("Não foi possível copiar. Selecione o usuário para copiar manualmente."); }
  }

  async function excluir(acesso: Acesso) {
    setOcupado(`excluir-${acesso.id}`); setErro("");
    try { await requisicao(`/${encodeURIComponent(acesso.id)}`, "DELETE"); setExcluirId(null); setRevelada(null); await carregar(); setAviso("Acesso excluído."); }
    catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível excluir o acesso."); }
    finally { setOcupado(null); }
  }

  function atualizar(chave: keyof Formulario, valor: string | boolean) { setFormulario((atual) => atual ? { ...atual, [chave]: valor } : null); }

  return (
    <section aria-labelledby="titulo-acessos" className="min-w-0">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="titulo-acessos" className="flex items-center gap-2 text-lg font-semibold text-text"><KeyRound size={19} aria-hidden="true" /> Acessos do cliente</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">Contas, logins e orientações para trabalhar com este cliente. A consulta está disponível somente para o administrador principal.</p>
        </div>
        {desbloqueado && <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={bloquear} disabled={!!ocupado}><LockKeyhole size={15} /> Bloquear</Button><Button onClick={() => abrirFormulario()} disabled={!!ocupado}><Plus size={16} /> Adicionar acesso</Button></div>}
      </div>

      {erro && <p role="alert" className="mb-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-relaxed text-danger-text">{erro}</p>}
      {aviso && <p role="status" className="mb-4 text-sm text-text">{aviso}</p>}
      {bloqueioPendente && <Button variant="secondary" onClick={bloquear} disabled={!!ocupado} className="mb-4">Tentar bloquear novamente</Button>}

      {carregando ? <p role="status" className="py-6 text-sm text-muted">Consultando acessos…</p> : !configurado ? (
        <div className="max-w-xl rounded-xl border border-border bg-card p-5"><h3 className="font-medium text-text">A área de Acessos ainda não foi ativada</h3><p className="mt-2 text-sm leading-relaxed text-muted">Nenhuma senha será salva até a proteção desta área estar configurada.</p><Button variant="secondary" onClick={carregar} className="mt-4">Verificar novamente</Button></div>
      ) : !desbloqueado ? (
        <form onSubmit={desbloquear} className="max-w-md rounded-xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 font-semibold text-text"><LockKeyhole size={18} aria-hidden="true" /> Confirmar sua identidade</h3>
          <p className="mb-5 mt-2 text-sm leading-relaxed text-muted">Use sua senha do Instaby para consultar e editar os acessos deste cliente por até 10 minutos.</p>
          <Label htmlFor="senha-instaby-acessos" className="text-text">Sua senha do Instaby</Label>
          <Input id="senha-instaby-acessos" type="password" autoComplete="current-password" required maxLength={4096} value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} className={campo} disabled={!!ocupado} />
          <Button type="submit" disabled={!!ocupado || !senhaAtual} className="mt-4 w-full">{ocupado === "desbloquear" ? "Confirmando…" : "Desbloquear acessos"}</Button>
          {erro && <Button variant="ghost" type="button" onClick={carregar} className="mt-2 w-full" disabled={!!ocupado}>Tentar consultar novamente</Button>}
        </form>
      ) : (
        <>
          {formulario && (
            <form ref={formularioRef} onSubmit={salvar} className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-5" autoComplete="off">
              <div className="mb-5 flex items-center justify-between gap-3"><h3 className="font-semibold text-text">{editando ? "Editar acesso" : "Novo acesso"}</h3><Button variant="ghost" type="button" disabled={!!ocupado} onClick={() => { setFormulario(null); setEditando(null); setSenhaNovaVisivel(false); }} aria-label="Fechar formulário de acesso"><X size={18} /></Button></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="acesso-plataforma" className="text-text">Plataforma ou serviço</Label><Input id="acesso-plataforma" required maxLength={80} placeholder="Ex.: Instagram da empresa" value={formulario.plataforma} onChange={(e) => atualizar("plataforma", e.target.value)} className={campo} disabled={!!ocupado} /></div>
                <div><Label htmlFor="acesso-url" className="text-text">Endereço para entrar <span className="font-normal text-muted">(opcional)</span></Label><Input id="acesso-url" type="url" inputMode="url" maxLength={2048} placeholder="https://…" value={formulario.url} onChange={(e) => atualizar("url", e.target.value)} className={campo} disabled={!!ocupado} /></div>
                <div><Label htmlFor="acesso-login" className="text-text">Usuário ou e-mail</Label><Input id="acesso-login" required maxLength={320} autoCapitalize="none" spellCheck={false} value={formulario.login} onChange={(e) => atualizar("login", e.target.value)} className={campo} disabled={!!ocupado} /></div>
                <div>
                  <Label htmlFor="acesso-senha" className="text-text">{editando?.temSenha ? "Nova senha" : "Senha"} <span className="font-normal text-muted">(opcional)</span></Label>
                  <div className="flex gap-2"><Input id="acesso-senha" type={senhaNovaVisivel ? "text" : "password"} autoComplete="new-password" maxLength={4096} value={formulario.senha} onChange={(e) => atualizar("senha", e.target.value)} className={`${campo} min-w-0`} disabled={!!ocupado || formulario.removerSenha} /><Button type="button" variant="secondary" onClick={() => setSenhaNovaVisivel((v) => !v)} aria-label={senhaNovaVisivel ? "Ocultar senha digitada" : "Visualizar senha digitada"} aria-pressed={senhaNovaVisivel} disabled={!!ocupado || formulario.removerSenha}>{senhaNovaVisivel ? <EyeOff size={17} /> : <Eye size={17} />}</Button></div>
                  {editando?.temSenha && <><p className="mt-2 text-xs leading-relaxed text-muted">Deixe em branco para manter a senha atual.</p><label className="mt-2 flex min-h-11 items-center gap-2 text-sm text-text"><input type="checkbox" checked={formulario.removerSenha} onChange={(e) => { atualizar("removerSenha", e.target.checked); if (e.target.checked) atualizar("senha", ""); }} disabled={!!ocupado} className="h-4 w-4 accent-accent" /> Remover a senha salva</label></>}
                </div>
                <div className="sm:col-span-2"><Label htmlFor="acesso-responsavel" className="text-text">Responsável pela conta <span className="font-normal text-muted">(opcional)</span></Label><Input id="acesso-responsavel" maxLength={120} placeholder="Ex.: contato que recebe o código de confirmação" value={formulario.responsavel} onChange={(e) => atualizar("responsavel", e.target.value)} className={campo} disabled={!!ocupado} /></div>
                <div className="sm:col-span-2"><Label htmlFor="acesso-observacoes" className="text-text">Observações <span className="font-normal text-muted">(opcional)</span></Label><Textarea id="acesso-observacoes" rows={4} maxLength={2000} placeholder="Orientações sobre a conta e a verificação em duas etapas." value={formulario.observacoes} onChange={(e) => atualizar("observacoes", e.target.value)} disabled={!!ocupado} className="resize-y placeholder:text-muted" /></div>
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" disabled={!!ocupado} onClick={() => { setFormulario(null); setEditando(null); }}>Cancelar</Button><Button type="submit" disabled={!!ocupado}>{ocupado === "salvar" ? "Salvando…" : "Salvar acesso"}</Button></div>
            </form>
          )}

          {acessos.length === 0 ? <div className="border-y border-border py-8"><h3 className="font-medium text-text">Nenhum acesso cadastrado</h3><p className="mb-4 mt-2 max-w-xl text-sm leading-relaxed text-muted">Adicione a primeira conta deste cliente. Você pode cadastrar várias plataformas e consultar os dados quando precisar.</p>{!formulario && <Button variant="secondary" onClick={() => abrirFormulario()}><Plus size={16} /> Adicionar primeiro acesso</Button>}</div> : <div className="divide-y divide-border border-y border-border">
            {acessos.map((acesso) => (
              <article key={acesso.id} aria-label={`Acesso: ${acesso.plataforma}`} className="min-w-0 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1"><h3 className="break-words font-semibold text-text">{acesso.plataforma}</h3>{acesso.url && <a href={acesso.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 max-w-full items-center gap-2 break-all text-sm text-accent-text underline-offset-4 hover:underline"><ExternalLink size={14} className="shrink-0" aria-hidden="true" /> Abrir plataforma</a>}</div>
                  <div className="flex gap-1"><Button variant="ghost" disabled={!!ocupado} onClick={() => abrirFormulario(acesso)} aria-label={`Editar acesso ${acesso.plataforma}`}><Pencil size={16} /> Editar</Button><Button variant="ghost" disabled={!!ocupado} onClick={() => setExcluirId(excluirId === acesso.id ? null : acesso.id)} aria-label={`Excluir acesso ${acesso.plataforma}`}><Trash2 size={16} /> Excluir</Button></div>
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div><p className="text-xs text-muted">Usuário ou e-mail</p><div className="mt-1 flex min-w-0 items-center gap-2"><p className="min-w-0 break-all text-sm text-text">{acesso.login}</p><Button variant="ghost" disabled={!!ocupado} onClick={() => copiarLogin(acesso)} aria-label={`Copiar usuário de ${acesso.plataforma}`}>{copiado === `login-${acesso.id}` ? <Check size={16} /> : <Copy size={16} />}</Button></div></div>
                  <div><p className="text-xs text-muted">Senha</p>{acesso.temSenha ? <><p className="mt-2 break-all text-sm text-text" aria-live="off">{revelada?.id === acesso.id ? revelada.senha : "••••••••••••"}</p><div className="mt-2 flex flex-wrap gap-2"><Button variant="secondary" disabled={!!ocupado} onClick={() => revelada?.id === acesso.id ? setRevelada(null) : consultarSenha(acesso, false)} aria-label={`${revelada?.id === acesso.id ? "Ocultar" : "Visualizar"} senha de ${acesso.plataforma}`}>{revelada?.id === acesso.id ? <EyeOff size={15} /> : <Eye size={15} />}{revelada?.id === acesso.id ? "Ocultar" : "Visualizar senha"}</Button><Button variant="secondary" disabled={!!ocupado} onClick={() => consultarSenha(acesso, true)} aria-label={`Copiar senha de ${acesso.plataforma}`}>{copiado === `senha-${acesso.id}` ? <Check size={15} /> : <Copy size={15} />}{copiado === `senha-${acesso.id}` ? "Copiada" : "Copiar senha"}</Button></div>{revelada?.id === acesso.id && <p className="mt-2 text-xs text-muted">A senha será ocultada em 30 segundos.</p>}</> : <p className="mt-2 text-sm text-muted">Não cadastrada</p>}</div>
                </div>
                {acesso.responsavel && <p className="mt-3 break-words text-sm text-text"><span className="text-muted">Responsável: </span>{acesso.responsavel}</p>}
                {acesso.observacoes && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">{acesso.observacoes}</p>}
                {excluirId === acesso.id && <div className="mt-4 rounded-xl border border-danger/20 bg-danger/10 p-4"><p className="text-sm text-text">Excluir o acesso de {acesso.plataforma}? Os dados salvos serão removidos.</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" disabled={!!ocupado} onClick={() => setExcluirId(null)}>Manter acesso</Button><Button variant="danger" disabled={!!ocupado} onClick={() => excluir(acesso)}>{ocupado === `excluir-${acesso.id}` ? "Excluindo…" : "Confirmar exclusão"}</Button></div></div>}
              </article>
            ))}
          </div>}
          <p className="mt-4 text-xs leading-relaxed text-muted">As senhas só são consultadas ao visualizar ou copiar. Bloqueie os acessos ao terminar.</p>
        </>
      )}
    </section>
  );
}
