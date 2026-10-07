"use client";

import { useState, useEffect, useId, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import {
  LayoutGrid,
  Users,
  Wallet,
  Clock,
  Calendar,
  Clapperboard,
  Trophy,
  Settings,
  Menu,
  X,
  Megaphone,
  LogOut,
  ChevronRight,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { BotaoTema } from "@/components/ui/TemaAlternativo";
import { ABAS_FINANCEIRO, abasComercialVisiveis } from "@/lib/navSecoes";

const focoMenu = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text/70 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar";

// Confirma antes de sair — mesmo padrão de confirm() já usado nos "excluir"
// espalhados pelo app, pra um clique errado no rodapé apertado não deslogar
// sem querer no meio do trabalho.
function sairDaConta() {
  if (!confirm("Sair da sua conta?")) return;
  signOut({ callbackUrl: "/login" });
}

export type Permissoes = {
  master: boolean;
  verFinanceiro: boolean;
  gerenciarFinanceiro: boolean;
  verComercial: boolean;
  verOportunidades: boolean;
  verOrcamentos: boolean;
  verContratos: boolean;
  verCatalogo: boolean;
  gerenciarTrafego: boolean;
  gerenciarEquipe: boolean;
  gerenciarConfiguracoes: boolean;
  todosClientes: boolean;
};

export type ContadoresMenu = {
  tarefasAtrasadas: number;
  clientesAtivos: number;
  cobrancasVencidas: number;
};

// Lista única "Geral" (redesign v144, Parte 1) — Tráfego Pago deixou de ser
// uma seção própria e entrou nessa mesma lista, condicional a quem gerencia
// tráfego, na ordem que ele pediu: Início, Tarefas, Agenda, Clientes, Tráfego
// pago, Horas.
const menuGeral = [
  { chave: "inicio", label: "Início", href: "/dashboard", icon: LayoutGrid },
  { chave: "tarefas", label: "Tarefas", href: "/dashboard/tarefas", icon: Clapperboard },
  { chave: "agenda", label: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { chave: "clientes", label: "Clientes", href: "/dashboard/clientes", icon: Users },
  { chave: "trafego", label: "Tráfego pago", href: "/dashboard/trafego", icon: Megaphone },
  { chave: "horas", label: "Horas", href: "/dashboard/horas", icon: Clock },
  // Etapa 4 (v158) — visível pra todo mundo (cada um vê ao menos a própria
  // capacidade; gerenciarEquipe também vê a equipe inteira, ver a própria página).
  { chave: "capacidade", label: "Capacidade", href: "/dashboard/capacidade", icon: Gauge },
] as const;

function ItemMenu({
  item,
  ativo,
  contador,
  onClick,
}: {
  item: { label: string; href: string; icon: LucideIcon };
  ativo: boolean;
  // Contador opcional ao lado do rótulo — "alerta" (vermelho, só aparece se
  // > 0, ex: tarefas atrasadas/cobranças vencidas) ou "neutro" (cinza, sempre
  // aparece, ex: clientes ativos — é uma contagem, não um aviso).
  contador?: { valor: number; tipo: "alerta" | "neutro" };
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const mostrarContador = contador && (contador.tipo === "neutro" || contador.valor > 0);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={ativo ? "page" : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150 motion-reduce:transition-none ${focoMenu} ${
        ativo ? "border-accent/10 bg-accent/10 font-medium text-text" : "border-transparent text-muted hover:bg-hover hover:text-text"
      }`}
    >
      <Icon size={19} strokeWidth={1.75} aria-hidden="true" className={`shrink-0 ${ativo ? "text-accent-text" : ""}`} />
      <span className="flex-1">{item.label}</span>
      {mostrarContador && (
        <span
          className={`fonte-valores rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
            contador!.tipo === "alerta" ? "bg-danger/10 text-danger-text" : "bg-hover text-muted"
          }`}
        >
          {contador!.valor}
        </span>
      )}
    </Link>
  );
}

// Item de dentro de um grupo expansível (Financeiro/Comercial) — mesma pegada
// visual do ItemMenu normal, sem ícone porque fica recuado dentro do grupo.
function ItemSubmenu({
  item,
  ativo,
  onClick,
}: {
  item: { label: string; href: string };
  ativo: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={ativo ? "page" : undefined}
      className={`flex min-h-11 items-center rounded-lg px-3 py-2 text-[13px] transition-colors duration-150 motion-reduce:transition-none ${focoMenu} ${
        ativo ? "bg-accent/10 font-medium text-accent-text" : "text-muted hover:bg-hover hover:text-text"
      }`}
    >
      {item.label}
    </Link>
  );
}

// Grupo expansível (Financeiro/Comercial, redesign v144 Parte 3) — substitui a
// barra de abas que ficava em cima da página (components/layout/AbasSecao.tsx,
// agora sem uso): em vez de "1 item no menu que leva pra uma tela com abas",
// vira "1 item que abre/fecha, revelando as sub-telas ali dentro do menu
// mesmo". Clicar no item pai só abre/fecha (não navega) — cada sub-item é que
// é o link de verdade, exatamente como já funcionava antes de virar aba.
// Abre sozinho ao entrar numa tela da seção (ex: link direto de outro lugar do
// app), mas depois disso quem manda é o clique da pessoa — não fecha sozinho.
function ItemMenuExpansivel({
  label,
  icon: Icon,
  subitens,
  ativoSecao,
  itemAtivo,
  contador,
  onNavigate,
}: {
  label: string;
  icon: LucideIcon;
  subitens: { label: string; href: string }[];
  ativoSecao: boolean;
  itemAtivo: (href: string) => boolean;
  contador?: { valor: number; tipo: "alerta" | "neutro" };
  onNavigate?: () => void;
}) {
  const [aberto, setAberto] = useState(ativoSecao);
  const submenuId = useId();

  useEffect(() => {
    if (ativoSecao) setAberto(true);
  }, [ativoSecao]);

  const mostrarContador = contador && (contador.tipo === "neutro" || contador.valor > 0);

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={submenuId}
        onClick={() => setAberto((v) => !v)}
        className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 motion-reduce:transition-none ${focoMenu} ${
          ativoSecao ? "font-medium text-text" : "text-muted hover:bg-hover hover:text-text"
        }`}
      >
        <Icon size={19} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {mostrarContador && (
          <span
            className={`fonte-valores rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
              contador!.tipo === "alerta" ? "bg-danger/10 text-danger-text" : "bg-hover text-muted"
            }`}
          >
            {contador!.valor}
          </span>
        )}
        <ChevronRight
          size={16}
          strokeWidth={1.75}
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-150 motion-reduce:transition-none ${aberto ? "rotate-90 text-text" : "text-muted"}`}
        />
      </button>
      <div id={submenuId} hidden={!aberto}>
        <div className="ml-[21px] flex flex-col gap-0.5 border-l border-border py-1 pl-3">
          {subitens.map((s) => (
            <ItemSubmenu key={s.href} item={s} ativo={itemAtivo(s.href)} onClick={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Cor de identificação por pessoa (avatar): dono vermelho, quem gerencia
// tráfego fica azul, o resto (hoje, o editor) fica roxo — as 3 únicas
// pessoas que existem na agência hoje. Fundo a ~20% da cor, iniciais na cor
// cheia, igual o resto do app já faz com categoria/cliente.
// IMPORTANTE: classes escritas por extenso aqui de propósito (nunca montar
// `bg-${cor}/20` por template string) — o Tailwind só gera CSS pra classe que
// aparece literal no código-fonte; uma classe montada em runtime não é
// encontrada e simplesmente não vira estilo nenhum (mesma pegadinha já
// documentada pra variável de cor, ver styles/tokens-colors.css).
const CLASSES_AVATAR = {
  accent: "bg-accent/20 text-accent",
  "pessoa-trafego": "bg-pessoa-trafego/20 text-pessoa-trafego",
  "pessoa-editor": "bg-pessoa-editor/20 text-pessoa-editor",
} as const;

function corPessoa(pode: Permissoes): keyof typeof CLASSES_AVATAR {
  if (pode.master) return "accent";
  if (pode.gerenciarTrafego) return "pessoa-trafego";
  return "pessoa-editor";
}

function ConteudoSidebar({
  nome,
  cargo,
  fotoUrl,
  pode,
  contadores,
  onNavigate,
}: {
  nome: string;
  cargo: string;
  fotoUrl?: string | null;
  pode: Permissoes;
  contadores: ContadoresMenu;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const temGestao = pode.verFinanceiro || pode.verOportunidades || pode.verOrcamentos || pode.verContratos || pode.verCatalogo;
  const subitensComercial = abasComercialVisiveis(pode);

  const menuGeralVisivel = menuGeral.filter((item) => item.chave !== "trafego" || pode.gerenciarTrafego);

  // Comercial casa por prefixo (qualquer uma das 5 sub-rotas conta como
  // "Comercial" ativo), as outras por igualdade ou prefixo normal.
  const ativo = (href: string) => pathname === href || (href !== "/dashboard" && !!pathname?.startsWith(href + "/"));
  // Pra destacar o sub-item certo dentro de Financeiro/Comercial precisa ser
  // igualdade EXATA (mesma regra que já era usada na barra de abas antiga,
  // AbasSecao.tsx) — nunca por prefixo: "Resumo" é /dashboard/financeiro, que
  // é prefixo de todo o resto das abas de Financeiro, então prefixo faria o
  // Resumo acender junto com qualquer outra aba aberta.
  const ativoExato = (href: string) => pathname === href;
  const comercialAtivo = ["/dashboard/oportunidades", "/dashboard/orcamentos", "/dashboard/contratos", "/dashboard/servicos", "/dashboard/pacotes"].some(
    (h) => pathname === h || pathname?.startsWith(h + "/")
  );

  const iniciais = nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const cor = corPessoa(pode);

  return (
    <>
      <Link href="/dashboard" onClick={onNavigate} className={`mb-6 flex min-h-11 items-center gap-2 rounded-lg px-2 ${focoMenu}`}>
        <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
      </Link>

      <nav aria-label="Navegação principal" className="-mx-1 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-1 pb-1">
        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-semibold text-muted">Geral</p>
          {menuGeralVisivel.map((item) => {
            const contador =
              item.chave === "tarefas"
                ? { valor: contadores.tarefasAtrasadas, tipo: "alerta" as const }
                : item.chave === "clientes"
                ? { valor: contadores.clientesAtivos, tipo: "neutro" as const }
                : undefined;
            return (
              <ItemMenu
                key={item.href}
                item={item}
                ativo={ativo(item.href)}
                contador={contador}
                onClick={onNavigate}
              />
            );
          })}
        </div>

        {temGestao && (
          <div className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-xs font-semibold text-muted">Gestão</p>
            {pode.verFinanceiro && (
              <ItemMenuExpansivel
                label="Financeiro"
                icon={Wallet}
                subitens={ABAS_FINANCEIRO}
                ativoSecao={ativo("/dashboard/financeiro")}
                itemAtivo={ativoExato}
                contador={{ valor: contadores.cobrancasVencidas, tipo: "alerta" }}
                onNavigate={onNavigate}
              />
            )}
            {subitensComercial.length > 0 && (
              <ItemMenuExpansivel
                label="Comercial"
                icon={Trophy}
                subitens={subitensComercial}
                ativoSecao={comercialAtivo}
                itemAtivo={ativoExato}
                onNavigate={onNavigate}
              />
            )}
          </div>
        )}
      </nav>

      <div className="mt-5 flex shrink-0 flex-col gap-2 border-t border-border pt-4">
        <Link href="/dashboard/perfil" onClick={onNavigate} className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-1.5 transition-colors duration-150 hover:bg-hover motion-reduce:transition-none ${focoMenu}`} title="Configurações pessoais">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt={nome} className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
          ) : (
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${CLASSES_AVATAR[cor]}`}
            >
              {iniciais}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text">{nome}</p>
            <p className="truncate text-xs text-muted">{cargo}</p>
          </div>
        </Link>
        <div className="flex items-center gap-1 px-1 [&>button]:h-11 [&>button]:w-11 [&>button]:rounded-lg [&>button]:border-transparent [&>button]:bg-transparent [&>button:hover]:bg-hover [&>button]:focus-visible:outline-none [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-accent-text/70 [&>button]:motion-reduce:transition-none [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:stroke-[1.75]">
          <BotaoTema />
          <Link
            href="/dashboard/configuracoes"
            onClick={onNavigate}
            title="Configurações"
            aria-label="Configurações"
            aria-current={ativo("/dashboard/configuracoes") ? "page" : undefined}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-hover hover:text-text motion-reduce:transition-none ${focoMenu}`}
          >
            <Settings size={18} strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <button
            onClick={sairDaConta}
            title="Sair da conta"
            aria-label="Sair da conta"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-hover hover:text-text motion-reduce:transition-none ${focoMenu}`}
          >
            <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}

export function Sidebar({
  nome,
  cargo,
  fotoUrl,
  pode,
  contadores,
}: {
  nome: string;
  cargo: string;
  fotoUrl?: string | null;
  pode: Permissoes;
  contadores: ContadoresMenu;
}) {
  const [aberto, setAberto] = useState(false);
  const botaoMenuRef = useRef<HTMLButtonElement>(null);
  const menuMobileRef = useRef<HTMLElement>(null);
  const reduzirMovimento = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  useEffect(() => {
    if (!aberto) return;

    const menu = menuMobileRef.current;
    menu?.querySelector<HTMLButtonElement>("[data-fechar-menu]")?.focus({ preventScroll: true });

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        setAberto(false);
        return;
      }
      if (evento.key !== "Tab" || !menu) return;

      const focaveis = Array.from(menu.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((elemento) => elemento.getClientRects().length > 0);
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (!primeiro || !ultimo) {
        evento.preventDefault();
        menu.focus();
      } else if (evento.shiftKey && (document.activeElement === primeiro || !menu.contains(document.activeElement))) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && (document.activeElement === ultimo || !menu.contains(document.activeElement))) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    // Ao cruzar para desktop, desmonta também o drawer que ficou oculto por CSS.
    const telaDesktop = window.matchMedia("(min-width: 768px)");
    function aoMudarLargura() {
      if (telaDesktop.matches) setAberto(false);
    }
    document.addEventListener("keydown", aoTeclar);
    telaDesktop.addEventListener("change", aoMudarLargura);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      telaDesktop.removeEventListener("change", aoMudarLargura);
      if (botaoMenuRef.current?.getClientRects().length) {
        botaoMenuRef.current.focus({ preventScroll: true });
      }
    };
  }, [aberto]);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-border bg-sidebar px-4 py-6 md:flex print:hidden">
        <ConteudoSidebar nome={nome} cargo={cargo} fotoUrl={fotoUrl} pode={pode} contadores={contadores} />
      </aside>

      {/* Botão mobile */}
      <button
        ref={botaoMenuRef}
        type="button"
        aria-label="Abrir menu"
        aria-expanded={aberto}
        aria-controls="menu-mobile"
        onClick={() => setAberto(true)}
        className={`fixed left-3 top-2.5 z-30 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-text md:hidden print:hidden ${focoMenu}`}
      >
        <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>

      {/* Remove o fundo junto com o menu, sem aguardar uma animação de saída.
          A presença do fragmento mantinha uma camada invisível capturando
          todos os toques mesmo depois de a nova página carregar. */}
      {aberto && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu"
              data-testid="fundo-menu-mobile"
              tabIndex={-1}
              initial={reduzirMovimento ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              onClick={() => setAberto(false)}
              className="fixed inset-0 z-40 h-full w-full bg-black/60 md:hidden"
            />
            <motion.aside
              ref={menuMobileRef}
              id="menu-mobile"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              tabIndex={-1}
              initial={reduzirMovimento ? false : { x: -24 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-border bg-sidebar px-4 py-6 md:hidden"
            >
              <button
                type="button"
                data-fechar-menu
                aria-label="Fechar menu"
                onClick={() => setAberto(false)}
                className={`absolute right-3 top-4 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text ${focoMenu}`}
              >
                <X size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <ConteudoSidebar
                nome={nome}
                cargo={cargo}
                fotoUrl={fotoUrl}
                pode={pode}
                contadores={contadores}
                onNavigate={() => setAberto(false)}
              />
            </motion.aside>
          </>
      )}
    </>
  );
}
