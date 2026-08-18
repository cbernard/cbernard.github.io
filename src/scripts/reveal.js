import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

class Reveal {
  #split;
  #scrollTweens = [];

  #init() {
    this.#split = SplitText.create("[data-split]", {
      type: "words, lines",
      mask: "lines",
      linesClass: "lines",
    });
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

  reveal({ delay = 1, swup = false } = {}) {
    this.#init();
    this.#initScroll();

    const tl = gsap.timeline({ delay });

    if (this.#split.lines.length > 0) {
      tl.to(this.#split.lines, {
        onStart: () => {
          gsap.set("[data-split]", { opacity: 1 });
        },
        y: "0%",
        stagger: 0.1,
      });
    }

    // Only on a Swup arrival: on the initial load these elements are already
    // choreographed with the loader curtain, fading them would flash them.
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

  /**
   * Exit between two projects: only the items on screen leave, over a fixed
   * distance. Translating their column instead covers a distance equal to its
   * own height — several thousand pixels on a project with many medias, hence
   * a speed that changes from one project to the next.
   */
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
    // A scroll reveal still in flight would drag its element back up mid-exit.
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

    // `slideUp: false` leaves these items to a caller that exits them itself
    // (see `unrevealVisible`), otherwise both tweens fight over the same y.
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
