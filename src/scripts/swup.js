import Alpine from "alpinejs";
import gsap from "gsap";
import Swup from "swup";

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
            await gsap.to(".image", {
              xPercent: 100,
              duration: 0.8,
              ease: easing,
            });
          },
          in: async () => {
            if (!isDesktopLandscape()) await fadeIn();
          },
        },
      ],
    }),
  ],
});

swup.hooks.on("page:view", () => {
  Alpine.store("main").isHome = isHomepage();
});

export default swup;
