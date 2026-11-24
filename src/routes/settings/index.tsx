import { Link } from "@tanstack/react-router";
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
import { useLocale } from "~/providers/locale/context";

import { useSettings } from "./hook";
import type { SettingsProps } from "./type";

export const Settings = (props: SettingsProps) => {
  const { t, language, setLanguage, dateLocale } = useLocale();

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
              {t("Back to projects")}
            </Link>
            <p className="text-xs font-medium uppercase tracking-widest text-primary-ink">
              {t("Your workspace, your way")}
            </p>
            <h1>{t("Settings")}</h1>
            <p className="text-muted-foreground">
              {t("A familiar place to work, on every machine.")}
            </p>
          </div>
          <div className="settings-section-links flex flex-wrap gap-2">
            {["language", "appearance", "terminal", "projects", "account"].map(
              (section) => (
                <Button
                  key={section}
                  variant={state.section === section ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => state.scrollTo(section)}
                >
                  {section === "projects"
                    ? t("Project sets")
                    : section === "account"
                      ? t("Account & backup")
                      : section === "language"
                        ? t("Language")
                        : section === "appearance"
                          ? t("Appearance")
                          : "Terminal"}
                </Button>
              ),
            )}
          </div>
          {state.error && (
            <div
              role="alert"
              className="settings-error whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/5 p-4 text-destructive"
            >
              {t(state.error)}
            </div>
          )}
          {state.workspace.error && (
            <p role="alert" className="text-destructive">
              {t(state.workspace.error.message)}
            </p>
          )}

          <section
            id="settings-language"
            className="settings-language scroll-mt-20 space-y-5"
          >
            <div>
              <h2 className="text-xl">{t("Language")}</h2>
              <p className="mt-1 text-muted-foreground">
                {t(
                  "Choose your preferred language. Changes apply immediately.",
                )}
              </p>
            </div>
            <Field className="max-w-sm">
              <FieldLabel htmlFor="app-language">{t("Language")}</FieldLabel>
              <Select
                value={language}
                onValueChange={(value) => {
                  if (value === "en" || value === "vi") setLanguage(value);
                }}
              >
                <SelectTrigger id="app-language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("Language is saved on this device.")}
              </p>
            </Field>
          </section>
          <section
            id="settings-appearance"
            className="settings-appearance scroll-mt-20 space-y-5"
          >
            <div>
              <h2 className="text-xl">{t("Appearance")}</h2>
              <p className="mt-1 text-muted-foreground">
                {t("Quiet surfaces. A little personality.")}
              </p>
            </div>
            <div
              className="grid gap-3 sm:grid-cols-3"
              aria-label={t("Application theme")}
            >
              {[
                {
                  value: "system",
                  label: t("System"),
                  icon: Monitor,
                  description: t("Follow your device"),
                },
                {
                  value: "light",
                  label: t("Light"),
                  icon: Sun,
                  description: t("A clean, bright canvas"),
                },
                {
                  value: "dark",
                  label: t("Dark"),
                  icon: Moon,
                  description: t("Made for late nights"),
                },
              ].map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  type="button"
                  aria-label={t("{0} appearance", { 0: label })}
                  aria-pressed={state.theme.theme === value}
                  onClick={() => state.theme.setTheme(themeSchema.parse(value))}
                  className={cn(
                    "panel-surface flex flex-col items-start gap-3 rounded-md border p-5 text-left transition-colors",
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
            <div className="settings-type-preview panel-surface flex flex-wrap items-center justify-between gap-5 rounded-md border p-5">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">
                  {t("TYPEFACE / SYSTEM UI")}
                </p>
                <p className="text-lg font-medium">
                  {t("Designed to feel at home.")}
                </p>
                <p
                  className="mt-2 text-sm text-muted-foreground"
                  lang={language}
                >
                  {t("Clear typography, from ideas to delivery.")}
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
                {t("Choose a separate palette for in-app logs and output.")}
              </p>
            </div>
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              aria-label={t("Terminal theme")}
            >
              {[
                { value: "app", label: t("Follow app") },
                { value: "midnight", label: "Midnight" },
                { value: "paper", label: "Paper" },
                { value: "rose", label: "Rose" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-label={t("{0} terminal theme", { 0: label })}
                  aria-pressed={state.theme.terminalTheme === value}
                  onClick={() =>
                    state.theme.setTerminalTheme(
                      terminalThemeSchema.parse(value),
                    )
                  }
                  className={cn(
                    "overflow-hidden rounded-md border text-left",
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
              className="settings-terminal-preview overflow-hidden rounded-md border bg-terminal-background text-terminal-foreground"
            >
              <div className="flex items-center gap-2 border-b px-4 py-3 text-xs text-terminal-muted">
                <Terminal className="size-3.5" />
                {t("Output preview ")}
                <span className="ml-auto">JetBrains Mono</span>
              </div>
              <pre className="overflow-x-auto p-5 text-xs leading-7">
                <span className="text-terminal-muted">
                  $ pnpm run dev{"\n"}
                </span>
                Dev server ready on http://localhost:3000{"\n"}
                <span lang={language}>{t("✓ Project is ready")}</span>
                {"\n"}
                <span className="text-terminal-error">
                  Example stderr: port 3000 is already in use.
                </span>
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("External terminals keep their own appearance settings.")}
            </p>
          </section>

          <section
            id="settings-projects"
            className="settings-project-sets scroll-mt-20 space-y-5 border-t pt-7"
          >
            <div>
              <h2 className="text-xl">{t("Project sets")}</h2>
              <p className="mt-1 text-muted-foreground">
                {t(
                  "Different machines, different folders. Keep each setup together.",
                )}
              </p>
            </div>
            <div className="panel-surface space-y-4 rounded-md border p-5">
              <div className="flex items-center gap-3">
                <Laptop className="size-5 text-muted-foreground" />
                <div>
                  <h4>
                    {state.workspace.data?.deviceName ?? t("This device")}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t("Configuration is stored locally and works offline.")}
                  </p>
                </div>
              </div>
              <label
                htmlFor="project-set"
                className="block text-sm font-medium"
              >
                {t("Active project set")}
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
                      {set.name} · {set.projectCount} {t(" projects")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <form onSubmit={state.createSet} noValidate>
                <FieldSet disabled={!!state.busy}>
                  <FieldLegend className="sr-only">
                    {t("Create a project set")}
                  </FieldLegend>
                  <FieldGroup>
                    <Controller
                      control={state.setForm.control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor="set-name">
                            {t("Set name")}
                          </FieldLabel>
                          <Input
                            {...field}
                            id="set-name"
                            placeholder={t("Enter a project set name")}
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
                    {t("Rename active set")}
                  </Button>
                  <Button
                    type="submit"
                    loading={state.busy === "create"}
                    disabled={!!state.busy}
                  >
                    <Plus />
                    {t("Create set")}
                  </Button>
                </div>
              </form>
              <p className="text-xs text-muted-foreground">
                {t(
                  "Stop running projects before switching sets. Importing creates a new set.",
                )}
              </p>
            </div>
            <div className="settings-local-backup flex flex-wrap items-center justify-between gap-4 rounded-md border bg-card p-5">
              <div>
                <h4 className="flex items-center gap-2">
                  <HardDrive className="size-4" />
                  {t("Local export & import")}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("Save a JSON copy before resetting your machine.")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!!state.busy}
                  onClick={() => void state.importFile()}
                >
                  <Download />
                  {t("Import JSON")}
                </Button>
                <Button
                  variant="outline"
                  disabled={!!state.busy}
                  onClick={() => void state.exportFile()}
                >
                  <Upload />
                  {t("Export JSON")}
                </Button>
              </div>
            </div>
          </section>

          <section
            id="settings-account"
            className="settings-account scroll-mt-20 space-y-5 border-t pt-7"
          >
            <div>
              <h2 className="text-xl">{t("Account & backup")}</h2>
              <p className="mt-1 text-muted-foreground">
                {t("Your setups, ready when you need them again.")}
              </p>
            </div>
            <div className="panel-surface space-y-5 rounded-md border p-5">
              <form
                onSubmit={state.saveServer}
                noValidate
                className="settings-server-form space-y-3"
              >
                <FieldSet disabled={!!state.busy}>
                  <FieldLegend className="sr-only">
                    {t("Backup server")}
                  </FieldLegend>
                  <FieldGroup>
                    <Controller
                      control={state.serverForm.control}
                      name="apiUrl"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor="backup-api-url">
                            {t("Backup server URL")}
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
                    {t("Save server")}
                  </Button>
                </div>
              </form>
              <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-5">
                <div>
                  <h4>
                    {state.cloud.data?.account?.name ??
                      t("Sign in with Google")}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {state.cloud.data?.account?.email ??
                      t(
                        "Create your account with Google to keep backups of all your machines.",
                      )}
                  </p>
                </div>
                {state.cloud.data?.account ? (
                  <Button
                    variant="outline"
                    disabled={!!state.busy}
                    onClick={() => void state.signOut()}
                  >
                    <LogOut />
                    {t("Sign out")}
                  </Button>
                ) : state.cloud.data?.signingIn || state.busy === "sign-in" ? (
                  <Button
                    variant="outline"
                    onClick={() => void state.cancelSignIn()}
                  >
                    {t("Cancel sign-in")}
                  </Button>
                ) : (
                  <Button
                    disabled={!!state.busy || !state.cloud.data?.apiUrl}
                    onClick={() => void state.signIn()}
                  >
                    <LogIn />
                    {t("Continue with Google")}
                  </Button>
                )}
              </div>
              {(state.cloud.data?.signingIn || state.busy === "sign-in") && (
                <p role="status" className="text-sm text-muted-foreground">
                  {t("Finish signing in in your browser, then return here.")}
                </p>
              )}
              <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                {t(
                  "Backups include paths, commands and appearance. Source files, process logs and credentials stay on your machine. Review command strings before sharing an export.",
                )}
              </p>
            </div>
            <div className="settings-cloud-backups overflow-hidden rounded-md border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
                <div>
                  <h4>{t("Saved configurations")}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("Restore a snapshot to a new set on any machine.")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("Refresh cloud backups")}
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
                    {t("Back up current set")}
                  </Button>
                </div>
              </div>
              {!state.cloud.data?.account && (
                <p className="px-5 py-10 text-center text-muted-foreground">
                  {t("Sign in to view your saved configurations.")}
                </p>
              )}
              {state.cloud.data?.account && state.backups.isPending && (
                <p role="status" className="p-5">
                  {t("Loading backups…")}
                </p>
              )}
              {state.backups.error && (
                <p role="alert" className="p-5 text-destructive">
                  {t(state.backups.error.message)}
                </p>
              )}
              {state.cloud.data?.account &&
                state.backups.data?.length === 0 && (
                  <p className="px-5 py-10 text-center text-muted-foreground">
                    {t("No backups yet. Save “{0}” to get started.", {
                      0: selectedSet?.name ?? "",
                    })}
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
                      {backup.projectCount} {t(" projects")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(backup.createdAt).toLocaleString(dateLocale)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!state.busy}
                    onClick={() => void state.restore(backup.id)}
                  >
                    <Download />
                    {t("Preview restore")}
                  </Button>
                </article>
              ))}
            </div>
          </section>
          <p className="settings-footer flex items-center gap-2 text-xs text-muted-foreground">
            <Settings2 className="size-3.5" />
            {t("Appearance is saved automatically on this device.")}
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
            <DialogTitle>{t("Import project set")}</DialogTitle>
            <DialogDescription>
              {t("Review this configuration before creating a new local set.")}
            </DialogDescription>
          </DialogHeader>
          {state.preview && (
            <div className="settings-import-preview space-y-4">
              <div className="rounded-md border bg-muted/40 p-4">
                <h4>{state.preview.snapshot.set.name}</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("From ")}
                  {state.preview.snapshot.sourceDevice} ·{" "}
                  {t("{0} projects · {1} repositories", {
                    0: state.preview.snapshot.set.projects.length,
                    1: state.preview.snapshot.set.repositories.length,
                  })}
                </p>
              </div>
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {state.preview.snapshot.set.repositories.map((project) => (
                  <div key={project.id} className="rounded-md border p-3">
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
                      {project.command || t("No command configured")}
                    </p>
                  </div>
                ))}
              </div>
              {state.preview.missingFolders.length > 0 && (
                <p className="rounded-md bg-warning/10 p-3 text-sm text-warning-ink">
                  {t(
                    "{0} project folders are unavailable on this machine. You can fix their paths in Edit Repository after importing.",
                    { 0: state.preview.missingFolders.length },
                  )}
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
                  {t("Also restore appearance and terminal theme")}
                </FieldLabel>
              </Field>
              <p className="text-xs text-muted-foreground">
                {t(
                  "Your existing sets are kept. Commands will not run when imported.",
                )}
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
              {t("Cancel")}
            </Button>
            <Button
              disabled={!!state.busy}
              loading={state.busy === "confirm-import"}
              onClick={() => void state.confirmImport()}
            >
              {t("Import as new set")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
