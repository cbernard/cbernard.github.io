import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export class Scroll {
  #lenis;
  #options;

  constructor(options = {}) {
    this.#options = options;

    this.#init();
  }

  #init() {
    this.#lenis = new Lenis(this.#options);

    this.#lenis.scrollTo(0, { immediate: true });
    document.documentElement.style.setProperty("--lenis-scroll-y", `0px`);

    this.#lenis.on("scroll", ({ scroll }) => {
      Alpine.store("main").scrollProgress = this.#lenis.progress;

      document.documentElement.style.setProperty(
        "--lenis-scroll-y",
        `${scroll}px`,
      );

      ScrollTrigger.update;
    });

    gsap.ticker.add((time) => {
      this.#lenis.raf(time * 1000);
    });

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
    gsap.ticker.remove(this.#lenis.raf);
    this.#lenis.destroy();
    this.#init();
  }
}

const scrollInstance = new Scroll({
  wheelMultiplier: 0.5,
});

export default scrollInstance;
