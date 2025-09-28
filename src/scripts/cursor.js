import gsap from "gsap";
import MouseFollower from "mouse-follower";

import { isTouchDevice } from "./helpers";

MouseFollower.registerGSAP(gsap);

export class Cursor {
  #cursor;

  constructor() {
    if (!isTouchDevice()) {
      this.#cursor = new MouseFollower({
        iconSvgSrc: "/assets/icons/sprite.svg",
      });
    }
  }

  reset() {
    if (!this.#cursor) {
      return;
    }

    this.#cursor.removeIcon();
    this.#cursor.removeState("-exclusion -md -lg");
  }
}

const cursorInstance = new Cursor();

export default cursorInstance;
