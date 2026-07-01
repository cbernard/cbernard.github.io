import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

class Reveal {
  #split;

  #init() {
    this.#split = SplitText.create("[data-split]", {
      type: "words, lines",
      mask: "lines",
      linesClass: "lines",
    });
  }

  reveal({ delay = 1, swup = false } = {}) {
    this.#init();

    return new Promise((resolve) => {
      const tl = gsap.timeline({ delay, onComplete: resolve });

      if (this.#split.lines.length > 0) {
        gsap.to(this.#split.lines, {
          onStart: () => {
            gsap.set("[data-split]", { opacity: 1 });
          },
          y: "0%",
          stagger: 0.1,
        });
      }

      if (swup) {
        // gsap.from("[data-reveal-slide-up]", {
        //   y: "20px",
        //   opacity: 0,
        // });
      }
    });
  }
}

const revealInstance = new Reveal();
export default revealInstance;
