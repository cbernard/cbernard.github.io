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
        // Le skewing étire le curseur via scaleX/scaleY pendant le
        // déplacement : joli sur un point, illisible sur la pill de l'état
        // `-pill`, dont le texte se déformerait.
        skewingText: 0,
      });
    }
  }

  reset() {
    if (!this.#cursor) {
      return;
    }

    // Swup remplace le DOM sans forcément déclencher le `mouseout` qui
    // nettoierait l'état : sans `removeText`, la pill de `-pill` resterait
    // collée après navigation.
    this.#cursor.removeIcon();
    this.#cursor.removeText();
    this.#cursor.removeState("-exclusion -md -lg -pill");
  }
}

const cursorInstance = new Cursor();

export default cursorInstance;
