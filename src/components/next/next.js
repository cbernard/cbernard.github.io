import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import swup from "../../scripts/swup.js";
import scrollInstance from "../../scripts/scroll.js";

gsap.registerPlugin(ScrollTrigger);

// Lenis only snaps onto its limit once the value rounds to it, so a page of
// fractional height never reports a progress of exactly 1.
const BOTTOM_THRESHOLD = 1;

// Lenis delta, already scaled by `wheelMultiplier`, needed to fill the label.
const FILL_DISTANCE = 350;

// How long the input may pause before the fill starts draining.
const IDLE_DELAY = 150;

const DRAIN_DURATION = 0.6;

export default function next(href) {
  return {
    leaving: false,
    armed: false,
    fill: 0,
    idleTimer: null,
    drain: null,
    trigger: null,
    animation: null,
    stopListening: null,

    get progress() {
      return `${this.fill * 100}%`;
    },

    get engaged() {
      return this.$store.main.scrollRemaining <= BOTTOM_THRESHOLD;
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
          this.armed = remaining > BOTTOM_THRESHOLD;
        }
      });

      this.stopListening = scrollInstance.onVirtualScroll(({ deltaY }) =>
        this.push(deltaY),
      );

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

    push(delta) {
      if (!this.armed || this.leaving || !this.engaged) {
        return;
      }

      this.drain?.kill();
      clearTimeout(this.idleTimer);

      this.fill = gsap.utils.clamp(0, 1, this.fill + delta / FILL_DISTANCE);

      if (this.fill === 1) {
        this.leaving = true;
        swup.navigate(href);
        return;
      }

      this.idleTimer = setTimeout(() => {
        this.drain = gsap.to(this, {
          fill: 0,
          duration: DRAIN_DURATION,
          ease: "power2.out",
        });
      }, IDLE_DELAY);
    },

    destroy() {
      clearTimeout(this.idleTimer);
      this.drain?.kill();
      this.stopListening?.();

      this.trigger?.kill();
      this.animation?.kill();

      this.trigger = null;
      this.animation = null;
    },
  };
}
