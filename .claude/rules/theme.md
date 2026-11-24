# Theme — DevBench

Tokens in src/index.css. Reference: https://clarity.design/ — navy header,
neutral sidebar, flat white cards, clear borders, small corners and compact UI.
Keep NestJS primary #f23551 in Light and Dark, shadcn/Radix/Tailwind and Lucide.
Never install Angular/Clarity components. No gradients, floating labels or glass.
Brand asset exception: the custom terminal logo may use a subtle primary-color
gradient; keep all application surfaces flat and keep other icons from Lucide.
Segoe UI with self-hosted Be Vietnam Pro fallback; logs use JetBrains Mono.
ThemeProvider applies system/light/dark. Migrate old blueDark to dark.

- One sidebar dropdown displays Light/Dark/System and checks the selected
  preference. Remove separate Themes and cycle-mode navigation. Settings
  appearance tiles remain synchronized. No header theme toggle.
- Sidebar has an accessible collapse/expand button, persisted locally;
  collapsed items keep accessible labels and hover titles. Mobile stays full.
- Sidebar spans viewport height and contains the logo. Header and body are
  inside the adjacent content column; collapse/expand button is in header.
- Terminal/log palette is independent: follow app, midnight, paper or rose.
  Applies to in-app output, not external terminal preferences.
- Header height --header-height = 50px, navy with dedicated foreground tokens.
- Sidebar selected: bg-sidebar-accent text-sidebar-accent-foreground.
- dark: follows .dark; respect reduced motion.
- Use semantic tokens, no raw Tailwind palette/hex in components.
- secondary is a soft surface, primary/info are accents.
- Success, warning, warning-ink and info are status tokens.
  Light warning text uses text-warning-ink.
- Declare tokens in light/dark and map in @theme inline. Ensure readable
  foreground on the requested primary color.
- Canvas/chart code, if added, reads resolved computed CSS tokens.
