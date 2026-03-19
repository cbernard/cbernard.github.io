import Alpine from "alpinejs";

import accordion from "./accordion";
import progress from "../components/progress/progress";
import loader from "../components/loader/loader";
import next from "../components/next/next";

Alpine.data("accordion", accordion);
Alpine.data("progress", progress);
Alpine.data("loader", loader);
Alpine.data("next", next);

Alpine.store("darkMode", {
  on: false,

  toggle() {
    this.on = !this.on;
  },
});

Alpine.store("main", {
  current: 0,
  scrollProgress: 0,
  loading: 0,
  loaded: false,
});

// Alpine.start();
