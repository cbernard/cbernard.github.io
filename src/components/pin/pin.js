/**
 * Drives the pins of the about page: the picture behind them, swapped on hover
 * on a mouse, held as a postcard while the finger stays pressed on a touch
 * screen.
 *
 * The listeners are delegated from the wrapper rather than bound on the buttons:
 * the pins sit inside `[data-split]`, whose markup SplitText rebuilds on every
 * reveal, and `pointerenter` / `pointerleave` do not bubble.
 */
// Matches the entrance of the postcard, so the copy and the picture move
// together.
const FADE = "opacity 0.3s ease-out";

// What is left of the real pin under its picture.
const FADED = "0.32";

export default function pins() {
  return {
    active: null,
    pressed: null,
    lifted: [],

    init() {
      this.onOver = this.handleOver.bind(this);
      this.onOut = this.handleOut.bind(this);
      this.onDown = this.handleDown.bind(this);
      this.onRelease = this.handleRelease.bind(this);
      this.onContextMenu = this.handleContextMenu.bind(this);

      this.$el.addEventListener("pointerover", this.onOver);
      this.$el.addEventListener("pointerout", this.onOut);
      this.$el.addEventListener("pointerdown", this.onDown);
      this.$el.addEventListener("contextmenu", this.onContextMenu);

      // The finger can lift anywhere: outside the pin, or outside the page when
      // the browser cancels the gesture — hence the window and not `$el`.
      window.addEventListener("pointerup", this.onRelease);
      window.addEventListener("pointercancel", this.onRelease);
    },

    isActive(index) {
      return this.active === index;
    },

    isPressed(index) {
      return this.pressed === index;
    },

    getIndex(event) {
      const pin = event.target.closest?.("[data-pin]");

      return pin ? Number(pin.dataset.pin) : null;
    },

    handleOver(event) {
      const index = this.getIndex(event);

      if (event.pointerType !== "mouse" || index === null) {
        return;
      }

      this.active = index;
    },

    handleOut(event) {
      if (event.pointerType !== "mouse" || this.getIndex(event) === null) {
        return;
      }

      this.active = null;
    },

    // A press leaves `active` alone: the panel on the left is off screen as soon
    // as the copy is scrolled to, so a touch only ever shows the postcard.
    handleDown(event) {
      const index = this.getIndex(event);

      if (event.pointerType === "mouse" || index === null) {
        return;
      }

      this.pressed = index;
      this.lift(index);
    },

    handleRelease() {
      this.pressed = null;
      this.drop();
    },

    /**
     * Copies the pin over its own picture and leaves the real one behind it,
     * faded. Word by word rather than the label in one piece: each word already
     * has its own box, so a label broken over two lines lands right.
     */
    lift(index) {
      const layer = document.querySelector("[data-pin-ghosts]");
      const labels = document.querySelectorAll(`[data-pin-label="${index}"]`);

      if (!layer) {
        return;
      }

      this.lifted = [...labels].flatMap((label) => [
        ...label.querySelectorAll(".word, [data-pin]"),
      ]);

      this.lifted.forEach((part) => {
        layer.appendChild(this.getGhost(part));

        part.style.transition = FADE;
        part.style.opacity = FADED;
      });
    },

    drop() {
      document.querySelector("[data-pin-ghosts]")?.replaceChildren();

      this.lifted.forEach((part) => {
        part.style.opacity = "";
      });

      this.lifted = [];
    },

    /**
     * The copy is a step out of the flow, so nothing of its typography is
     * inherited: it is read off the original and written back on the ghost.
     */
    getGhost(part) {
      const rect = part.getBoundingClientRect();
      const styles = getComputedStyle(part);
      const ghost = part.cloneNode(true);

      // A second `[data-pin]` would answer the delegated listeners, and the
      // Alpine binding of the label would bind a second time.
      ["data-pin", "data-pin-label", "data-cursor-stick", ":data-active"].forEach(
        (attribute) => ghost.removeAttribute(attribute),
      );

      ghost.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        margin: 0;
        color: #fff;
        opacity: 0;
        transition: ${FADE};
        font-family: ${styles.fontFamily};
        font-size: ${styles.fontSize};
        font-weight: ${styles.fontWeight};
        line-height: ${styles.lineHeight};
        letter-spacing: ${styles.letterSpacing};
      `;

      requestAnimationFrame(() => {
        ghost.style.opacity = "1";
      });

      return ghost;
    },

    // A long press on the pin is the gesture that holds the postcard open, the
    // native callout would cut it short.
    handleContextMenu(event) {
      if (this.getIndex(event) !== null) {
        event.preventDefault();
      }
    },

    destroy() {
      this.$el.removeEventListener("pointerover", this.onOver);
      this.$el.removeEventListener("pointerout", this.onOut);
      this.$el.removeEventListener("pointerdown", this.onDown);
      this.$el.removeEventListener("contextmenu", this.onContextMenu);

      window.removeEventListener("pointerup", this.onRelease);
      window.removeEventListener("pointercancel", this.onRelease);
    },
  };
}
