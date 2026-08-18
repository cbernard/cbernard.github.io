import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./alpine.js";
import swup from "./swup.js";
import scrollInstance from "./scroll.js";
import cursorInstance from "./cursor.js";
import revealInstance from "./reveal.js";

class App {
  constructor() {
    scrollInstance.init();

    swup.hooks.on("page:view", () => {
      this.onPageReady({ revealDelay: 0, swup: true });
    });

    // The scroll reveals are created while the `in` animation still has their
    // container translated, so their trigger positions are measured off. They
    // are only valid once the transition has settled.
    swup.hooks.on("animation:in:end", () => {
      ScrollTrigger.refresh();
    });
  }

  async onPageReady({ revealDelay = 1, swup = false } = {}) {
    await revealInstance.reveal({ delay: revealDelay, swup });
    this.reset();
  }

  reset() {
    scrollInstance.refresh();
    cursorInstance.reset();
  }
}

const app = new App();
export default app;
