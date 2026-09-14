// @ts-check
import { defineConfig } from "astro/config";
import alpinejs from "@astrojs/alpinejs";
import tailwindcss from "@tailwindcss/vite";
import vue from "@astrojs/vue";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  // A user site is served from the root, so no `base` to thread through the
  // links or the swup route patterns. Swapping in a custom domain later is
  // this line and nothing else.
  site: "https://cbernard.github.io",

  integrations: [alpinejs(), vue(), icon()],

  vite: {
    plugins: [tailwindcss()],
  },
});
