// @ts-check
import { defineConfig } from "astro/config";
import alpinejs from "@astrojs/alpinejs";
import swup from "@swup/astro";
import tailwindcss from "@tailwindcss/vite";
import vue from "@astrojs/vue";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [alpinejs(), vue(), icon(), swup({ debug: true })],

  vite: {
    plugins: [tailwindcss()],
  },
});
