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
  wheelMultiplier: 0.55,

  // The limit read live: the reveals shift the page's overflow without
  // resizing anything, and a cached one stays past the real bottom.
  naiveDimensions: true,

  // A finger on a `fixed` element scrolls the document and never the overflow
  // container the element sits in, and the pages are built out of `fixed`
  // layers, so Lenis drives the touch scroll itself.
  syncTouch: true,
};

export class Scroll {
  #lenis;
  #options;
  #raf;
  #virtualScrollListeners = new Set();
  #virtualScrollFilter = null;
  #locked = false;
  #staleTouch = false;

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
      // Returning false keeps the gesture from Lenis.
      virtualScroll: (data) => this.#filter(data),
      wrapper,
      content: document.querySelector(CONTENT),
    });

    if (this.#locked) {
      this.#lenis.stop();
    }

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

    // Still fires at the bottom of the page, where the scroll itself is stuck.
    this.#lenis.on("virtual-scroll", (data) => {
      this.#virtualScrollListeners.forEach((listener) => listener(data));
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

  // A gesture still under way when the scroll locks belongs to the page left:
  // it is dropped until the finger lifts and lands again.
  #filter(data) {
    const { event } = data;

    if (this.#staleTouch && event.type.startsWith("touch")) {
      if (event.type !== "touchstart") {
        if (event.cancelable) {
          event.preventDefault();
        }

        return false;
      }

      this.#staleTouch = false;
    }

    return this.#virtualScrollFilter?.(data) ?? true;
  }

  // Unlike `stop()`, holds across `refresh()`.
  lock() {
    this.#locked = true;
    this.#staleTouch = true;
    this.#lenis.stop();
  }

  unlock() {
    this.#locked = false;
    this.#lenis.start();
  }

  // Outlives `refresh()`, which swaps the Lenis instance on every visit.
  onVirtualScroll(listener) {
    this.#virtualScrollListeners.add(listener);
    return () => this.#virtualScrollListeners.delete(listener);
  }

  // Outlives `refresh()` as well.
  setVirtualScrollFilter(filter) {
    this.#virtualScrollFilter = filter;
    return () => {
      if (this.#virtualScrollFilter === filter) {
        this.#virtualScrollFilter = null;
      }
    };
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
