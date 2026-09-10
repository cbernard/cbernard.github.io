import Alpine from "alpinejs";
import gsap from "gsap";
import Swup from "swup";

import scrollInstance from "./scroll.js";
import revealInstance from "./reveal.js";
import { isHomepage } from "./alpine.js";
import SwupHeadPlugin from "@swup/head-plugin";
import SwupScriptsPlugin from "@swup/scripts-plugin";
import SwupDebugPlugin from "@swup/debug-plugin";
import SwupJsPlugin from "@swup/js-plugin";

const duration = 0.8;
const easing = "power4.inOut";

const breakpoint = (name) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(`--breakpoint-${name}`)
    .trim();

const isDesktopLandscape = () =>
  window.matchMedia(
    `(min-width: ${breakpoint("lg")}) and (orientation: landscape)`,
  ).matches;

const fadeOut = () =>
  gsap.to("#swup", { opacity: 0, duration: 0.3, ease: "power2.out" });

const fadeIn = () =>
  gsap.fromTo(
    "#swup",
    { opacity: 0 },
    { opacity: 1, duration: 0.3, ease: "power2.out" },
  );

// `overwrite` drops the scroll-driven opacity tween of `next()` if it is still
// running.
const fadeOutNext = () =>
  gsap.to(".test", {
    opacity: 0,
    duration: 0.5,
    ease: "power2.in",
    overwrite: "auto",
  });

// On `duration`, the length of the unreveal, so the fade costs no extra time.
const fadeOutPanel = () =>
  gsap.to(".panel", { opacity: 0, duration: duration, ease: "power2.in" });

const swup = new Swup({
  animateHistoryBrowsing: true,
  plugins: [
    new SwupHeadPlugin(),
    new SwupScriptsPlugin(),
    new SwupDebugPlugin(),
    new SwupJsPlugin({
      animations: [
        // Works and About share no element to carry over, so both ways fade.
        {
          from: "(/)",
          to: "(/about/?)",
          out: fadeOut,
          in: fadeIn,
        },
        {
          from: "(/about/?)",
          to: "(/)",
          out: fadeOut,
          in: fadeIn,
        },
        {
          from: "(/)",
          to: "(/project/.*)",
          out: async () => {
            if (!isDesktopLandscape()) {
              await fadeOut();
              return;
            }

            await gsap
              .timeline()
              .to(".projects", {
                xPercent: -100,
                duration: duration,
                ease: easing,
              })
              .to(
                ".projects__thumbnail",
                { xPercent: 100, duration: duration, ease: easing },
                "<",
              );
          },
          in: async () => {
            if (!isDesktopLandscape()) {
              await fadeIn();
            }
          },
        },
        {
          from: "(/project/.*)",
          to: "(/)",
          out: async () => {
            if (!isDesktopLandscape()) {
              await fadeOut();
              return;
            }

            await Promise.all([revealInstance.unreveal(), fadeOutNext()]);

            await gsap.to(".image", {
              xPercent: 100,
              duration: 0.8,
              ease: easing,
            });
          },
          in: async () => {
            if (!isDesktopLandscape()) {
              await fadeIn();
            }
          },
        },
        {
          from: "(/project/.*)",
          to: "(/project/.*)",
          out: async () => {
            if (!isDesktopLandscape()) {
              await fadeOut();
              return;
            }

            // Awaited together: Swup must not swap the content until the
            // longest of the four is done.
            await Promise.all([
              revealInstance.unreveal({ slideUp: false }),
              revealInstance.unrevealVisible(),
              fadeOutNext(),
              fadeOutPanel(),
            ]);
          },
          in: async () => {
            if (!isDesktopLandscape()) {
              await fadeIn();
              return;
            }

            // Incoming image only; the medias come back through `reveal()`.
            await gsap.from(".image", {
              opacity: 0,
              duration: duration,
              ease: "power2.out",
            });
          },
        },
      ],
    }),
  ],
});

swup.hooks.on("content:replace", () => {
  scrollInstance.scrollTo(0, { immediate: true });
});

swup.hooks.on("page:view", () => {
  Alpine.store("main").isHome = isHomepage();
});

export default swup;
