import Alpine from "alpinejs";

import accordion from "./accordion";
import progress from "../components/progress/progress";
import next from "../components/next/next";

Alpine.data("accordion", accordion);
Alpine.data("progress", progress);
Alpine.data("next", next);

Alpine.store("darkMode", {
  on: false,

  toggle() {
    this.on = !this.on;
  },
});

Alpine.store("navigation", {
  current: 0,
  scrollProgress: 0,
});

// Alpine.start();
