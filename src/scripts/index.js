import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./alpine.js";
import "./cursor.js";
import "./scroll.js";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  const split = SplitText.create("[data-split]", {
    type: "words, lines",
    mask: "lines",
  });

  split.lines.forEach((item) => {
    gsap.set(item, {
      yPercent: 100,
    });

    ScrollTrigger.create({
      trigger: item,
      start: "top 100%",
      onEnter: () => {
        gsap.to(item, {
          yPercent: 0,
          stagger: 0.1,
        });
      },
    });
  });
});
