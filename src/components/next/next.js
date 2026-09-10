import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import swup from "../../scripts/swup.js";

gsap.registerPlugin(ScrollTrigger);

const FILL_FROM = 0.9;
const FILL_TO = 0.98;

// Lenis only snaps onto its limit once the value rounds to it, so a page of
// fractional height never reports a progress of exactly 1.
const BOTTOM_THRESHOLD = 1;

const LEAVE_DELAY = 200;

// Further out than BOTTOM_THRESHOLD, or a scroll resting on the boundary would
// arm and disarm on every frame.
const CANCEL_THRESHOLD = 8;

export default function next(href) {
  return {
    leaving: false,
    armed: false,
    timer: null,
    trigger: null,
    animation: null,

    get progress() {
      const scroll = this.$store.main.scrollProgress;
      const fill = (scroll - FILL_FROM) / (FILL_TO - FILL_FROM);
      return `${gsap.utils.clamp(0, 1, fill) * 100}%`;
    },

    init() {
      const element = this.$root.closest(".test");

      if (!element) {
        return;
      }

      gsap.set(element, { opacity: 0 });

      this.$watch("$store.main.scrollRemaining", (remaining) => {
        // Swup resets the scroll before this mounts, but Lenis only emits for
        // it on the next frame: until then the store still reads the bottom of
        // the page just left.
        if (!this.armed) {
          this.armed = this.$store.main.scrollProgress < FILL_FROM;
          return;
        }

        if (this.leaving) {
          return;
        }

        if (remaining > CANCEL_THRESHOLD) {
          this.cancel();
          return;
        }

        if (this.timer || remaining > BOTTOM_THRESHOLD) {
          return;
        }

        this.timer = setTimeout(() => {
          this.timer = null;
          this.leaving = true;
          swup.navigate(href);
        }, LEAVE_DELAY);
      });

      this.animation = gsap.to(element, {
        opacity: 1,
        duration: 0.2,
        delay: 0.2,
        paused: true,
      });

      this.trigger = ScrollTrigger.create({
        trigger: element,
        start: "bottom bottom-=40px",
        end: "+=300",
        toggleActions: "play none none reverse",
        pin: true,
        animation: this.animation,
      });
    },

    cancel() {
      clearTimeout(this.timer);
      this.timer = null;
    },

    destroy() {
      this.cancel();

      this.trigger?.kill();
      this.animation?.kill();

      this.trigger = null;
      this.animation = null;
    },
  };
}
