# Development

## Commands

- `npm run dev` — Start Astro dev server (e.g. http://localhost:4321/mpflogs/).
- `npm run build` — Static build (output in `dist/`).
- `npm run preview` — Preview the built site locally.

## Troubleshooting

### 504 Outdated Optimize Dep / Failed to fetch dynamically imported module (e.g. FundChart.tsx)

Vite’s dependency pre-bundling cache can become stale (e.g. after long runs or dependency changes), leading to:

- `504 (Outdated Optimize Dep)` for recharts or other deps.
- `Uncaught (in promise) TypeError: Failed to fetch dynamically imported module: .../FundChart.tsx`.

**Fix:**

1. Stop the dev server (Ctrl+C).
2. Remove Vite’s cache: `rm -rf node_modules/.vite`
3. Restart: `npm run dev`

**Prevention:** `astro.config.mjs` includes `vite.optimizeDeps.include: ["recharts"]` so recharts is pre-bundled and this issue is less likely.

## UI & Theming

- **Component library**: React islands use shadcn/ui-style components under `src/components/ui/` (e.g. `button`, `card`, `input`, `select`), plus a `ThemeToggle` in `src/components/ThemeToggle.tsx`.
- **Tailwind v4 + CSS variables**: `src/styles/global.css` defines OKLCH color tokens (`--background`, `--foreground`, `--card`, `--border`, `--primary`, `--muted-foreground`, etc.) and exposes them via `@theme inline` as utilities like `bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`.
- **Dark mode**: The `<html>` element toggles the `dark` class; an inline script in `Layout.astro` + `ThemeToggle` reads/writes `localStorage` key `mpflogs-theme` and system `prefers-color-scheme` to choose light/dark, and updates `<meta name="theme-color">`.
- **Usage**: Prefer semantic tokens over raw colors, e.g. `text-foreground` instead of `text-slate-800`, `bg-card` instead of `bg-white`, `border-border` instead of `border-slate-200`, and `text-primary`/`text-muted-foreground` for emphasis and secondary text so both light/dark look good.

## Keywords

Vite, recharts, 504, Outdated Optimize Dep, FundChart, dev server, mpflogs, shadcn, Tailwind v4, dark mode, ThemeToggle, background/foreground/card/border tokens.
