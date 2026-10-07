import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

class Reveal {
  #split;
  #revealTimeline;
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

  #onSplit(split) {
    if (!this.#firstSplitDone) {
      return;
    }

    gsap.set(split.lines, { y: "0%" });

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

        const readSeconds = (property) => {
          const value = styles.getPropertyValue(property).trim();
          const seconds = parseFloat(value) || 0;

          return value.endsWith("ms") ? seconds / 1000 : seconds;
        };

        return gsap.to(element, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay:
            Math.min(read("--reveal-index"), read("--reveal-stagger-max")) *
            readSeconds("--reveal-stagger"),
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

    if (instant) {
      gsap.set("[data-split]", { opacity: 1 });
      gsap.set(this.#split.lines, { y: "0%" });

      return Promise.resolve();
    }

    const tl = gsap.timeline({ delay });
    this.#revealTimeline = tl;

    const stagger = 0.1;
    const lines = this.#split.lines;

    if (lines.length > 0) {
      tl.to(lines, {
        onStart: () => {
          gsap.set("[data-split]", { opacity: 1 });
        },
        y: "0%",
        duration: 1.2,
        ease: "expo.out",
        stagger,
      });
    }

    if (swup && document.querySelector("[data-reveal-fade='swup']")) {
      tl.fromTo(
        "[data-reveal-fade='swup']",
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" },
        "<",
      );
    }

    // Settles once the last line is under way: the scroller and the cursor
    // would otherwise wait out the whole 1.2s ease.
    return new Promise((resolve) => {
      tl.call(resolve, null, Math.max(lines.length - 1, 0) * stagger);
    });
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
    this.#revealTimeline?.kill();
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
