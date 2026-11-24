---
paths:
  - "src/**/*select*.tsx"
  - "src/**/*combobox*.tsx"
---

# Selects

No server entity selects in Dev Bench. Use shadcn Select for static settings.
Do not introduce OpsDesk endpoints/pagination. Future remote entity selects:
generic engine + entity adapter, lazy open, debounced server search, infinite
pages, selected-label cache and preset resolution. Filters in query keys.
