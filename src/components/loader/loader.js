import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

import app from "../../scripts/app.js";

gsap.registerPlugin(CustomEase);

CustomEase.create("reveal", "0.5, 0, 0, 1");

// The loader stays up at least this long, counted from its start, so the
// counter is read even when everything comes from the cache.
const MIN_DURATION = 1.2;

// Settles either way: a file that fails must not hold the loader up.
const loadImage = ({ src, srcset, sizes }, priority = "auto") =>
  new Promise((resolve) => {
    const image = new Image();

    image.onload = image.onerror = resolve;
    image.fetchPriority = priority;

    // `sizes` and `srcset` before `src`, or the fallback starts downloading.
    if (sizes) image.sizes = sizes;
    if (srcset) image.srcset = srcset;
    image.src = src;
  });

const loadFile = (url) =>
  fetch(url)
    .then((response) => response.blob())
    .catch(() => {});

// One at a time and at low priority, while the browser is idle: the page in
// sight keeps the bandwidth.
const loadLater = async (images) => {
  for (const image of images) {
    await new Promise((resolve) =>
      (window.requestIdleCallback ?? setTimeout)(resolve),
    );
    await loadImage(image, "low");
  }
};

export default function loader({ fonts = [], images = [], later = [] } = {}) {
  return {
    init() {
      this.start = performance.now();

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
          loadLater(later);
        },
      });
      const duration = 0.8;
      const easing = "reveal";

      tl.to(this.$el, {
        yPercent: "-100",
        delay: Math.max(
          0,
          MIN_DURATION - (performance.now() - this.start) / 1000,
        ),
        onStart: () => delete document.documentElement.dataset.loading,
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
