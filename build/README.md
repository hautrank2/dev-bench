# DevBench brand assets

- Source vector: `src/assets/dev-bench.svg`.
- `icon.png`: 512×512, transparent outside the rounded terminal mark.
- `icon.ico`: 16, 20, 24, 32, 40, 48, 64, 128 and 256 px, PNG frames with alpha.
- Sidebar and favicon load the source SVG. Electron runtime and Windows
  executable/installer use generated icons from this folder.

Regenerate after editing the SVG:

```powershell
pnpm icons
```

The generator uses the existing Playwright dev dependency and a headless browser.
It tries Playwright Chromium, then installed Edge/Chrome. If no browser is available:

```powershell
pnpm exec playwright install chromium
pnpm icons
```

Generated PNG/ICO are versioned; building/running the app does not need a browser.
`scripts/brand-assets.mjs` copies them into `dist-electron/assets` for both dev
and production. Non-brand UI icons continue to come from Lucide.
