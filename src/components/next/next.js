import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import swup from "../../scripts/swup.js";

gsap.registerPlugin(ScrollTrigger);

export default function next(href) {
  return {
    // Fills over the last 10% of the page scroll, not the pin.
    get progress() {
      const scroll = this.$store.main.scrollProgress;
      return `${gsap.utils.clamp(0, 1, (scroll - 0.9) / 0.1) * 100}%`;
    },

    init() {
      gsap.set(".test", {
        opacity: 0,
      });

      ScrollTrigger.create({
        trigger: ".test",
        start: "bottom bottom-=40px",
        end: "+=300",
        toggleActions: "play none none reverse",
        markers: true,
        pin: true,
        onLeave: () => swup.navigate(href),
        animation: gsap.to(".test", {
          opacity: 1,
          duration: 0.2,
          delay: 0.2,
        }),
      });
    },

    destroy() {
      ScrollTrigger.killAll();
    },
  };
}
