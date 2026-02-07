import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  // Project site: https://mpflogs.github.io/mpflogs/ (repo name = mpflogs)
  site: "https://mpflogs.github.io",
  base: "/mpflogs",
});
