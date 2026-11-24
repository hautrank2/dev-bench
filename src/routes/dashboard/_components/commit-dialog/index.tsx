import { GitBranch, GitCommitHorizontal } from "lucide-react";
import { Controller } from "react-hook-form";

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
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { useLocale } from "~/providers/locale/context";

import { useCommitDialog } from "./hook";
import type { CommitDialogProps, CommitFormProps } from "./type";

export const CommitDialog = (props: CommitDialogProps) => (
  <Dialog open={props.open} onOpenChange={props.onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-2xl">
      <CommitForm {...props} />
    </DialogContent>
  </Dialog>
);

export const CommitForm = (props: CommitFormProps) => {
  const { t } = useLocale();

  const state = useCommitDialog(props);
  const staged = state.snapshot?.files.filter((file) => file.staged) ?? [];
  const unstaged = state.snapshot?.files.filter((file) => file.unstaged) ?? [];
  return (
    <form
      onSubmit={state.submit}
      className="dashboard-commit-form flex min-h-0 flex-col"
    >
      <DialogHeader className="border-b px-6 py-5">
        <DialogTitle className="flex items-center gap-2">
          <GitCommitHorizontal className="size-5" />
          Git Commit
        </DialogTitle>
        <DialogDescription>
          {props.project.name} · {t("Only staged changes will be committed.")}
        </DialogDescription>
      </DialogHeader>
      <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
        {state.query.isPending && (
          <p role="status">{t("Reading working tree…")}</p>
        )}
        {state.query.error && (
          <p role="alert" className="whitespace-pre-wrap text-destructive">
            {t(state.query.error.message)}
          </p>
        )}
        {state.snapshot && (
          <>
            <div className="dashboard-commit-repo rounded-lg border bg-muted/40 p-3">
              <p className="flex items-center gap-2">
                <GitBranch className="size-4" />
                {state.snapshot.branch}
              </p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {state.snapshot.root}
              </p>
            </div>
            {!state.review && (
              <section
                className="dashboard-commit-unstaged space-y-2"
                aria-label={t("Unstaged changes")}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4>
                    {t("Unstaged changes")} ({unstaged.length})
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!state.selected.length || state.busy}
                    onClick={() => void state.stage()}
                  >
                    {t("Stage selected")}
                  </Button>
                </div>
                {!unstaged.length && (
                  <p className="text-muted-foreground">
                    {t("No unstaged changes.")}
                  </p>
                )}
                {unstaged.map((file) => (
                  <label
                    key={file.path}
                    className={cn(
                      "flex items-start gap-3 rounded-md border",
                      "p-2 hover:bg-muted/50",
                    )}
                  >
                    <Checkbox
                      checked={state.selected.includes(file.path)}
                      onCheckedChange={() => state.toggle(file.path)}
                      disabled={state.busy}
                      aria-label={t("Stage {0}", { 0: file.path })}
                    />
                    <span className="min-w-0 break-all font-mono text-xs">
                      {file.originalPath ? `${file.originalPath} → ` : ""}
                      {file.path}
                    </span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {file.index}
                      {file.worktree}
                    </span>
                  </label>
                ))}
              </section>
            )}
            <section
              className="dashboard-commit-staged space-y-2"
              aria-label={t("Staged changes")}
            >
              <h4>
                {state.review ? t("Final staged list") : t("Staged changes")} (
                {staged.length})
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("Includes files staged outside DevBench.")}
              </p>
              {!staged.length && (
                <p className="text-muted-foreground">
                  {t("Stage files before committing.")}
                </p>
              )}
              {staged.map((file) => (
                <div
                  key={file.path}
                  className="break-all rounded-md border px-3 py-2 font-mono text-xs"
                >
                  {file.originalPath ? `${file.originalPath} → ` : ""}
                  {file.path}
                </div>
              ))}
            </section>
            <Controller
              control={state.form.control}
              name="message"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="commit-message">
                    {t("Commit message")}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="commit-message"
                    aria-invalid={fieldState.invalid}
                    disabled={state.busy}
                    placeholder={t("Describe your changes")}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            {state.review && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p>
                  {t(
                    "Confirm the complete staged list above before creating this commit.",
                  )}
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0"
                  onClick={state.cancelReview}
                >
                  {t("Back to file selection")}
                </Button>
              </div>
            )}
          </>
        )}
        {state.error && (
          <div role="alert" className="whitespace-pre-wrap text-destructive">
            {t(state.error)}
          </div>
        )}
      </div>
      <DialogFooter className="border-t bg-card px-6 py-4">
        <Button
          type="button"
          variant="outline"
          disabled={state.busy}
          onClick={() => props.onOpenChange(false)}
        >
          {t("Cancel")}
        </Button>
        <Button
          type="submit"
          loading={state.busy}
          disabled={!staged.length || !!state.query.error}
        >
          {state.review ? t("Confirm Commit") : t("Review staged files")}
        </Button>
      </DialogFooter>
    </form>
  );
};
