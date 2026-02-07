import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  // For GitHub Pages project site (e.g. username.github.io/mpflogs), set base: '/mpflogs'
  site: "https://your-username.github.io",
  base: "/",
});
