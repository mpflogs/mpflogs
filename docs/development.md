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

## Keywords

Vite, recharts, 504, Outdated Optimize Dep, FundChart, dev server, mpflogs.
