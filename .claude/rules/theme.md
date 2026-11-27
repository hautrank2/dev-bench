# Theme — DevBench

Tokens in src/index.css. Reference: the user's VS Code screenshot — charcoal
content (#282c34), darker sidebar/header (#21252b), borders #343943 in Dark.
Light uses a soft #f7f8fb content canvas, white cards and neutral gray chrome.
Dark retains the editor canvas and uses slightly lifted #2c313b cards.
Use 8px base corners (12px large, 16px extra-large) and compact UI in both modes.
Dashboard/Stats cards use rose/lilac/mint/sand tones, dark icon tiles, large
real values and ratio bars only where the data supports a meaningful ratio.
Project forms contain name and description, without card image selection or storage.
Keep deep teal primary #0f766e in Light and Dark, shadcn/Radix/Tailwind and Lucide.
Primary buttons use white foreground in both modes.
Primary-colored text, icons and outlines use primary-ink (#5eead4 in Dark). Desktop/mobile sidebar has a soft shadow.
Buttons follow the supplied MUI reference without a MUI dependency: contained
uses elevation, outlined uses a primary-tinted border and transparent background,
text uses a subtle hover tint. Use sentence case, the app's 8px corners and medium weight.
Use primary for main actions/submits, outline for secondary actions, and text
for Cancel, Edit and light navigation. Keep neutral, secondary and status variants.
Inputs, textareas and select triggers follow the second supplied reference:
the app's 8px corners, lightly tinted background, fine neutral border and subtle shadow.
Use --field-* tokens for Light/Dark and retain primary focus and error states.
No new UI framework, floating labels or glass. Card artwork/stat tints and
photo legibility overlays may use gradients, per the supplied card references.
Brand asset exception: the custom terminal logo may use a subtle primary-color
gradient; keep other application surfaces restrained and other icons from Lucide.
Segoe UI with self-hosted Be Vietnam Pro fallback; logs use JetBrains Mono.
Settings offers System default, Be Vietnam Pro and JetBrains Mono for the UI.
Persist DEV_BENCH_FONT_FAMILY locally; include fontFamily in JSON appearance backups.
Missing fontFamily in older/cloud backups preserves the current local choice.
The current server normalizer omits this field. Logs keep their mono font.
ThemeProvider applies system/light/dark. Migrate old blueDark to dark.

- One sidebar dropdown displays Light/Dark/System and checks the selected
  preference. Remove separate Themes and cycle-mode navigation. Settings
  appearance tiles remain synchronized. No header theme toggle.
- Sidebar has an accessible collapse/expand button, persisted locally;
  collapsed items keep accessible labels and hover titles. Mobile stays full.
- Sidebar spans viewport height and contains the logo. Header and body are
  inside the adjacent content column; collapse/expand button is in header.
- Terminal/log palette has exactly four choices in order: Dark (midnight),
  White (paper), Dracula, Rose. Default to midnight for absent/invalid local preference
  (including the removed "app"); keep valid saved choices. Paper uses a pure
  white background in both modes. Dracula also defines --terminal-ansi-* tokens.
  Applies to in-app output and the embedded terminal, not external terminals.
- Settings offers the embedded terminal cursor: Line (default), Block or
  Underline, plus blinking (on by default). Stored per device in
  DEV_BENCH_TERMINAL_CURSOR(_BLINK); not part of JSON appearance backups.
- Sidebar repository links open /projects/$projectId/repositories/$repositoryId:
  show that repository's actions and Logs / Terminal tabs, never group-wide
  Run/Stop.
  Restoring a repository URL expands its project tree. Follow output only
  scrolls the log container, never the full page.
- Header height --header-height = 50px, theme-aware with dedicated foreground tokens.
- Sidebar selected: bg-sidebar-accent is a light primary tint; text and icons
  keep their normal colors. Repository dots always show runtime status.
  Active navigation uses solid Lucide-compatible glyphs in sidebar-icon.tsx;
  inactive navigation remains outline. Apply to expanded, collapsed and mobile.
  Active items have a 1px primary border (inset outline) and no item shadow.
- Sidebar items hover with bg-primary/10. While dragging in the project tree,
  the divider div between rows is colored (primary-ink); dropping into a
  project tints its row with bg-primary/10. No drag borders or outlines.
- Stop and Stop project use the destructive button variant and menu item.
- dark: follows .dark; respect reduced motion.
- Scrollbars are 6px in Electron on both axes, with 40%-opacity primary thumbs and clear
  tracks. Keep xterm's custom scrollbar narrow and its normal/hover/active
  slider colors synchronized with primary. Other browsers use thin fallback.
- Use semantic tokens, no raw Tailwind palette/hex in components.
- secondary is a soft surface, primary/info are accents.
- Success, warning, warning-ink and info are status tokens.
  Light warning text uses text-warning-ink.
- Declare tokens in light/dark and map in @theme inline. Ensure readable
  foreground on the requested primary color.
- Canvas/chart code, if added, reads resolved computed CSS tokens.
