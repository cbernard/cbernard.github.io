import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const WRAPPER = "#scroller";
const CONTENT = "#swup";

const wrapper = document.querySelector(WRAPPER);

// Set here and not in `init()`: Alpine mounts its components, and with them
// their triggers, before the instance below is ever initialised.
ScrollTrigger.defaults({ scroller: wrapper });

const defaultOptions = {
  wheelMultiplier: 0.25,

  // A finger on a `fixed` element scrolls the document and never the overflow
  // container the element sits in, and the pages are built out of `fixed`
  // layers, so Lenis drives the touch scroll itself.
  syncTouch: true,
};

export class Scroll {
  #lenis;
  #options;
  #raf;

  constructor(options = {}) {
    this.#options = { ...defaultOptions, ...options };
  }

  get scrollY() {
    return this.#lenis?.scroll ?? 0;
  }

  init() {
    // Swup throws the content away on every visit, hence the fresh lookup:
    // `refresh()` is what hands Lenis the element of the page just rendered.
    this.#lenis = new Lenis({
      ...this.#options,
      wrapper,
      content: document.querySelector(CONTENT),
    });

    document.documentElement.style.setProperty(
      "--lenis-scroll-y",
      `${this.scrollY}px`,
    );

    this.#lenis.on("scroll", ({ scroll }) => {
      const { limit, progress } = this.#lenis;

      Alpine.store("main").scrollProgress = progress;

      // `progress` reads 1 on an unscrollable page, so fall back to Infinity.
      Alpine.store("main").scrollRemaining =
        limit > 0 ? limit - scroll : Infinity;

      document.documentElement.style.setProperty(
        "--lenis-scroll-y",
        `${scroll}px`,
      );

      ScrollTrigger.update();
    });

    // Kept on the instance so `refresh()` can remove this exact closure.
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
