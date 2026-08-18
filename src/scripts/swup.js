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

// Leaving a project from the bottom of the page means the Next button is on
// screen at full opacity, and would be cut off abruptly. `overwrite` drops the
// scroll-driven opacity tween of `next()` if it is still running. A no-op when
// Next is out of view and already at 0.
const fadeOutNext = () =>
  gsap.to(".test", {
    opacity: 0,
    duration: 0.5,
    ease: "power2.in",
    overwrite: "auto",
  });

const swup = new Swup({
  animateHistoryBrowsing: true,
  plugins: [
    new SwupHeadPlugin(),
    new SwupScriptsPlugin(),
    new SwupDebugPlugin(),
    new SwupJsPlugin({
      animations: [
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

            // The Next fade is shorter than the unreveal, so it settles well
            // before the image starts sliding.
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

            // All three run at once, but the exit is only over when the longest
            // one is: an `onStart` callback would let Swup swap the content
            // while the unreveal is still playing.
            await Promise.all([
              revealInstance.unreveal({ slideUp: false }),
              revealInstance.unrevealVisible(),
              fadeOutNext(),
            ]);
          },
          in: async () => {
            if (!isDesktopLandscape()) {
              await fadeIn();
              return;
            }

            // Only the incoming panel image fades. Fading the outgoing one out
            // would leave the panel text — white, and only half masked out by
            // then — over the page background.
            // The medias need nothing here: they come back through the scroll
            // reveals of `reveal()`, from the same 20px offset as a first visit.
            await gsap.from(".image", {
              opacity: 0,
              duration: 0.5,
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
