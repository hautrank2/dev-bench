# Dialog forms

Follow .claude/skills/dialog-form/SKILL.md with these local adaptations:

- Dialog shell and Form are separate exports in index.tsx.
- Schema/props (isEdit, defaultValues) in type.ts; form logic in hook.ts.
- Import ~/components/ui/dialog; Radix asChild and open/onOpenChange.
- FieldSet/FieldGroup/Field/Controller, not deprecated FormField wrappers.
- Scrollable body, stationary header/footer. Footer: Cancel and submit.
- English labels/errors. pnpm for dependencies. No use client directive.
