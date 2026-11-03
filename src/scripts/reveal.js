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
      // Its default labels the split element and hides the lines, which is not
      // allowed on a <p> or <div> and hides the pins inside from the keyboard.
      aria: "none",
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

  reveal({
    delay = 1,
    swup = false,
    instant = false,
    ease = "expo.out",
    duration = 1.2,
  } = {}) {
    this.#init();
    this.#initScroll();

    if (instant) {
      gsap.set("[data-split]", { opacity: 1 });
      gsap.set(this.#split.lines, { y: "0%" });

      return Promise.resolve();
    }

    const tl = gsap.timeline({ delay });

    const stagger = 0.1;
    const lines = this.#split.lines;

    if (lines.length > 0) {
      tl.to(lines, {
        onStart: () => {
          gsap.set("[data-split]", { opacity: 1 });
        },
        y: "0%",
        duration,
        ease,
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
    // would otherwise wait out the whole ease.
    return new Promise((resolve) => {
      tl.call(resolve, null, Math.max(lines.length - 1, 0) * stagger);
    });
  }
}

const revealInstance = new Reveal();
export default revealInstance;
