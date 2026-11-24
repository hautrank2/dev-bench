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
- src/routes/: dashboard and its _components; complex components use
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
  No renderer filesystem, process, shell or generic IPC access.
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
- Theme: Clarity-inspired enterprise UI, navy header, neutral sidebar, flat
  white cards, clear borders and small corners. Dark uses navy/slate surfaces.
  Keep NestJS primary #f23551 in both modes and Lucide icons. Retain
  shadcn/Radix/Tailwind; no Angular/Clarity dependency. FieldLabel always stays
  above controls; never floating labels. Segoe UI with offline Be Vietnam Pro
  fallback. System/light/dark modes;
  migrate blueDark to dark. One sidebar dropdown shows the current mode;
  no separate Themes/mode navigation. Sidebar collapses to an icon rail and
  remembers its state. Settings retains independent terminal/log palettes.
  Layout: full-height sidebar owns the brand; content column owns header
  and scrolling body. Collapse/expand control belongs in the header.
  Header remains 50px with a navy surface; no header theme toggle.
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
- Sidebar: Dashboard, expandable Projects, Processes, Ports, Stats,
  Utilities, read-only Hosts, Config Files, Settings. Project list has saved
  Card/Table modes. Only expose implemented navigation, no placeholder tools.
- Sessions are per-device; token encrypted in main, only hash on server.
  Server reads/writes are always scoped to the authenticated account.
- Offline export/import; migrate JSON v1. Terminal/stop have OS adapters.
  macOS packaging/testing requires macOS; never claim checks not run.
- Main resolves saved project by ID for each action. Validate IPC input and
  sender; context isolation, sandbox on, Node integration off.
- Windows shell commands have separate cwd; support pnpm.cmd.
  Stop only dashboard-owned process trees. Running means live process,
  not HTTP readiness. Per-project lock covers Run and Run All.
- Serialize Git writes per actual checkout. Git argv are separate strings.
  Preserve hooks, staged data, Unicode paths/messages and authentication.
- Pull fast-forward only. Push HEAD to resolved upstream, never force.
  Show final staged list before commit; refresh on failure, retain message.
  Never automatically stage/commit/pull/push real projects.
- Quit with live owned processes offers Stop All and Quit / Cancel.
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
