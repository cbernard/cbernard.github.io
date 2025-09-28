import Alpine from "alpinejs";

import accordion from "./accordion";
import progress from "../components/progress/progress";

Alpine.data("accordion", accordion);
Alpine.data("progress", progress);

Alpine.store("darkMode", {
  on: false,

  toggle() {
    this.on = !this.on;
  },
});

Alpine.store("navigation", {
  current: 1,
  scrollProgress: 0,
});

// Alpine.start();
