# Typography — DevBench

src/typoset.css defines element typography inside @layer base.
Tags choose semantics; utilities only override a deliberate exception.
One h1 per page. No Text/Heading wrapper or typo-* classes.

h1 28px/400; h2 22px/500; h3 18px/500; h4 16px/600;
h5 14px/600; h6 12px/600 uppercase with tracking.
No heading margins by default. Body 14px, text-xs 12px for metadata.
Segoe UI with bundled Be Vietnam Pro fallback matches the Clarity-inspired theme.
Use classes for static typography; style only for truly dynamic values.
Never concatenate dynamic utility names. Pick static class strings.
Keep type rules layered so Tailwind utilities override them.
