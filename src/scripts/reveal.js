import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

class Reveal {
  #split;
  #scrollTweens = [];
  #firstSplitDone = false;

  #init() {
    this.#split?.revert();
    this.#firstSplitDone = false;

    this.#split = SplitText.create("[data-split]", {
      type: "words, lines",
      mask: "lines",
      linesClass: "lines",
      wordsClass: "word",
      autoSplit: true,
      onSplit: (split) => this.#onSplit(split),
    });

    this.#firstSplitDone = true;
  }

  // SplitText also calls this on the first split, the one `reveal()` animates.
  #onSplit(split) {
    if (!this.#firstSplitDone) {
      return;
    }

    // Fresh lines come back translated down by `.lines` in the CSS.
    gsap.set(split.lines, { y: "0%" });

    // Re-wrapped copy is not the same height, and the re-split is debounced
    // 200ms — past the refresh ScrollTrigger runs on resize by itself.
    ScrollTrigger.refresh();
  }

  #killScroll() {
    this.#scrollTweens.forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });

    this.#scrollTweens = [];
  }

  #visibleScrollItems() {
    return gsap.utils
      .toArray("[data-reveal-slide-up='scroll']")
      .filter((element) => {
        const { top, bottom } = element.getBoundingClientRect();

        return bottom > 0 && top < window.innerHeight;
      });
  }

  #initScroll() {
    this.#killScroll();

    this.#scrollTweens = gsap.utils
      .toArray("[data-reveal-slide-up='scroll']")
      .map((element) => {
        const styles = getComputedStyle(element);
        const read = (property) =>
          parseFloat(styles.getPropertyValue(property)) || 0;

        return gsap.to(element, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay:
            Math.min(read("--reveal-index"), read("--reveal-stagger-max")) *
            read("--reveal-stagger"),
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top bottom-=10%",
            once: true,
          },
        });
      });
  }

  reveal({ delay = 1, swup = false, instant = false } = {}) {
    this.#init();
    this.#initScroll();

    // A page that rides in composed has nothing left to stage: its copy is
    // already in place.
    if (instant) {
      gsap.set("[data-split]", { opacity: 1 });
      gsap.set(this.#split.lines, { y: "0%" });

      return Promise.resolve();
    }

    const tl = gsap.timeline({ delay });

    if (this.#split.lines.length > 0) {
      tl.to(this.#split.lines, {
        onStart: () => {
          gsap.set("[data-split]", { opacity: 1 });
        },
        y: "0%",
        duration: 0.35,
        stagger: 0.07,
      });
    }

    // On the initial load these are choreographed with the loader curtain.
    if (swup && document.querySelector("[data-reveal-fade='swup']")) {
      tl.fromTo(
        "[data-reveal-fade='swup']",
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" },
        "<",
      );
    }

    return tl.then();
  }

  // Only the items on screen leave, over a fixed distance: translating their
  // column would cover its own height, so a speed that varies per project.
  unrevealVisible({ distance = 80 } = {}) {
    this.#killScroll();

    const items = this.#visibleScrollItems();

    if (items.length === 0) {
      return Promise.resolve();
    }

    return gsap
      .to(items, {
        y: -distance,
        opacity: 0,
        duration: 0.5,
        ease: "power2.in",
        stagger: { each: 0.06, from: "start" },
      })
      .then();
  }

  unreveal({ delay = 0, swup = false, slideUp = true } = {}) {
    // A reveal still in flight would drag its element back up mid-exit.
    this.#killScroll();

    const tl = gsap.timeline({ delay });

    if (this.#split?.lines.length > 0) {
      tl.to(this.#split.lines, {
        y: "100%",
        stagger: { each: 0.1, from: "end" },
        onComplete: () => {
          gsap.set("[data-split]", { opacity: 0 });
        },
      });
    }

    // `slideUp: false` leaves these to `unrevealVisible`, or both tweens
    // fight over the same y.
    const items = slideUp
      ? gsap.utils.toArray("[data-reveal-slide-up='scroll']")
      : [];

    if (items.length > 0) {
      tl.to(
        items,
        {
          y: 20,
          opacity: 0,
          duration: 0.8,
          ease: "power2.in",
          stagger: { each: 0.08, from: "end" },
        },
        "<",
      );
    }

    if (swup && document.querySelector("[data-reveal-fade='swup']")) {
      tl.to(
        "[data-reveal-fade='swup']",
        { opacity: 0, duration: 0.3, ease: "power2.in" },
        "<",
      );
    }

    return tl.then();
  }
}

const revealInstance = new Reveal();
export default revealInstance;
