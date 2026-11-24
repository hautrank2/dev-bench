import { Controller } from "react-hook-form";

import { Button } from "~/components/ui/button";
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
import { Textarea } from "~/components/ui/textarea";

import { useGroupForm } from "./hook";
import type { GroupFormDialogProps, GroupFormProps } from "./type";

export const GroupFormDialog = (props: GroupFormDialogProps) => (
  <Dialog open={props.open} onOpenChange={props.onOpenChange}>
    <DialogContent>
      <GroupForm {...props} />
    </DialogContent>
  </Dialog>
);
export const GroupForm = (props: GroupFormProps) => {
  const { form, submit } = useGroupForm(props);
  return (
    <form
      onSubmit={submit}
      className="projects-group-form space-y-5"
      noValidate
    >
      <DialogHeader>
        <DialogTitle>
          {props.isEdit ? "Edit Project" : "Add Project"}
        </DialogTitle>
        <DialogDescription>
          A project groups repositories and services, such as OpsDesk server,
          client and broker.
        </DialogDescription>
      </DialogHeader>
      <FieldSet disabled={form.formState.isSubmitting}>
        <FieldLegend className="sr-only">Project details</FieldLegend>
        <FieldGroup>
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="project-name">Project name</FieldLabel>
                <Input
                  {...field}
                  id="project-name"
                  placeholder="OpsDesk"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="project-description">
                  Description
                </FieldLabel>
                <Textarea
                  {...field}
                  id="project-description"
                  placeholder="Internal operations workspace"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <FieldError errors={[form.formState.errors.root]} />
        </FieldGroup>
      </FieldSet>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={form.formState.isSubmitting}
          onClick={() => props.onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" loading={form.formState.isSubmitting}>
          {props.isEdit ? "Save Project" : "Add Project"}
        </Button>
      </DialogFooter>
    </form>
  );
};
