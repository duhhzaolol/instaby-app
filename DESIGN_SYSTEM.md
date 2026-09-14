# Instaby Design System

Instaby is a Brazilian digital marketing agency ("agência de marketing digital") that runs social media, paid traffic and content production for small and mid-size local businesses. This design system was reverse-engineered from **Instaby App**, the agency's own internal operating panel, plus the client-facing pages that panel generates.

Everything is in **Portuguese (pt-BR)**, dark-only, and built for a small team that lives inside the tool all day.

## Sources this was built from

| Source | What it gave |
| --- | --- |
| `instaby-app/` — attached local codebase (Next.js 14 App Router, TypeScript, Tailwind 3.4, framer-motion 11, lucide-react 0.451, recharts, Prisma) | Ground truth for every token, component and screen here. Read `tailwind.config.ts`, `app/globals.css`, `components/ui/*`, `components/layout/*`, `components/dashboard/*`, `app/dashboard/**`, `app/orcamento`, `app/relatorio`, `app/aprovacao`. |
| `instaby-app/public/logo.png` | The brand mark → `assets/logo.png` |
| `uploads/logo instaby.png` | Lockup with the tagline → `assets/logo-lockup-tagline.png` |
| 12 uploaded screenshots (`uploads/Captura de Tela 2026-09-13 às 11.4*.png`) | **Could not be read** — the filenames contain characters the file layer rejects, so every read attempt failed. Nothing here is based on them; the codebase was the source instead. Re-upload with plain ASCII names if you want them cross-checked. |

No Figma file, no written brand guidelines and no slide template were provided — so this system has **no slide kit**, and the content/visual rules below are inferred from product copy and code, not from a brand book.

## The two products

1. **Painel interno (Instaby App)** — the authenticated panel the agency works in: dashboard, clients, agenda, tasks, content pipeline, hours, full financials (DRE, payables, receivables), sales pipeline, service catalogue, packages, quotes, contracts, settings. Surface: `--base` #131519. Kit: `ui_kits/painel/`.
2. **Páginas públicas do cliente** — unauthenticated links the panel generates and the agency sends by WhatsApp: the interactive commercial proposal, the monthly performance report, and content approval. Surface: `--public-base` #0B0D12. Kit: `ui_kits/paginas-publicas/`. (`app/contrato/[id]` and `app/onboarding/[id]` also exist in code and are not yet recreated.)

---

## Content fundamentals

**Language.** Brazilian Portuguese throughout, including in code identifiers (`Cobranca`, `OrcamentoInterativo`, `visualDaCategoriaTarefa`). Never mix English UI words in; it's "Visão geral", not "Overview".

**Voice: a competent colleague, not a platform.** The panel speaks to one person — the agency owner — and often about itself in the first person plural or as a helpful "eu". Real strings from the product:

- "Já sabe o horário que você fez isso? Já registro nas Horas junto."
- "Detectei um fundo sólido e já tentei remover — escolha qual usar:"
- "Não achei um fundo sólido uniforme pra remover — pode usar assim mesmo:"
- "Nada pendente — capriche no cafezinho ☕"
- "Confira a lista de pendentes embaixo e considera lembrar o cliente."
- "Bom dia, Duhzao 👋"

**Second person, informal.** `você` and colloquial contractions (`pra`, `tá`, `dá pra`) — never `vós`, never the formal `senhor`. On public pages the voice shifts to "a gente" / "nós" (the agency) addressing the client: "Fale com a gente antes de decidir", "Empresas que confiam no nosso trabalho".

**Sentence case, always.** Titles, buttons, labels, badges: "Novo cliente", "Aceitar proposta", "Salvar detalhes", "Precisa da sua atenção". The **only** uppercase text is the 10–11px monospace eyebrow (`proposta comercial`, `relatório de performance`) and the sidebar group labels (`Geral`, `Financeiro` — title case, letter-spaced, not caps).

**Buttons are verbs**, and the pending state replaces the label: "Entrar" → "Entrando...", "Aceitar proposta" → "Enviando...", "Salvar despesa" → "Salvando...". Three dots, never an ellipsis character.

**Microcopy explains, never scolds.** Empty states are light ("Nenhum cliente por aqui ainda."), warnings are matter-of-fact ("Tem cobrança vencendo hoje ou atrasada"), and the app suggests rather than commands ("considera lembrar o cliente").

**Emoji: used, sparingly, and deliberately.** The greeting ends with 👋, the empty-tasks line ends with ☕, priorities are 🔥 Alta / ◆ Média / ○ Baixa, and service categories carry one leading emoji in their stored names ("📱 Social Media", "🎥 Produção de Conteúdo", "📸 Captação", "🎯 Tráfego Pago", "🌐 Desenvolvimento Web", "🎬 Cobertura de Eventos"). Also `✓` for confirmation. That's the whole vocabulary — don't add more.

**Numbers.** pt-BR formatting (`18.400`, `R$ 1.840,00`, `12/09/2026`, `14:30`), money summaries drop the cents (`R$ 18.400`), currency is always `R$ ` with a space, durations are human (`2h30`). Proposal codes are monospace (`#PC-2026-A1B`).

