// @ts-check
import { defineConfig } from "astro/config";
import alpinejs from "@astrojs/alpinejs";
import tailwindcss from "@tailwindcss/vite";
import vue from "@astrojs/vue";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  // Served from the root of its own domain, so no `base` to thread through the
  // links or the swup route patterns. The canonical URLs, the sitemap and the
  // share cards are all built off this.
  site: "https://charlybernard.com",

  integrations: [alpinejs(), vue(), icon()],

  vite: {
    plugins: [tailwindcss()],
  },
});
