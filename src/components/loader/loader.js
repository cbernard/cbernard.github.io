import Preload from "preload-it";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

import app from "../../scripts/app.js";

gsap.registerPlugin(CustomEase);

CustomEase.create("reveal", "0.5, 0, 0, 1");

export default function loader(assets = []) {
  return {
    init() {
      const preload = Preload();

      preload.onprogress = (event) => {
        Alpine.store("main").loading = (event.progress ?? 0) / 100;
      };

      preload.oncomplete = () => {
        this.transitioningOut();
      };

      preload.onerror = (item) => {
        console.warn("Preload error:", item);
      };

      preload.fetch(assets);
    },

    transitioningOut() {
      const tl = gsap.timeline({
        onComplete: () => {
          app.onPageReady({ revealDelay: 0 });
        },
      });
      const duration = 0.8;
      const easing = "reveal";

      tl.to(this.$el, {
        yPercent: "-100",
        delay: 2,
        duration,
        ease: easing,
      });

      if (document.querySelector('[data-reveal-slide-up="load"]')) {
        tl.from(
          '[data-reveal-slide-up="load"]',
          {
            y: "60vh",
            duration,
            ease: easing,
          },
          "<",
        );
      }
    },
  };
}
