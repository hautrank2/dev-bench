import { FolderOpen } from "lucide-react";
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
import {
  Field,
  FieldDescription,
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

import { useProjectForm } from "./hook";
import type { ProjectFormDialogProps, ProjectFormProps } from "./type";

export const ProjectFormDialog = (props: ProjectFormDialogProps) => (
  <Dialog open={props.open} onOpenChange={props.onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-hidden p-0">
      <ProjectForm {...props} />
    </DialogContent>
  </Dialog>
);

export const ProjectForm = (props: ProjectFormProps) => {
  const { form, pickFolder, submit, isSubmitting } = useProjectForm(props);
  return (
    <form
      onSubmit={submit}
      noValidate
      className="dashboard-project-form flex min-h-0 flex-col"
    >
      <DialogHeader className="border-b px-6 py-5">
        <DialogTitle>
          {props.isEdit ? "Edit Repository" : "Add Repository"}
        </DialogTitle>
        <DialogDescription>
          Connect a local folder to your workspace.
        </DialogDescription>
      </DialogHeader>
      <div className="max-h-[65vh] overflow-y-auto p-6">
        <FieldSet disabled={isSubmitting}>
          <FieldLegend className="sr-only">Project configuration</FieldLegend>
          <FieldGroup>
            {props.groups && props.groups.length > 0 && (
              <Controller
                control={form.control}
                name="groupId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="repository-project">
                      Project
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={props.executionLocked}
                    >
                      <SelectTrigger id="repository-project" className="w-full">
                        <SelectValue placeholder="Choose a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {props.groups?.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )}
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="OpsDesk Web"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="folder"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>Project folder</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      {...field}
                      id={field.name}
                      disabled={props.executionLocked}
                      aria-invalid={fieldState.invalid}
                      placeholder="D:\Projects\my-app"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={props.executionLocked}
                      onClick={() => void pickFolder()}
                      aria-label="Browse project folder"
                    >
                      <FolderOpen /> Browse
                    </Button>
                  </div>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="command"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>Run command</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    disabled={props.executionLocked}
                    aria-invalid={fieldState.invalid}
                    placeholder="pnpm run dev"
                    className="font-mono"
                  />
                  <FieldDescription>
                    Runs in this folder using the Windows shell. Optional until
                    you run.
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="url"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>Web URL</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="http://localhost:3000"
                  />
                  <FieldDescription>
                    Used by Open Web. Your command determines the actual port.
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="includeInRunAll"
              render={({ field }) => (
                <Field
                  orientation="horizontal"
                  className={cn("rounded-lg border bg-muted/40", "p-4")}
                >
                  <Checkbox
                    id={field.name}
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  <FieldLabel htmlFor={field.name}>
                    Include in Run All
                  </FieldLabel>
                </Field>
              )}
            />
            {props.executionLocked && (
              <FieldDescription>
                Stop this project to change its folder or run command.
              </FieldDescription>
            )}
            <FieldError errors={[form.formState.errors.root]} />
          </FieldGroup>
        </FieldSet>
      </div>
      <DialogFooter className="border-t bg-card px-6 py-4">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => props.onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {props.isEdit ? "Save Repository" : "Add Repository"}
        </Button>
      </DialogFooter>
    </form>
  );
};
