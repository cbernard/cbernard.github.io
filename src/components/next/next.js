import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import swup from "../../scripts/swup.js";

gsap.registerPlugin(ScrollTrigger);

// Lenis only snaps onto its limit once the value rounds to it, so a page of
// fractional height never reports a progress of exactly 1.
const BOTTOM_THRESHOLD = 1;

// Further out than BOTTOM_THRESHOLD, or a scroll resting on the boundary would
// arm and disarm on every frame.
const CANCEL_THRESHOLD = 8;

// How long the label stays full before the next project comes in, in ms.
const HOLD = 500;

// Share of the viewport the label stays pinned for, the stretch of scroll that
// fills it.
const PIN_DISTANCE = { mobile: 0.6, desktop: 0.6 };

const isMobile = () =>
  !window.matchMedia(
    `(min-width: ${getComputedStyle(document.documentElement).getPropertyValue("--breakpoint-md").trim()})`,
  ).matches;

export default function next(href) {
  return {
    leaving: false,
    armed: false,
    fill: 0,
    timer: null,
    trigger: null,
    animation: null,

    get progress() {
      return `${this.fill * 100}%`;
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
          this.armed = remaining > CANCEL_THRESHOLD;
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
        }, HOLD);
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
        end: () =>
          `+=${window.innerHeight * PIN_DISTANCE[isMobile() ? "mobile" : "desktop"]}`,
        toggleActions: "play none none reverse",
        pin: true,
        animation: this.animation,
        // Full at the bottom of the page even when the pin runs past it.
        onUpdate: (self) => {
          const end = Math.min(
            self.end,
            ScrollTrigger.maxScroll(self.scroller),
          );

          this.fill = gsap.utils.clamp(
            0,
            1,
            (self.scroll() - self.start) / (end - self.start),
          );
        },
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
