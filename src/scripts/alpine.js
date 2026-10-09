import Alpine from "alpinejs";

// import { revealSplit } from "./reveal.js";

import accordion from "./accordion";
import progress from "../components/progress/progress";
import loader from "../components/loader/loader";
import next from "../components/next/next";
import pins from "../components/pin/pin";
import email from "../components/email/email";
import video from "../components/video/video";
import field from "../components/lost/field";

export const isHomepage = () => window.location.pathname === "/";

// A 404 can sit at any path: it is told by the marker on its container.
export const isLostPage = () =>
  Boolean(document.querySelector("#swup [data-page='404']"));

Alpine.data("accordion", accordion);
Alpine.data("progress", progress);
Alpine.data("loader", loader);
Alpine.data("next", next);
Alpine.data("pins", pins);
Alpine.data("email", email);
Alpine.data("video", video);
Alpine.data("field", field);

Alpine.store("darkMode", {
  on: false,

  toggle() {
    this.on = !this.on;
  },
});

Alpine.store("main", {
  current: 0,
  scrollProgress: 0,
  scrollRemaining: Infinity,
  loading: 0,
  loaded: false,
  isHome: isHomepage(),
  isLost: isLostPage(),
});

Alpine.watch(
  () => Alpine.store("main").loaded,
  (newValue) => {
    if (newValue) {
      // revealSplit();
    }
  },
);

// Alpine.start();
