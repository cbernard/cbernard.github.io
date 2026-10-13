import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import swup from "../../scripts/swup.js";
import scrollInstance from "../../scripts/scroll.js";

gsap.registerPlugin(ScrollTrigger);

// Lenis only snaps onto its limit once the value rounds to it, so a page of
// fractional height never reports a progress of exactly 1.
const BOTTOM_THRESHOLD = 1;

// Lenis delta, already scaled by `wheelMultiplier`, needed to fill the label.
const FILL_DISTANCE = 140;

// Scroll the label stays pinned for, which leaves that much space above it.
const PIN_DISTANCE = { mobile: 200, desktop: 300 };

const isMobile = () =>
  !window.matchMedia(
    `(min-width: ${getComputedStyle(document.documentElement).getPropertyValue("--breakpoint-md").trim()})`,
  ).matches;

// How long the input may pause before the label empties.
const IDLE_DELAY = 150;

// Upward delta that empties the label, above the jitter of a finger at rest.
const RESET_DELTA = 8;

export default function next(href) {
  return {
    leaving: false,
    armed: false,
    fill: 0,
    target: 0,
    tween: null,
    idleTimer: null,
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
        end: () =>
          `+=${isMobile() ? PIN_DISTANCE.mobile : PIN_DISTANCE.desktop}`,
        toggleActions: "play none none reverse",
        pin: true,
        animation: this.animation,
      });
    },

    // Empties as soon as the input pauses or the page goes back up.
    push(delta) {
      if (!this.armed || this.leaving) {
        return;
      }

      if (delta < -RESET_DELTA) {
        this.reset();
        return;
      }

      if (!this.engaged || delta <= 0) {
        return;
      }

      clearTimeout(this.idleTimer);

      this.target = Math.min(1, this.target + delta / FILL_DISTANCE);
      this.leaving = this.target === 1;

      // Eased toward the target: raw deltas, a finger's above all, step.
      this.tween?.kill();
      this.tween = gsap.to(this, {
        fill: this.target,
        duration: this.leaving ? 0.2 : 0.3,
        ease: "power2.out",
        onComplete: () => this.leaving && swup.navigate(href),
      });

      if (!this.leaving) {
        this.idleTimer = setTimeout(() => this.reset(), IDLE_DELAY);
      }
    },

    reset() {
      clearTimeout(this.idleTimer);

      if (this.target === 0) {
        return;
      }

      this.target = 0;
      this.tween?.kill();
      this.tween = gsap.to(this, {
        fill: 0,
        duration: 0.6,
        ease: "power2.out",
      });
    },

    destroy() {
      clearTimeout(this.idleTimer);
      this.tween?.kill();
      this.stopListening?.();

      this.trigger?.kill();
      this.animation?.kill();

      this.trigger = null;
      this.animation = null;
    },
  };
}
