import {
  Check,
  Cloud,
  Download,
  HardDrive,
  Laptop,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sun,
  Terminal,
  Upload,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Controller } from "react-hook-form";

import { terminalThemeSchema, themeSchema } from "@shared/workspace";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

import { useSettings } from "./hook";
import type { SettingsProps } from "./type";

export const Settings = (props: SettingsProps) => {
  const state = useSettings(props);
  const selectedSet = state.workspace.data?.sets.find(
    (set) => set.id === state.workspace.data?.activeSetId,
  );
  return (
    <div className="settings-root min-h-full">
      <div className="settings-layout mx-auto flex max-w-[1440px] gap-8 px-5 py-8 sm:px-8">
        <main className="settings-main min-w-0 max-w-4xl flex-1 space-y-8 pb-16">
          <div className="settings-heading space-y-2 border-b pb-6">
            <Link
              to="/projects"
              className="inline-flex text-xs text-muted-foreground hover:text-foreground"
            >
              Back to projects
            </Link>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              Your workspace, your way
            </p>
            <h1 className="text-3xl">Settings</h1>
            <p className="text-muted-foreground">
              A familiar place to work, on every machine.
            </p>
          </div>
          <div className="settings-section-links flex flex-wrap gap-2">
            {["appearance", "terminal", "projects", "account"].map(
              (section) => (
                <Button
                  key={section}
                  variant={state.section === section ? "secondary" : "ghost"}
                  size="sm"
                  className="capitalize"
                  onClick={() => state.scrollTo(section)}
                >
                  {section === "projects"
                    ? "Project sets"
                    : section === "account"
                      ? "Account & backup"
                      : section}
                </Button>
              ),
            )}
          </div>
          {state.error && (
            <div
              role="alert"
              className="settings-error whitespace-pre-wrap rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-destructive"
            >
              {state.error}
            </div>
          )}
          {state.workspace.error && (
            <p role="alert" className="text-destructive">
              {state.workspace.error.message}
            </p>
          )}

          <section
            id="settings-appearance"
            className="settings-appearance scroll-mt-20 space-y-5"
          >
            <div>
              <h2 className="text-xl">Appearance</h2>
              <p className="mt-1 text-muted-foreground">
                Quiet surfaces. A little personality.
              </p>
            </div>
            <div
              className="grid gap-3 sm:grid-cols-3"
              aria-label="Application theme"
            >
              {[
                {
                  value: "system",
                  label: "System",
                  icon: Monitor,
                  description: "Follow your device",
                },
                {
                  value: "light",
                  label: "Light",
                  icon: Sun,
                  description: "A clean, bright canvas",
                },
                {
                  value: "dark",
                  label: "Dark",
                  icon: Moon,
                  description: "Made for late nights",
                },
              ].map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${label} appearance`}
                  aria-pressed={state.theme.theme === value}
                  onClick={() => state.theme.setTheme(themeSchema.parse(value))}
                  className={cn(
                    "panel-surface flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-ring",
                    state.theme.theme === value
                      ? "border-primary ring-1 ring-primary/30"
                      : "hover:border-input",
                  )}
                >
                  <span className="flex w-full items-center justify-between">
                    <Icon className="size-5 text-muted-foreground" />
                    {state.theme.theme === value && (
                      <Check className="size-4 text-primary" />
                    )}
                  </span>
                  <span className="font-semibold">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                </button>
              ))}
            </div>
            <div className="settings-type-preview panel-surface flex flex-wrap items-center justify-between gap-5 rounded-xl border p-5">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">
                  TYPEFACE / BE VIETNAM PRO
                </p>
                <p className="text-lg font-medium">Designed to feel at home.</p>
                <p className="mt-2 text-sm text-muted-foreground" lang="vi">
                  Tiếng Việt rõ ràng — từ ý tưởng đến sản phẩm.
                </p>
              </div>
              <span className="text-4xl font-semibold tracking-tight">Aa</span>
            </div>
          </section>

          <section
            id="settings-terminal"
            className="settings-terminal scroll-mt-20 space-y-5 border-t pt-7"
          >
            <div>
              <h2 className="text-xl">Terminal</h2>
              <p className="mt-1 text-muted-foreground">
                Choose a separate palette for in-app logs and output.
              </p>
            </div>
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              aria-label="Terminal theme"
            >
              {[
                { value: "app", label: "Follow app" },
                { value: "midnight", label: "Midnight" },
                { value: "paper", label: "Paper" },
                { value: "rose", label: "Rose" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${label} terminal theme`}
                  aria-pressed={state.theme.terminalTheme === value}
                  onClick={() =>
                    state.theme.setTerminalTheme(
                      terminalThemeSchema.parse(value),
                    )
                  }
                  className={cn(
                    "overflow-hidden rounded-xl border text-left",
                    state.theme.terminalTheme === value
                      ? "border-primary ring-1 ring-primary/30"
                      : "hover:border-input",
                  )}
                >
                  <span
                    data-terminal-theme={value}
                    className="flex h-16 items-center gap-2 bg-terminal-background px-4 font-mono text-xs text-terminal-foreground"
                  >
                    <span className="text-terminal-muted">❯</span>pnpm dev
                  </span>
                  <span className="flex items-center justify-between border-t bg-card px-4 py-3 text-xs">
                    {label}
                    {state.theme.terminalTheme === value && (
                      <Check className="size-3.5 text-primary" />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div
              data-terminal-theme={state.theme.terminalTheme}
              className="settings-terminal-preview overflow-hidden rounded-xl border bg-terminal-background text-terminal-foreground"
            >
              <div className="flex items-center gap-2 border-b px-4 py-3 text-xs text-terminal-muted">
                <Terminal className="size-3.5" />
                Output preview <span className="ml-auto">JetBrains Mono</span>
              </div>
              <pre className="overflow-x-auto p-5 text-xs leading-7">
                <span className="text-terminal-muted">
                  $ pnpm run dev{"\n"}
                </span>
                Dev server ready on http://localhost:3000{"\n"}
                <span lang="vi">✓ Dự án đã sẵn sàng</span>
                {"\n"}
                <span className="text-terminal-error">
                  Example stderr: port 3000 is already in use.
                </span>
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              External terminals keep their own appearance settings.
            </p>
          </section>

          <section
            id="settings-projects"
            className="settings-project-sets scroll-mt-20 space-y-5 border-t pt-7"
          >
            <div>
              <h2 className="text-xl">Project sets</h2>
              <p className="mt-1 text-muted-foreground">
                Different machines, different folders. Keep each setup together.
              </p>
            </div>
            <div className="panel-surface space-y-4 rounded-xl border p-5">
              <div className="flex items-center gap-3">
                <Laptop className="size-5 text-muted-foreground" />
                <div>
                  <h4>{state.workspace.data?.deviceName ?? "This device"}</h4>
                  <p className="text-xs text-muted-foreground">
                    Configuration is stored locally and works offline.
                  </p>
                </div>
              </div>
              <label
                htmlFor="project-set"
                className="block text-sm font-medium"
              >
                Active project set
              </label>
              <Select
                value={state.workspace.data?.activeSetId}
                onValueChange={(id) => void state.selectSet(id)}
                disabled={!!state.busy}
              >
                <SelectTrigger id="project-set" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {state.workspace.data?.sets.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.name} · {set.projectCount} projects
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <form onSubmit={state.createSet} noValidate>
                <FieldSet disabled={!!state.busy}>
                  <FieldLegend className="sr-only">
                    Create a project set
                  </FieldLegend>
                  <FieldGroup>
                    <Controller
                      control={state.setForm.control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor="set-name">Set name</FieldLabel>
                          <Input
                            {...field}
                            id="set-name"
                            placeholder="Work laptop, Personal Mac, Side projects…"
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </FieldSet>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!!state.busy}
                    onClick={() => void state.renameSet()}
                  >
                    Rename active set
                  </Button>
                  <Button
                    type="submit"
                    loading={state.busy === "create"}
                    disabled={!!state.busy}
                  >
                    <Plus />
                    Create set
                  </Button>
                </div>
              </form>
              <p className="text-xs text-muted-foreground">
                Stop running projects before switching sets. Importing creates a
                new set.
              </p>
            </div>
            <div className="settings-local-backup flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
              <div>
                <h4 className="flex items-center gap-2">
                  <HardDrive className="size-4" />
                  Local export & import
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Save a JSON copy before resetting your machine.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!!state.busy}
                  onClick={() => void state.importFile()}
                >
                  <Download />
                  Import JSON
                </Button>
                <Button
                  variant="outline"
                  disabled={!!state.busy}
                  onClick={() => void state.exportFile()}
                >
                  <Upload />
                  Export JSON
                </Button>
              </div>
            </div>
          </section>

          <section
            id="settings-account"
            className="settings-account scroll-mt-20 space-y-5 border-t pt-7"
          >
            <div>
              <h2 className="text-xl">Account & backup</h2>
              <p className="mt-1 text-muted-foreground">
                Your setups, ready when you need them again.
              </p>
            </div>
            <div className="panel-surface space-y-5 rounded-xl border p-5">
              <form
                onSubmit={state.saveServer}
                noValidate
                className="settings-server-form space-y-3"
              >
                <FieldSet disabled={!!state.busy}>
                  <FieldLegend className="sr-only">Backup server</FieldLegend>
                  <FieldGroup>
                    <Controller
                      control={state.serverForm.control}
                      name="apiUrl"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor="backup-api-url">
                            Backup server URL
                          </FieldLabel>
                          <Input
                            {...field}
                            id="backup-api-url"
                            placeholder="https://backup.example.com"
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </FieldSet>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    type="submit"
                    disabled={!!state.busy}
                    loading={state.busy === "server"}
                  >
                    Save server
                  </Button>
                </div>
              </form>
              <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-5">
                <div>
                  <h4>
                    {state.cloud.data?.account?.name ?? "Sign in with Google"}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {state.cloud.data?.account?.email ??
                      "Create your account with Google to keep backups of all your machines."}
                  </p>
                </div>
                {state.cloud.data?.account ? (
                  <Button
                    variant="outline"
                    disabled={!!state.busy}
                    onClick={() => void state.signOut()}
                  >
                    <LogOut />
                    Sign out
                  </Button>
                ) : state.cloud.data?.signingIn || state.busy === "sign-in" ? (
                  <Button
                    variant="outline"
                    onClick={() => void state.cancelSignIn()}
                  >
                    Cancel sign-in
                  </Button>
                ) : (
                  <Button
                    disabled={!!state.busy || !state.cloud.data?.apiUrl}
                    onClick={() => void state.signIn()}
                  >
                    <LogIn />
                    Continue with Google
                  </Button>
                )}
              </div>
              {(state.cloud.data?.signingIn || state.busy === "sign-in") && (
                <p role="status" className="text-sm text-muted-foreground">
                  Finish signing in in your browser, then return here.
                </p>
              )}
              <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                Backups include paths, commands and appearance. Source files,
                process logs and credentials stay on your machine. Review
                command strings before sharing an export.
              </p>
            </div>
            <div className="settings-cloud-backups overflow-hidden rounded-xl border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
                <div>
                  <h4>Saved configurations</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Restore a snapshot to a new set on any machine.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Refresh cloud backups"
                    disabled={!state.cloud.data?.account || !!state.busy}
                    onClick={() => void state.backups.refetch()}
                  >
                    <RefreshCw />
                  </Button>
                  <Button
                    disabled={!state.cloud.data?.account || !!state.busy}
                    loading={state.busy === "backup"}
                    onClick={() => void state.backup()}
                  >
                    <Cloud />
                    Back up current set
                  </Button>
                </div>
              </div>
              {!state.cloud.data?.account && (
                <p className="px-5 py-10 text-center text-muted-foreground">
                  Sign in to view your saved configurations.
                </p>
              )}
              {state.cloud.data?.account && state.backups.isPending && (
                <p role="status" className="p-5">
                  Loading backups…
                </p>
              )}
              {state.backups.error && (
                <p role="alert" className="p-5 text-destructive">
                  {state.backups.error.message}
                </p>
              )}
              {state.cloud.data?.account &&
                state.backups.data?.length === 0 && (
                  <p className="px-5 py-10 text-center text-muted-foreground">
                    No backups yet. Save “{selectedSet?.name}” to get started.
                  </p>
                )}
              {state.backups.data?.map((backup) => (
                <article
                  key={backup.id}
                  data-backup-id={backup.id}
                  className="settings-backup-row flex flex-wrap items-center justify-between gap-4 border-t p-5"
                >
                  <div className="min-w-0">
                    <h5>{backup.name}</h5>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {backup.sourceDevice} · {backup.platform} ·{" "}
                      {backup.projectCount} projects
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(backup.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!state.busy}
                    onClick={() => void state.restore(backup.id)}
                  >
                    <Download />
                    Preview restore
                  </Button>
                </article>
              ))}
            </div>
          </section>
          <p className="settings-footer flex items-center gap-2 text-xs text-muted-foreground">
            <Settings2 className="size-3.5" />
            Appearance is saved automatically on this device.
          </p>
        </main>
      </div>
      <Dialog
        open={!!state.preview}
        onOpenChange={(open) => {
          if (!open && !state.busy) state.setPreview(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Import project set</DialogTitle>
            <DialogDescription>
              Review this configuration before creating a new local set.
            </DialogDescription>
          </DialogHeader>
          {state.preview && (
            <div className="settings-import-preview space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4">
                <h4>{state.preview.snapshot.set.name}</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  From {state.preview.snapshot.sourceDevice} ·{" "}
                  {state.preview.snapshot.set.projects.length} projects ·{" "}
                  {state.preview.snapshot.set.repositories.length} repositories
                </p>
              </div>
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {state.preview.snapshot.set.repositories.map((project) => (
                  <div key={project.id} className="rounded-lg border p-3">
                    <h5>
                      {
                        state.preview?.snapshot.set.projects.find(
                          (group) => group.id === project.groupId,
                        )?.name
                      }{" "}
                      / {project.name}
                    </h5>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {project.folder}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {project.command || "No command configured"}
                    </p>
                  </div>
                ))}
              </div>
              {state.preview.missingFolders.length > 0 && (
                <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning-ink">
                  {state.preview.missingFolders.length} project folders are
                  unavailable on this machine. You can fix their paths in Edit
                  Repository after importing.
                </p>
              )}
              <Field orientation="horizontal">
                <Checkbox
                  id="restore-appearance"
                  checked={state.restoreAppearance}
                  onCheckedChange={(value) =>
                    state.setRestoreAppearance(value === true)
                  }
                />
                <FieldLabel htmlFor="restore-appearance">
                  Also restore appearance and terminal theme
                </FieldLabel>
              </Field>
              <p className="text-xs text-muted-foreground">
                Your existing sets are kept. Commands will not run when
                imported.
              </p>
            </div>
          )}
          {state.error && <FieldError errors={[{ message: state.error }]} />}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={!!state.busy}
              onClick={() => state.setPreview(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={!!state.busy}
              loading={state.busy === "confirm-import"}
              onClick={() => void state.confirmImport()}
            >
              Import as new set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
