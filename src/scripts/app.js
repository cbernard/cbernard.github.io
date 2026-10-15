import { ScrollTrigger } from "gsap/ScrollTrigger";

import { isHomepage, isLostPage } from "./alpine.js";
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

    // Escape leads back to Works from a project or About.
    window.addEventListener("keydown", (e) => {
      if (
        e.key !== "Escape" ||
        e.repeat ||
        isHomepage() ||
        isLostPage() ||
        e.target.closest?.("input, textarea, select")
      ) {
        return;
      }

      swup.navigate("/");
    });

    // Clicks on anything carrying `data-posthog-event` are sent as that event.
    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const target = event.target.closest("[data-posthog-event]");
      const eventName = target?.dataset.posthogEvent;

      if (!eventName) {
        return;
      }

      const properties = target.dataset.posthogProject
        ? { project: target.dataset.posthogProject }
        : target.dataset.posthogSocial
          ? { platform: target.dataset.posthogSocial }
          : undefined;

      window.posthog?.capture(eventName, properties);
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