**Sales copy on public pages** is short, benefit-led, and lowercase-styled in the hero: "gestão estratégica pra Padaria Trigo crescer.", "Vamos crescer juntos?", "Quem confia, recomenda", "Proposta segura e confidencial". The client's name is always inserted — these pages are personalised, never generic.

---

## Visual foundations

**Mood.** Near-black, quiet, dense with data, one saturated red. It reads like a private tool rather than a marketing site: no illustration, no photography, no decorative shapes beyond one faint line-chart silhouette behind the proposal hero.

**Colour.** Two dark grounds (#131519 internal, #0B0D12 public), a single brand red #E63946, and a closed categorical palette of ten hues used only for identity and status (client dots, category tiles, chart series). Red is reserved: primary buttons, the active nav pill, links, one emphasised phrase per block, progress fills. Everything else is grey. Colour never fills a large area — hues appear as `${hex}1A` (10%) tints with the saturated hue as ink, at 28–44px scale. Max two background colours per screen.

**Type.** No webfont is loaded anywhere in the product — it renders in the platform UI stack (`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto…`), with the platform monospace stack for eyebrows and codes. Weights stop at 600. The scale is tight: 12px and 14px carry the panel, 18px titles a page, 20–24px a metric, and only public heroes reach 30–36px. The branded letterforms — heavy oblique geometric sans — exist **only inside the logo bitmap**; set them as artwork, never as live text.

**Backgrounds.** Flat fills, never imagery. Three gradients exist, all near-black: the public hero (`#0B0D12 → #151822 → #0B0D12`), the proposal CTA (`#111827 → #1a0e10`, the one place red bleeds into a surface), and the "Insight Instaby" card (`accent 10% → card`). No colourful or purple gradients; no textures, no patterns, no grain.

**Cards.** 16px radius, `--card` at 60–70% alpha over the page, 1px `rgba(255,255,255,.08)` hairline border, `0 8px 24px -8px rgba(0,0,0,.5)` shadow, 2px `backdrop-filter` blur. On hover: border to 10% white, shadow to the large variant, lift 2px and scale 1.01. Ownership is marked with a **2–3px coloured left border** in the client's hue — the one place a card's border changes colour. No coloured left accents for decoration.

**Panels inside pages** use the same recipe without the lift. Rows inside a card sit on `--base` at 60% (a darker inset), 12px radius.

**Borders.** Exactly two weights: `rgba(255,255,255,.08)` in the panel, `rgba(255,255,255,.06)` on public pages. Dashed borders only on the file dropzone.

**Radii.** 8px (chips, icon tiles, small buttons), 12px (inputs, rows, icon buttons, medium/large buttons), 16px (cards, panels, modals), full (pills, dots, avatars, filter tabs, steppers). Nothing else.

**Shadows.** Two black lift shadows plus one red glow (`0 0 0 1px rgba(230,57,70,.15), 0 8px 24px -8px rgba(230,57,70,.15)`) that belongs to the primary button and, on hover, to metric cards. No inner shadows anywhere.

**Transparency and blur.** Panel chrome (sidebar, header) sits at 80–95% alpha with a 2px blur; cards at 60–70% alpha; modals/drawers use a solid card fill over a `rgba(0,0,0,.6–.7)` scrim. The `.glass` utility (`rgba(17,24,39,.6)` + 12px blur) exists for heavier overlays. Protection gradients are used once — a horizontal mask on the client-logo marquee, fading both edges.

**Motion.** One curve: `cubic-bezier(.16, 1, .3, 1)`. Colour transitions 150ms, hover/press 180ms, drawer 280ms, card entrance 500ms staggered 60ms per index (opacity 0→1, y 16→0, blur 4→0, scale .98→1). The active nav pill slides on a spring (stiffness 350, damping 30). Metrics count up once over 1.2s. Loading is either a 3px red sliver at the top edge or the wordmark breathing at 1.8s — no spinners, no skeletons. Nothing bounces; nothing overshoots except the spring pill.

**States.** Hover lightens (`#282D38` fill for rows/ghost, brightness 1.1 for red) and scales 1.02 on buttons; press scales 0.98; disabled drops to 40% opacity with pointer events off; focus draws a 50% red border plus a 2px 10% red ring. Links are red and go white on hover.

**Layout.** Fixed 280px sidebar, 64px sticky header (both blurred, both translucent), 24px page gutter, 32px vertical page padding, 12px gaps between cards, 24px rhythm between sections. Public pages centre a column instead: 896px proposal, 768px report, 512px approval, 384px login and modals. The proposal's summary sidebar is sticky at 24px from the top. Tables are avoided — everything is a list of rounded rows.

**Imagery.** There is none, by design: no stock photography, no illustration, no AI imagery. The only bitmaps are the Instaby logo and client logos uploaded by the agency — which are shown **grayscale at 80% opacity** in the proposal marquee, and full-colour as 40px rounded avatars in the client list. Clients without a logo get their initials on a 10% tint of their colour.

---

## Iconography

**lucide is the entire icon system** — `lucide-react@0.451.0` in the product, no other icon source, no custom SVG set, no icon font, no PNG icons. Sizes are small and specific: 11, 13, 14, 15, 16, 17, 18px (26px once, on the report's growth arrow). Default stroke width 2; the sidebar uses 1.75.

For mocks and artifacts, load the same set from CDN and use the `Icon` wrapper in `components/core/`:

```html
<script src="https://unpkg.com/lucide@0.451.0/dist/umd/lucide.js"></script>
```

```jsx
<Icon name="layout-grid" size={17} strokeWidth={1.75} />
```

The icons are never decorative on their own: each one either sits in a `${hex}1A` tinted tile (categories, metrics, activity) or immediately precedes a label at the same optical weight. Frequently used: `layout-grid, users, user-plus, calendar, calendar-clock, check-square, film, clock, wallet, bar-chart-3, arrow-up-circle, arrow-down-circle, trophy, package, package-2, file-text, file-signature, settings, search, bell, plus, minus, trash-2, chevron-down/left/right, x, eye, eye-off, target, trending-up, trending-down, sparkles, zap, alert-triangle, shield-check, award, star, message-circle, download, check, upload-cloud, instagram, music-2, facebook, camera, video, palette, megaphone, lightbulb`.

**Unicode as glyph** is used in three places and should be kept: `✓` in the "Por que a Instaby?" checklist, `◆` / `○` in priority labels, `•••••• ` for masked money, `→` at the end of forward links ("Ver o material →"). Emoji are used as described in Content fundamentals — never as a substitute for a lucide icon in UI chrome.

**No logo was reconstructed.** `assets/logo.png` is the file shipped in the product; `assets/logo-lockup-tagline.png` is the uploaded lockup, cropped. The lockup is a flattened PNG with no alpha whose "INSTA" block is white, so it only reads on a light ground — use `assets/logo.png` on dark surfaces.

---

## Index

**Root**
- `styles.css` — the entry point consumers link. Imports only.
- `readme.md` — this guide.
- `SKILL.md` — Agent Skills front matter for use in Claude Code.
- `thumbnail.html` — homepage tile.

**`tokens/`** — `colors.css` (surfaces, ink, semantic, categorical, status, urgency, social, aliases) · `typography.css` (stacks, sizes, weights, roles) · `spacing.css` (space scale, radii, control and layout sizes) · `effects.css` (shadows, blur, motion, scrims) · `base.css` (body reset, scrollbars, `.glass`, `.tabular`, keyframes).

**`assets/`** — `logo.png` (primary, for dark grounds) · `logo-lockup-tagline.png` (light-ground lockup with "agência de marketing digital").

**`components/`**
- `core/` — `Button`, `Card` + `IconTile`, `Badge` + `StatusDot` + `TintPill`, `Icon`
- `forms/` — `Input` + `Textarea` + `Label` + `Select`, `CurrencyInput`, `DatePicker`, `SeletorCor`, `UploadLogo`
- `feedback/` — `EmptyState`, `CountUp`, `BotaoOcultarValores` + `ValorSensivel`, `BarraCarregamentoDiscreta`, `PageTransitionLoading`
- `layout/` — `Sidebar` (+ the four menu arrays), `Header`
- `data/` — `MetricCard`, `TarefaRow`, `PipelineColuna`

Each directory has a `@dsCard` HTML showing its variants, and each component a `.d.ts` props contract and a `.prompt.md` usage note.

**Intentional additions** (not 1:1 files in the codebase, added because the kit needs them):
- `Icon` — a wrapper over lucide, because the product imports `lucide-react` directly and browser mocks can't.
- `IconTile`, `StatusDot`, `TintPill` — the `${hex}1A` tinted tile and the two dot/pill treatments are repeated inline dozens of times in the codebase; extracting them keeps kit code honest to the original values.
- `Select` — the app uses raw `<select>` elements with the same field styling as `Input`.
- `MetricCard`, `TarefaRow`, `PipelineColuna` — lifted from `components/dashboard/` because they recur across screens.

**`guidelines/`** — 24 specimen cards, grouped Colors / Type / Spacing / Effects / Brand, that populate the Design System tab.

**`ui_kits/`**
- `painel/` — login, dashboard, clients, financials, sales pipeline; clickable. See its README for the source-file map.
- `paginas-publicas/` — proposal, performance report, content approval; clickable. See its README.

## Known gaps

- The 12 uploaded screenshots could not be read (filename encoding). Nothing was inferred from them.
- No slide template or deck was provided, so there is no Slides group.
- Agenda, Tarefas (calendar), Conteúdo, Horas, DRE, Serviços, Pacotes, Orçamentos, Contratos, Configurações, and the public Contrato/Onboarding pages are documented but not recreated as screens.
- Client logo bitmaps were not provided; the proposal marquee falls back to client names.
