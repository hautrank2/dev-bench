# Theme — Dev Bench

Tokens in src/index.css. Latest supplied reference: clean rounded dashboard,
pale gray canvas, solid white sidebar/cards, subtle borders and shadows.
Replace the reference's green accent with NestJS primary #f23551 in both
Light and Dark. Dark uses neutral slate surfaces. No cyan/peach canvas or
frosted cards. A deeper rose gradient can highlight the first statistic.
Self-host Be Vietnam Pro with Vietnamese/Latin glyphs; logs use JetBrains Mono.
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
- Header height --header-height = 50px, solid bg-card.
- Sidebar selected: bg-sidebar-accent text-sidebar-accent-foreground.
- dark: follows .dark; respect reduced motion.
- Use semantic tokens, no raw Tailwind palette/hex in components.
- secondary is a soft surface, primary/info are accents.
- Success, warning, warning-ink and info are status tokens.
  Light warning text uses text-warning-ink.
- Declare tokens in light/dark and map in @theme inline. Ensure readable
  foreground on the requested primary color.
- Canvas/chart code, if added, reads resolved computed CSS tokens.
