import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const defaultOptions = {
  wheelMultiplier: 0.25,
};

export class Scroll {
  #lenis;
  #options;
  #raf;

  constructor(options = {}) {
    this.#options = { ...defaultOptions, ...options };
  }

  init() {
    this.#lenis = new Lenis(this.#options);

    document.documentElement.style.setProperty(
      "--lenis-scroll-y",
      `${window.scrollY}px`,
    );

    this.#lenis.on("scroll", ({ scroll }) => {
      Alpine.store("main").scrollProgress = this.#lenis.progress;

      document.documentElement.style.setProperty(
        "--lenis-scroll-y",
        `${scroll}px`,
      );

      ScrollTrigger.update();
    });

    // Kept on the instance so `refresh()` can actually remove it: the callback
    // is a closure, not `lenis.raf`, so removing the latter is a no-op and every
    // refresh would leave a destroyed Lenis being ticked.
    this.#raf = (time) => {
      this.#lenis.raf(time * 1000);
    };

    gsap.ticker.add(this.#raf);
    gsap.ticker.lagSmoothing(0);
  }

  stop() {
    this.#lenis.stop();
  }

  start() {
    this.#lenis.start();
  }

  scrollTo(value, options = {}) {
    this.#lenis.scrollTo(value, options);
  }

  refresh() {
    gsap.ticker.remove(this.#raf);
    this.#lenis.destroy();
    this.init();
  }
}

const scrollInstance = new Scroll({ init: false });
export default scrollInstance;
