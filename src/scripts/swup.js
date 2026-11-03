import Alpine from "alpinejs";
import gsap from "gsap";
import Swup from "swup";

import scrollInstance from "./scroll.js";
import revealInstance from "./reveal.js";
import { isHomepage, isLostPage } from "./alpine.js";
import SwupHeadPlugin from "@swup/head-plugin";
import SwupScriptsPlugin from "@swup/scripts-plugin";
import SwupDebugPlugin from "@swup/debug-plugin";
import SwupJsPlugin from "@swup/js-plugin";

const duration = 0.75;
const easing = "power3.inOut";

// How much faster the way back from a project to Works plays.
const backSpeed = 1.4;

// The curve `loader.js` registers for its curtain.
const coverDuration = 1;
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

const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

// The mobile layout, on a phone or in a narrow window, opens Works and a
// project on the same picture, in the same place: it stays put while the rest
// of the page changes around it.
const sharesImage = () =>
  window.matchMedia("(orientation: portrait)").matches &&
  !window.matchMedia(`(min-width: ${breakpoint("md")})`).matches;

// Opacity only: the accordion owns the transform of some of these.
const hideAround = (targets, speed = 1) =>
  gsap
    .to(targets, { opacity: 0, duration: 0.3, ease: "power2.in" })
    .timeScale(speed)
    .then();

// From and to: `holdImage` may already have hidden them.
const showAround = (targets, speed = 1) =>
  gsap
    .fromTo(
      targets,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.05,
        clearProps: "opacity,transform",
      },
    )
    .timeScale(speed)
    .then();

// How long the copy stays under the new picture once that one is decoded:
// Safari paints a decoded image some frames later still.
const PAINT_DELAY = 300;

// Safari paints a fresh image a few frames after it lands, blank until then.
// The new picture stays up, the copy of the page left under it, cut to its
// frame: it shows the same image, so a blank frame shows that one. Without
// its overlay, as the overlay of the new picture already darkens it.
const holdImage = async (around) => {
  if (!leaving) {
    return;
  }

  const frame = document.querySelector("#swup .image, #swup .projects");

  if (around) {
    gsap.set(around, { opacity: 0 });
  }

  if (frame) {
    const { top, right, bottom, left } = frame.getBoundingClientRect();

    leaving.style.clipPath = `inset(${top}px ${window.innerWidth - right}px ${window.innerHeight - bottom}px ${left}px)`;
  }

  leaving
    .querySelectorAll("[style*='--overlay']")
    .forEach((overlay) => overlay.remove());

  leaving.style.zIndex = -1;

  await Promise.race([
    Promise.all(
      [...(frame?.querySelectorAll("img") ?? [])].map((image) =>
        image.decode().catch(() => {}),
      ),
    ),
    new Promise((resolve) => setTimeout(resolve, 500)),
  ]);

  await new Promise((resolve) => setTimeout(resolve, PAINT_DELAY));
  dropLeaving();
};

// Outside the page, it would stand still over both while one covers the
// other.
const switcher = "[data-theme-switcher]";

const hideSwitcher = () =>
  gsap.to(switcher, { opacity: 0, duration: 0.2, ease: "power2.in" }).then();

const showSwitcher = () =>
  gsap.to(switcher, {
    opacity: 1,
    duration: 0.4,
    ease: "power2.out",
    clearProps: "opacity",
  });

// Lenis calls no `onComplete` for a scroll it has nothing to do.
const scrollToTop = () =>
  scrollInstance.scrollY > 0
    ? new Promise((resolve) =>
        scrollInstance.scrollTo(0, {
          duration: 0.6 / backSpeed,
          easing: (t) => 1 - Math.pow(1 - t, 3),
          onComplete: resolve,
        }),
      )
    : Promise.resolve();

const fadeOut = () =>
  gsap.to("#swup", { opacity: 0, duration: 0.3, ease: "power2.out" });

