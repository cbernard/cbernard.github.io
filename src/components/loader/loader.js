import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

import app from "../../scripts/app.js";

gsap.registerPlugin(CustomEase);

CustomEase.create("reveal", "0.5, 0, 0, 1");

// Settles either way: a file that fails must not hold the loader up.
const loadImage = ({ src, srcset, sizes }) =>
  new Promise((resolve) => {
    const image = new Image();

    image.onload = image.onerror = resolve;

    // `sizes` and `srcset` before `src`, or the fallback starts downloading.
    if (sizes) image.sizes = sizes;
    if (srcset) image.srcset = srcset;
    image.src = src;
  });

const loadFile = (url) =>
  fetch(url)
    .then((response) => response.blob())
    .catch(() => {});

export default function loader({ fonts = [], images = [] } = {}) {
  return {
    init() {
      const tasks = [...fonts.map(loadFile), ...images.map(loadImage)];
      let loaded = 0;

      Promise.all(
        tasks.map((task) =>
          task.then(() => {
            loaded++;
            Alpine.store("main").loading = loaded / tasks.length;
          }),
        ),
      ).then(() => {
        Alpine.store("main").loading = 1;
        Alpine.store("main").loaded = true;
        this.transitioningOut();
      });
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
