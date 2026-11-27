# Global Rules — DevBench

Desktop dashboard for local projects and per-machine configuration backups.
Source of truth: dev-bench-spec.md plus latest docs/product-model.md.
UI supports English (default) and Vietnamese, selected in Settings;
preserve the terms project, port and Dashboard, proper names, paths and commands.
communication and delivery documentation are Vietnamese.

@docs/rules/source-code-rule.md
@docs/rules/complex-component-rule.md

## Stack and structure

- Electron + React 19 + Vite + TypeScript strict + Tailwind CSS v4.
- shadcn/ui on Radix, lucide-react, React Hook Form + Zod.
- pnpm only. TanStack Query for IPC data, TanStack Router for navigation,
  React Context for shared settings. No Zustand or MUI.
- electron/: main, preload, IPC and OS/Git/process/config services.
- shared/: Zod contracts, schemas and inferred types across processes.
- src/app/: Next.js-style file routing (page.tsx, layout.tsx, [param], (group),
  _private; see src/lib/file-router.tsx). Features in _projects/_inspect; complex components use
  index.tsx, hook.ts, type.ts. src/components/ui/: shadcn primitives.
- src/api/api-list/: typed renderer action functions via preload bridge.
- src/providers/, src/lib/, src/types/, src/utils/: shared code.
- tests/: isolated integration fixtures. docs/: setup and verification.

## Adaptations of imported reusable rules

- Vite/Electron, not Next.js: no Server Components, App Router or use client.
- Backend lives in the separate `dev-bench-server` repo (ASP.NET Core .NET 10 +
  MongoDB). This repo contains only the Electron desktop and React renderer.
  Desktop OAuth coordination, HTTP and encrypted sessions belong in main;
  renderer uses IPC. Never ship MongoDB credentials or Google client secrets.
  See docs/cloud-setup.md and docs/verification-repo-split.md.
- Internal aliases: ~/ for src/, @shared/ for shared/.
- Renderer uses typed action-specific IPC instead of axios/httpClient.
  No renderer filesystem, process, shell or generic IPC access, with one
  exception: the repository Terminal tab. Its IPC takes a saved repository ID,
  keystrokes and a size; main picks the shell and folder (node-pty).
- Shared main/renderer types live in shared/; UI shared types in src/types/.
  Component schemas and all props in type.ts.
- Reuse primitives from front-end-origin after inspecting dependencies.
  This permits adapting existing shadcn components rather than downloading
  equivalents. Use Radix consistently, not Base UI props.
- Body font 14px; headings use src/typoset.css inside @layer base.
- Localization: shared/i18n.ts and shared/locales/vi.ts hold messages; renderer
  uses the locale Context, main synchronizes native dialogs through locale IPC.
  Never translate internal enums, user names/data or external process/Git output.
- App brand: custom terminal SVG in src/assets/dev-bench.svg; generated PNG/ICO
  in build/. Sidebar, favicon, native window and Windows package share this mark.
  Other UI icons remain Lucide. See scripts/generate-icons.mjs to regenerate.
- Theme: VS Code-inspired neutral workbench. Dark follows the supplied
  reference: #282c34 editor/content, #21252b sidebar/header, subtle #343943 borders.
  Light uses a soft #f7f8fb canvas, white cards and neutral gray chrome.
  Dark cards lift slightly to #2c313b. Cards have subtle borders and shadows,
  8px base corners (12px large, 16px extra-large).
  Dashboard/Stats use rose/lilac/mint/sand cards with real numbers. Project
  cards use the existing project presentation without an image field.
  Project forms contain name and description; do not add cover upload or persistence.
  Buttons follow the supplied MUI visual reference (retain the app's 8px corners, contained
  elevation, primary outlined/text styles, no uppercase transform). Fields use
  8px corners, tinted surfaces, fine borders and soft shadows from --field-*.
  Use primary for main actions, outline for secondary actions and text for
  Cancel/Edit/light navigation; retain secondary, neutral and status variants.
  Keep deep teal primary #0f766e with white button text in both modes and Lucide icons (solid companion
  glyphs for active sidebar items). Active sidebar items use a light primary
  tint and keep the normal text/icon colors. Primary-colored text and outlines use
  primary-ink (lighter teal in Dark). Retain
  shadcn/Radix/Tailwind; no Angular/Clarity dependency. FieldLabel always stays
  above controls; never floating labels. Segoe UI with offline Be Vietnam Pro
  fallback. Settings also offers Be Vietnam Pro and JetBrains Mono UI fonts;
  persist locally and include in JSON appearance backups. Backups without a
  font preserve the current choice; the server currently omits that field.
  Logs remain monospace. System/light/dark modes;
  migrate blueDark to dark. One sidebar dropdown shows the current mode;
  no separate Themes/mode navigation. Sidebar collapses to an icon rail and
  remembers its state. Settings retains four independent terminal/log palettes:
  Dark (midnight, default and first), White (paper), Dracula and Rose. Cloud
  backups send Dracula as "app" because the API predates it.
  Keep valid saved choices. Sidebar has a soft, theme-aware shadow.
  Layout: full-height sidebar owns the brand; content column owns header
  and scrolling body. Collapse/expand control belongs in the header.
  Header remains 50px with theme-aware neutral chrome; no header theme toggle.
