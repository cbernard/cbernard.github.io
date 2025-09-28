import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

import "./alpine.js";
import "./cursor.js";
import "./scroll.js";

document.addEventListener("DOMContentLoaded", () => {
  const split = SplitText.create("[data-split]", {
    type: "words, lines",
    mask: "lines",
  });

  const tween = gsap.from(split.lines, {
    yPercent: 100,
    stagger: 0.1,
  });
});
