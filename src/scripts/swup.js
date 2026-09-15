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

// The curve `loader.js` registers for its curtain.
const coverDuration = 0.6;
const coverEasing = "reveal";

// Share of the height the page underneath drifts over, the ratio the loader
// curtain keeps with the page it uncovers.
const coverDrift = 0.6;

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

let leaving = null;

const dropLeaving = () => {
  leaving?.remove();
  leaving = null;
};

// Swup throws the old container away when it renders the new one: the page on
// its way out is copied into an overlay and pushed from there.
const captureLeaving = () => {
  dropLeaving();

  const container = document.querySelector("#swup");

  if (!container) {
    return;
  }

  // A copy and not the container itself: Alpine undoes the classes and the
  // styles it bound the moment its elements leave the document, and the page
  // would slide out undressed.
  const page = container.cloneNode(true);

  page.removeAttribute("id");

  // Detached, the copy is out of Alpine's reach, but the reveal queries the
  // whole document: without these hooks it cannot restage a page that leaves.
  page.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach(({ name }) => {
      if (/^(x-|:|@|data-split|data-reveal)/.test(name)) {
        element.removeAttribute(name);
      }
    });
  });

  // `top` and not a transform: a transformed ancestor would become the
  // containing block of the `fixed` elements the page holds and move them
  // twice.
  page.style.position = "relative";
  page.style.top = `-${scrollInstance.scrollY}px`;

  leaving = document.createElement("div");
  leaving.className =
    "pointer-events-none fixed inset-0 overflow-hidden bg-white dark:bg-black";
  leaving.append(page);
  document.body.append(leaving);

  // Here on the other hand the transform is what anchors those same `fixed`
  // elements to the overlay, so that they travel with it.
  gsap.set(leaving, { y: 0 });
};

// The distance a page travels to clear the viewport on the given axis.
const span = (element, axis) => {
  const { width, height } = element.getBoundingClientRect();

  return axis === "x" ? width : height;
};

// Waiting off to the side, the arriving page makes the document wider than the
// viewport and a mobile browser zooms out to fit it. Both elements: the root
// hands its overflow to the viewport and is itself left visible, so the body
// keeps widening the page on its own.
const clipSides = () => {
  const elements = [document.documentElement, document.body];

  elements.forEach((element) => {
    element.style.overflowX = "hidden";
  });

  return () =>
    elements.forEach((element) => element.style.removeProperty("overflow-x"));
};

// The arriving page rises over the one it replaces, which drifts under it.
// `direction` is the edge it comes in from: 1 the end of the axis, -1 its
// start.
const cover = (axis = "y", direction = 1) => {
  if (!leaving) {
    return fadeIn();
  }

  const distance = span(leaving, axis) * direction;
  const unclip = axis === "x" ? clipSides() : null;

  // The copy is what gets covered, so it goes under the arriving page.
  leaving.style.zIndex = -1;

  // Transformed, the container is its own blending group: what it holds in
  // `mix-blend-mode` has nothing left to blend with unless the page carries
  // the background of the body along.
  gsap.set("#swup", {
    backgroundColor: getComputedStyle(document.body).backgroundColor,
  });

  return gsap
    .timeline({
      onComplete: () => {
        dropLeaving();
        gsap.set("#swup", { clearProps: "transform,backgroundColor" });
        unclip?.();
      },
    })
    .to(
      leaving,
      {
        [axis]: -distance * coverDrift,
        duration: coverDuration,
        ease: coverEasing,
      },
      0,
    )
    .fromTo(
      "#swup",
      { [axis]: distance },
      { [axis]: 0, duration: coverDuration, ease: coverEasing },
      0,
    )
    .then();
};

// The way back, `cover` played backwards: the page on top leaves the viewport
// while the one underneath drifts into place. It travels by the layer the
// loader slides in on the first load — on Works everything on screen is
// `fixed` inside it, so the layer moves without its container, and so without
// the scroll the accordion restores on mount.
const uncover = (axis = "y", direction = 1) => {
  if (!leaving) {
    return fadeIn();
  }

  const distance = span(leaving, axis) * direction;
  const layer = "[data-reveal-slide-up='load']";
  const unclip = axis === "x" ? clipSides() : null;

  return gsap
    .timeline({
      onComplete: () => {
        dropLeaving();
        gsap.set(layer, { clearProps: "transform" });
        unclip?.();
      },
    })
    .to(
      leaving,
      { [axis]: distance, duration: coverDuration, ease: coverEasing },
      0,
    )
    .fromTo(
      layer,
      { [axis]: -distance * coverDrift },
      { [axis]: 0, duration: coverDuration, ease: coverEasing },
      0,
    )
    .then();
};

const swup = new Swup({
  animateHistoryBrowsing: true,
  plugins: [
    new SwupHeadPlugin(),
    new SwupScriptsPlugin(),
    new SwupDebugPlugin(),
    new SwupJsPlugin({
      animations: [
        // Works and About share no element to carry over: one covers the other
        // instead, the way the loader curtain covers the page underneath.
        {
          from: "(/)",
          to: "(/about/?)",
          out: async (_, { visit }) => {
            // About rides in composed: staging its reveal on top of the cover
            // would read as two moves.
            visit.meta.composed = true;
            captureLeaving();
          },
          // Portrait mirrors the works transition; the desktop keeps the
          // vertical cover.
          in: () => (isDesktopLandscape() ? cover() : cover("x", -1)),
        },
        {
          from: "(/about/?)",
          to: "(/)",
          // Works comes back on its own reveal, the fade it plays when a
          // project closes.
          out: async () => captureLeaving(),
          in: () => (isDesktopLandscape() ? uncover() : uncover("x", -1)),
        },
        {
          from: "(/)",
          to: "(/project/.*)",
          out: async () => {
            // Portrait has none of the split layout the desktop animation
            // slides apart, so the pages cover each other there too.
            if (!isDesktopLandscape()) {
              captureLeaving();
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
              await cover("x");
            }
          },
        },
        {
          from: "(/project/.*)",
          to: "(/)",
          out: async () => {
            if (!isDesktopLandscape()) {
              captureLeaving();
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
              await uncover("x");
            }
          },
        },
        {
          from: "(/project/.*)",
          to: "(/project/.*)",
          out: async () => {
            if (!isDesktopLandscape()) {
              captureLeaving();
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
              await cover();
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
