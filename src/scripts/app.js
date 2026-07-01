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
  }

  async onPageReady({ revealDelay = 1, swup } = {}) {
    await revealInstance.reveal({ delay: revealDelay, swup: swup });
    this.reset();
  }

  reset() {
    scrollInstance.refresh();
    cursorInstance.reset();
  }
}

const app = new App();
export default app;
