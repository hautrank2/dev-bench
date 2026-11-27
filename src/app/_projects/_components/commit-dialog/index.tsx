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

import { GitSyncStatus } from "../git-sync";
import { useCommitDialog } from "./hook";
import type {
  CommitDialogProps,
  CommitFilePathProps,
  CommitFormProps,
} from "./type";

const columnClass = "flex min-w-0 flex-col rounded-lg border";
const columnHeaderClass = "space-y-2 border-b p-3";
// Each column scrolls on its own so a long change list never grows the dialog.
const listClass =
  "max-h-[min(30vh,320px)] min-h-24 space-y-1 overflow-y-auto p-2";
const rowClass = "flex items-start gap-3 rounded-md border p-2";

const FilePath = (props: CommitFilePathProps) => (
  <span className="min-w-0 break-all font-mono text-xs">
    {props.file.originalPath ? `${props.file.originalPath} → ` : ""}
    {props.file.path}
  </span>
);

export const CommitDialog = (props: CommitDialogProps) => (
  <Dialog open={props.open} onOpenChange={props.onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-5xl">
      <CommitForm {...props} />
    </DialogContent>
  </Dialog>
);

export const CommitForm = (props: CommitFormProps) => {
  const { t } = useLocale();

  const state = useCommitDialog(props);
  const { staged, unstaged } = state;
  return (
    <form
      onSubmit={state.submit}
      className="dashboard-commit-form flex max-h-[90vh] min-h-0 flex-col"
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
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
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
              <p className="flex flex-wrap items-center gap-2">
                <GitBranch className="size-4" />
                {state.snapshot.branch}
                <GitSyncStatus sync={state.snapshot.sync} />
              </p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {state.snapshot.root}
              </p>
            </div>
            <div
              className={cn(
                "dashboard-commit-columns grid gap-4",
                !state.review && "md:grid-cols-2",
              )}
            >
              {!state.review && (
                <section
                  className={cn("dashboard-commit-unstaged", columnClass)}
                  aria-label={t("Unstaged changes")}
                >
                  <div className={columnHeaderClass}>
                    <div className="flex min-h-8 items-center justify-between gap-2">
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
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <label className="flex items-center gap-3">
                        <Checkbox
                          checked={state.allSelected}
                          onCheckedChange={state.toggleAll}
                          disabled={!unstaged.length || state.busy}
                        />
                        {t("Select all")}
                      </label>
                      <span className="text-muted-foreground">
                        {t("Selected: {0}", { 0: state.selected.length })}
                      </span>
                    </div>
                  </div>
                  <div className={listClass}>
                    {!unstaged.length && (
                      <p className="p-1 text-muted-foreground">
                        {t("No unstaged changes.")}
                      </p>
                    )}
                    {unstaged.map((file) => (
                      <label
                        key={file.path}
                        data-file-path={file.path}
                        className={cn(rowClass, "hover:bg-primary/10")}
                      >
                        <Checkbox
                          checked={state.selected.includes(file.path)}
                          onCheckedChange={() => state.toggle(file.path)}
                          disabled={state.busy}
                          aria-label={t("Stage {0}", { 0: file.path })}
                        />
                        <FilePath file={file} />
                        <span className="ml-auto whitespace-pre font-mono text-xs text-muted-foreground">
                          {file.index}
                          {file.worktree}
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              )}
              <section
                className={cn("dashboard-commit-staged", columnClass)}
                aria-label={t("Staged changes")}
              >
                <div className={columnHeaderClass}>
                  <div className="flex min-h-8 items-center">
                    <h4>
                      {state.review
                        ? t("Final staged list")
                        : t("Staged changes")}{" "}
                      ({staged.length})
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("Includes files staged outside DevBench.")}
                  </p>
                </div>
                <div className={listClass} tabIndex={0}>
                  {!staged.length && (
                    <p className="p-1 text-muted-foreground">
                      {t("Stage files before committing.")}
                    </p>
                  )}
                  {staged.map((file) => (
                    <div
                      key={file.path}
                      data-file-path={file.path}
                      className={rowClass}
                    >
                      <FilePath file={file} />
                    </div>
                  ))}
                </div>
              </section>
            </div>
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
                {state.review.sync === null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("Push needs an upstream branch.")}
                  </p>
                )}
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
          variant="text"
          disabled={state.busy}
          onClick={() => props.onOpenChange(false)}
        >
          {t("Cancel")}
        </Button>
        {state.review && (
          <Button
            type="button"
            variant="outline"
            loading={state.pushing}
            disabled={
              state.busy || !!state.query.error || state.review.sync === null
            }
            onClick={() => void state.commitAndPush()}
          >
            {t("Commit and Push")}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={state.busy && !state.pushing}
          disabled={!staged.length || !!state.query.error || state.pushing}
        >
          {state.review ? t("Confirm Commit") : t("Review staged files")}
        </Button>
      </DialogFooter>
    </form>
  );
};
