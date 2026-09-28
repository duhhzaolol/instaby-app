"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Users,
  Wallet,
  Clock,
  Calendar,
  CheckSquare,
  Trophy,
  Settings,
  Menu,
  X,
  Megaphone,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { BotaoTema } from "@/components/ui/TemaAlternativo";
import { ABAS_FINANCEIRO, abasComercialVisiveis } from "@/lib/navSecoes";

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
  { chave: "tarefas", label: "Tarefas", href: "/dashboard/tarefas", icon: CheckSquare },
  { chave: "agenda", label: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { chave: "clientes", label: "Clientes", href: "/dashboard/clientes", icon: Users },
  { chave: "trafego", label: "Tráfego pago", href: "/dashboard/trafego", icon: Megaphone },
  { chave: "horas", label: "Horas", href: "/dashboard/horas", icon: Clock },
] as const;

function ItemMenu({
  item,
  ativo,
  contador,
  onClick,
}: {
  item: { label: string; href: string; icon: any };
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
    <Link href={item.href} onClick={onClick} className="relative block">
      {ativo && (
        <motion.div
          layoutId="sidebar-active"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="absolute inset-0 rounded-xl border border-accent/20 bg-accent/10"
        />
      )}
      <div
        className={`relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ${
          ativo ? "font-medium text-accent" : "text-muted hover:bg-hover hover:text-text"
        }`}
      >
        <Icon size={17} strokeWidth={1.75} />
        <span className="flex-1">{item.label}</span>
        {mostrarContador && (
          <span
            className={`fonte-valores rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
              contador!.tipo === "alerta" ? "bg-accent/15 text-accent-text" : "bg-hover text-muted"
            }`}
          >
            {contador!.valor}
          </span>
        )}
      </div>
    </Link>
  );
}

// Item de dentro de um grupo expansível (Financeiro/Comercial) — mesma pegada
// visual do ItemMenu normal (inclusive a pílula ativa compartilhada, pra
// navegar entre qualquer item do menu, aninhado ou não, dar a mesma animação
// de slide), só que menor/sem ícone, porque fica recuado dentro do grupo.
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
    <Link href={item.href} onClick={onClick} className="relative block">
      {ativo && (
        <motion.div
          layoutId="sidebar-active"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="absolute inset-0 rounded-lg border border-accent/20 bg-accent/10"
        />
      )}
      <div
        className={`relative z-10 rounded-lg px-3 py-2 text-[13px] transition-colors duration-150 ${
          ativo ? "font-medium text-accent" : "text-muted hover:bg-hover hover:text-text"
        }`}
      >
        {item.label}
      </div>
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
  icon: any;
  subitens: { label: string; href: string }[];
  ativoSecao: boolean;
  itemAtivo: (href: string) => boolean;
  contador?: { valor: number; tipo: "alerta" | "neutro" };
  onNavigate?: () => void;
}) {
  const [aberto, setAberto] = useState(ativoSecao);

  useEffect(() => {
    if (ativoSecao) setAberto(true);
  }, [ativoSecao]);

  const mostrarContador = contador && (contador.tipo === "neutro" || contador.valor > 0);

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ${
          ativoSecao ? "font-medium text-text" : "text-muted hover:bg-hover hover:text-text"
        }`}
      >
        <Icon size={17} strokeWidth={1.75} />
        <span className="flex-1 text-left">{label}</span>
        {mostrarContador && (
          <span
            className={`fonte-valores rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
              contador!.tipo === "alerta" ? "bg-accent/15 text-accent-text" : "bg-hover text-muted"
            }`}
          >
            {contador!.valor}
          </span>
        )}
        <ChevronRight
          size={13}
          className={`shrink-0 transition-transform duration-200 ${aberto ? "rotate-90 text-text" : "text-muted/60"}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-[22px] flex flex-col gap-0.5 border-l border-border py-0.5 pl-3">
              {subitens.map((s) => (
                <ItemSubmenu key={s.href} item={s} ativo={itemAtivo(s.href)} onClick={onNavigate} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      <Link href="/dashboard" onClick={onNavigate} className="mb-8 flex items-center gap-2 px-2">
        <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
      </Link>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] uppercase tracking-wider text-muted/70">Geral</p>
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
            <p className="px-3 pb-1 text-[11px] uppercase tracking-wider text-muted/70">Gestão</p>
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

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
        <Link href="/dashboard/perfil" onClick={onNavigate} className="flex items-center gap-2 rounded-lg -mx-1 -my-0.5 px-1 py-0.5 transition-colors hover:bg-hover" title="Configurações pessoais">
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
        <div className="flex items-center gap-1.5 border-t border-border pt-2">
          <BotaoTema />
          <Link
            href="/dashboard/configuracoes"
            onClick={onNavigate}
            title="Configurações"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-inset text-muted transition-colors hover:bg-hover hover:text-text"
          >
            <Settings size={15} />
          </Link>
          <button
            onClick={sairDaConta}
            title="Sair da conta"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-inset text-muted transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={15} />
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

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-border bg-sidebar px-4 py-6 md:flex print:hidden">
        <ConteudoSidebar nome={nome} cargo={cargo} fotoUrl={fotoUrl} pode={pode} contadores={contadores} />
      </aside>

      {/* Botão mobile */}
      <button
        onClick={() => setAberto(true)}
        className="fixed left-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-text md:hidden print:hidden"
      >
        <Menu size={16} />
      </button>

      {/* Drawer mobile */}
      <AnimatePresence>
        {aberto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAberto(false)}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
            />
            <motion.aside
              initial={{ x: -248 }}
              animate={{ x: 0 }}
              exit={{ x: -248 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-border bg-sidebar px-4 py-6 md:hidden"
            >
              <button
                onClick={() => setAberto(false)}
                className="absolute right-4 top-4 text-muted hover:text-text"
              >
                <X size={16} />
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
      </AnimatePresence>
    </>
  );
}
