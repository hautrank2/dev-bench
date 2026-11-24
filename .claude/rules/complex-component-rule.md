# Component structure

Follow docs/rules/complex-component-rule.md: components with logic use
index.tsx (UI), hook.ts (logic), type.ts (all props/schema/inferred types).
Hook props derive from component props. Pure presentation and vendored
primitives stay single files. No Next.js server/client boundary.
