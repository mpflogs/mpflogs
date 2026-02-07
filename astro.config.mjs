import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["recharts"],
    },
  },
  // Project site: https://mpflogs.github.io/mpflogs/ (repo name = mpflogs)
  site: "https://mpflogs.github.io",
  base: "/mpflogs",
});