const fadeIn = () =>
  gsap.fromTo(
    "#swup",
    { opacity: 0 },
    { opacity: 1, duration: 0.6, ease: "power2.out" },
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

let leaving = null;

// The `[data-shared]` element of the page left, as it stood on screen.
let shared = null;

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

  const element = container.querySelector("[data-shared]");

  shared = element && {
    node: element.cloneNode(true),
    rect: element.getBoundingClientRect(),
  };

  // A copy and not the container itself: Alpine undoes the classes and the
  // styles it bound the moment its elements leave the document, and the page
  // would slide out undressed.
  const page = container.cloneNode(true);

  page.removeAttribute("id");

  // A clone carries no bitmap: what the canvases show is painted back in.
  const canvases = container.querySelectorAll("canvas");

  page.querySelectorAll("canvas").forEach((canvas, index) => {
    canvas.width = canvases[index].width;
    canvas.height = canvases[index].height;
    canvas.getContext("2d").drawImage(canvases[index], 0, 0);
  });

  // A cloned image is blank until Safari paints it again, some frames later:
  // the picture on screen goes over as a canvas, painted at once.
  const media = container.querySelectorAll(".image img, .projects img");

  page.querySelectorAll(".image img, .projects img").forEach((copy, index) => {
    const source = media[index];

    if (
      !source.naturalWidth ||
      source.checkVisibility?.({ opacityProperty: true }) === false
    ) {
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    canvas.className = source.className;
    canvas.getContext("2d").drawImage(source, 0, 0);
    copy.replaceWith(canvas);
  });

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

// Held still while the pages slide when both carry it at the same place: a copy
// stands over the transition, the two pages travel without theirs.
const holdShared = () => {
  const arriving = document.querySelector("#swup [data-shared]");

  if (
    !isTouch() ||
    !shared?.rect.width ||
    !arriving?.getBoundingClientRect().width
  ) {
    return null;
  }

  const { node, rect } = shared;
  const holder = document.createElement("div");

  holder.style.cssText = `position: fixed; z-index: 9100; pointer-events: none; left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px`;
  holder.append(node);
  document.body.append(holder);

  const hidden = [arriving, leaving.querySelector("[data-shared]")];

  hidden.forEach((element) => (element.style.visibility = "hidden"));

  return () => {
    holder.remove();
    hidden.forEach((element) => element.style.removeProperty("visibility"));
  };
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
const cover = (axis = "y", direction = 1, seconds = coverDuration) => {
  if (!leaving) {
    return fadeIn();
  }

  const distance = span(leaving, axis) * direction;
  const unclip = axis === "x" ? clipSides() : null;
  const release = holdShared();

  // The copy is what gets covered, so it goes under the arriving page.
  leaving.style.zIndex = -1;

  // Transformed, the container is its own blending group: what it holds in
  // `mix-blend-mode` has nothing left to blend with unless the page carries
  // the background of the body along.
  gsap.set("#swup", {
    backgroundColor: getComputedStyle(document.body).backgroundColor,
  });

  // Clipped to the screen it brings in: its background would otherwise run
  // down over the page it covers, which only the first screen should hide.
  const swupHeight = document.querySelector("#swup").offsetHeight;
  gsap.set("#swup", {
    clipPath: `inset(0 0 ${Math.max(0, swupHeight - window.innerHeight)}px 0)`,
  });

  return gsap
    .timeline({
      onComplete: () => {
        dropLeaving();
        gsap.set("#swup", {
          clearProps: "transform,backgroundColor,clipPath",
        });
        unclip?.();
        release?.();
      },
    })
    .to(
      leaving,
      {
        [axis]: -distance * coverDrift,
        duration: seconds,
        ease: coverEasing,
      },
      0,
    )
    .fromTo(
      "#swup",
      { [axis]: distance },
      { [axis]: 0, duration: seconds, ease: coverEasing },
      0,
    )
    .then();
};

// The way back, `cover` played backwards: the page on top leaves the viewport
// while the one underneath drifts into place. It travels by the layer the
// loader slides in on the first load — on Works everything on screen is
// `fixed` inside it, so the layer moves without its container, and so without
// the scroll the accordion restores on mount.
const uncover = (axis = "y", direction = 1, seconds = coverDuration) => {
  if (!leaving) {
    return fadeIn();
  }

  const distance = span(leaving, axis) * direction;
  const layer = "[data-reveal-slide-up='load']";
  const unclip = axis === "x" ? clipSides() : null;
  const release = holdShared();

  return gsap
    .timeline({
      onComplete: () => {
        dropLeaving();
        gsap.set(layer, { clearProps: "transform" });
        unclip?.();
        release?.();
      },
    })
    .to(leaving, { [axis]: distance, duration: seconds, ease: coverEasing }, 0)
    .fromTo(
      layer,
      { [axis]: -distance * coverDrift },
      { [axis]: 0, duration: seconds, ease: coverEasing },
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
          // About rides in composed: staging its reveal on top of the cover
          // would read as two moves.
          out: async (_, { visit }) => {
            visit.meta.composed = true;
            captureLeaving();
          },
          in: () => cover(),
        },
        {
          from: "(/about/?)",
          to: "(/)",
          // Works comes back on its own reveal, the fade it plays when a
          // project closes.
          out: async () => captureLeaving(),
          in: () => uncover(),
        },
        {
          from: "(/)",
          to: "(/project/.*)",
          out: async (_, { visit }) => {
            visit.meta.sharesImage = sharesImage();

            if (visit.meta.sharesImage) {
              await hideAround(
                "[data-around-image], [data-reveal-fade='swup']",
              );
              captureLeaving();
              return;
            }

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
              )
              // The image slides over the copy, which would otherwise show
              // through until the swap.
              .to(
                "[x-ref='container'], [data-around-image]",
                { opacity: 0, duration: 0.4, ease: "power2.in" },
                "<",
              );

            // Stands in for the image until the one of the project is decoded.
            captureLeaving();
          },
          in: async (_, { visit }) => {
            if (visit.meta.sharesImage) {
              const around =
                "[data-around-image], .panel .image ~ :not([data-shared])";

              await holdImage(around);
              await showAround(around);
              return;
            }

            if (!isDesktopLandscape()) {
              await cover("x", 1, duration);
              return;
            }

            await holdImage();
          },
        },
        {
          from: "(/project/.*)",
          to: "(/)",
          out: async (_, { visit }) => {
            visit.meta.sharesImage = sharesImage();

            if (visit.meta.sharesImage) {
              await scrollToTop();
              await hideAround(
                "[data-around-image], .panel .image ~ :not([data-shared])",
                backSpeed,
              );
              captureLeaving();
              return;
            }

            if (!isDesktopLandscape()) {
              captureLeaving();
              return;
            }

            await Promise.all([
              revealInstance.unreveal({ speed: backSpeed }),
              fadeOutNext().timeScale(backSpeed),
            ]);

            await gsap
              .to(".image", {
                xPercent: 100,
                duration: duration,
                ease: easing,
              })
              .timeScale(backSpeed);

            captureLeaving();
          },
          // The thumbnail and the list come back on the reveal.
          in: async (_, { visit }) => {
            if (visit.meta.sharesImage) {
              await holdImage("[data-around-image]");
              await showAround("[data-around-image]", backSpeed);
              return;
            }

            if (!isDesktopLandscape()) {
              await uncover("x", 1, duration / backSpeed);
              return;
            }

            await holdImage();
          },
        },
        // The next project rises from below, where the scroll was heading.
        {
          from: "(/project/.*)",
          to: "(/project/.*)",
          out: async () => {
            scrollInstance.lock();

            if (!isDesktopLandscape()) {
              await hideSwitcher();
            }

            captureLeaving();
          },
          in: async () => {
            await cover();
            showSwitcher();
          },
        },
        // A 404 can sit at any path, so it is told by its marker and not by a
        // route: the page it leads to comes down over it from the top.
        {
          from: "(.*)",
          to: "(.*)",
          out: async (_, { visit }) => {
            visit.meta.fromLost = isLostPage();

            if (visit.meta.fromLost) {
              captureLeaving();
            }
          },
          in: async (_, { visit }) => {
            if (visit.meta.fromLost) {
              // Works restores its scroll from where its items stand: they
              // are measured before the page is moved out of place.
              gsap.set("#swup", { visibility: "hidden" });
              await new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              );
              gsap.set("#swup", { clearProps: "visibility" });

              await cover("y", -1);
            }
          },
        },
      ],
    }),
  ],
});

swup.hooks.on("content:replace", () => {
  // Forced, or a locked scroll would stay at the bottom of the page left.
  scrollInstance.scrollTo(0, { immediate: true, force: true });
});

// After the `in` animation; a visit cut short reaches it through the next one.
swup.hooks.on("visit:end", () => scrollInstance.unlock());

swup.hooks.on("page:view", () => {
  Alpine.store("main").isHome = isHomepage();
  Alpine.store("main").isLost = isLostPage();
});

export default swup;
