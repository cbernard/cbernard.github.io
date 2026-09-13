import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./alpine.js";
import swup from "./swup.js";
import scrollInstance from "./scroll.js";
import cursorInstance from "./cursor.js";
import revealInstance from "./reveal.js";

class App {
  constructor() {
    scrollInstance.init();

    swup.hooks.on("page:view", (visit) => {
      this.onPageReady({
        revealDelay: 0,
        swup: true,
        instant: Boolean(visit.meta.composed),
      });
    });

    // Trigger positions are measured off until the `in` animation has settled.
    swup.hooks.on("animation:in:end", () => {
      ScrollTrigger.refresh();
    });
  }

  async onPageReady({ revealDelay = 1, swup = false, instant = false } = {}) {
    await revealInstance.reveal({ delay: revealDelay, swup, instant });
    this.reset();
  }

  reset() {
    scrollInstance.refresh();
    cursorInstance.reset();
  }
}

const app = new App();
export default app;