- Local .claude/rules replace source-project details and conflicting rules.

## Domain and boundaries

- Stable project ID; JSON configuration in Electron userData, validated and
  atomically written. Persist configuration only, never process state.
- Multiple named sets per device; explicit cloud snapshots per Google
  account and source machine. No remote execution or automatic overwrites.
  Restore creates a new local set, checks schema, never runs commands.
- Hierarchy: account -> device project set -> project -> repositories/services.
  A project is a group (OpsDesk); client/server/mobile/broker each have their
  own folder, command, URL, process and Git checkout. Runtime/Git actions
  target repository IDs; group actions aggregate results without merging Git.
- Sidebar repo links open a dedicated repo route with Logs (default) and
  Terminal tabs plus existing repo actions. Project and repository pages have
  no project set selector. One interactive shell per repository starts in its
  folder when the tab opens, survives navigation and is closed on quit or
  folder change. Repositories whose Git remote has a web page offer Open
  GitHub / GitLab / repository; the link is rebuilt from host and path so URL
  credentials are never opened.
  Scope all actions by the selected repo ID; show a missing-repo state when it
  does not belong to the active project/set.
- Projects and repositories are reordered on the sidebar tree by drag and drop
  or the right-click Move items; a repository can move to another project when
  it is not active. The saved array order drives every list.
- Changing a repository folder or working directory suggests Run command and
  Web URL from package.json, .NET project or Compose files (read only, nothing
  runs; from .env files only the PORT number). It never overwrites typed values.
- Browse opens at the last folder chosen with it (userData/last-folder.json,
  per machine, never exported).
- The tree's right-click menu offers the same actions as the Projects page:
  Run/Stop, Open Web/remote, Open Terminal, Copy Path and a Git submenu for a
  repository; Run/Stop project and Add Repository for a project. Stop buttons
  and menu items use the destructive color.
- Messages: action results and errors raise a toast (useNotify /
  useActionNotify), never an inline result box on the page. Errors and results
  with output are also kept by MessagesProvider and opened from the header bell:
  expand for detail, delete one or all. Memory only (max 200, detail trimmed),
  never persisted, so closing the app empties it. Dialogs, forms, Logs and
  Terminal keep their own inline errors.
- Sidebar: expandable Projects (/ redirects to /projects), Ports, Stats,
  Utilities, read-only Hosts, Config Files, Settings. Project list has saved
  Card/Table modes. Only expose implemented navigation, no placeholder tools.
  The removed Processes URL redirects to Projects for old links. Tables use
  .table-scroll with a sticky opaque header and max-height min(65vh, 640px);
  nested repository tables use min(40vh, 320px) and their own sticky header.
- Sessions are per-device; token encrypted in main, only hash on server.
  Server reads/writes are always scoped to the authenticated account.
- Offline export/import; migrate JSON v1. Terminal/stop have OS adapters.
  macOS packaging/testing requires macOS; never claim checks not run.
- Main resolves saved project by ID for each action. Validate IPC input and
  sender; context isolation, sandbox on, Node integration off.
- Windows shell commands have separate cwd; support pnpm.cmd.
  Repositories accept optional workingDirectory (max 4096): blank uses folder,
  relative resolves from folder, absolute uses that path. Run/Run All use it;
  Git, Copy Path and Open Terminal keep folder. Persist it in local/JSON/cloud
  backups, lock edits while active, and warn about missing run folders on restore.
  Stop only dashboard-owned process trees. Running means live process,
  not HTTP readiness. Per-project lock covers Run and Run All.
- Serialize Git writes per actual checkout. Git argv are separate strings.
  Preserve hooks, staged data, Unicode paths/messages and authentication.
- Pull fast-forward only. Push HEAD to resolved upstream, never force.
  Show final staged list before commit; refresh on failure, retain message.
  Never automatically stage/commit/pull/push real projects.
- Quit with live owned processes offers Stop All and Quit / Cancel.
  A terminal in which a command was entered also asks before quitting.
- Missing tools, moved folders and errors remain visible and recoverable.

## Verification

- pnpm typecheck, pnpm test, pnpm build before claiming completion.
- pnpm dist:win creates NSIS installer. Never invent passing checks.
- Git tests use temporary repositories and bare remotes only.
- Record actual Windows checks and outstanding manual installed-app checks
  in docs/verification.md. Build success is not installation verification.
- No secrets, runtime user configuration or machine paths in bundles.

## Agent behaviour

- Outline multi-file work before editing. IMPLEMENTATION_PLAN.md is the
  current plan; proceed with the user's request without a separate plan gate.
- Complete authorized implementation and appropriate checks autonomously.
- Ask only for information that cannot be inferred/read locally.
- Report changes, checks and remaining limits concisely.
