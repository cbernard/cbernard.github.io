// Listeners are delegated from the wrapper: SplitText rebuilds the `[data-split]`
// markup the pins sit in, and `pointerenter` / `pointerleave` do not bubble.

// Matches the entrance of the postcard.
const FADE = "opacity 0.3s ease-out";

// What is left of the real pin under its picture.
const FADED = "0.32";

// Kept between the card and the edges of the viewport.
const MARGIN = 16;

// Tilt of the postcard, in degrees either way: never flat, and small enough
// for the 90vw card to stay on screen.
const MIN_ANGLE = 1.5;
const MAX_ANGLE = 4;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

      // The finger can lift anywhere, hence the window and not `$el`.
      window.addEventListener("pointerup", this.onRelease);
      window.addEventListener("pointercancel", this.onRelease);

      this.$watch("active", (index) => this.rewind(index, "data-pin-layer"));
      this.$watch("pressed", (index) => this.rewind(index, "data-postcard"));
    },

    // A clip starts over each time its pin is shown.
    rewind(index, attribute) {
      if (index === null) {
        return;
      }

      document
        .querySelectorAll(`[${attribute}="${index}"] video`)
        .forEach((video) => {
          video.currentTime = 0;
          video.play().catch(() => {});
        });
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

    // A press leaves `active` alone: a touch only ever shows the postcard.
    handleDown(event) {
      const index = this.getIndex(event);

      if (event.pointerType === "mouse" || index === null) {
        return;
      }

      this.place(index, event.target.closest("[data-pin]"));
      this.pressed = index;
      this.lift(index);
    },

    // Centered on the pin, as far as the viewport allows.
    place(index, pin) {
      const card = document.querySelector(`[data-postcard="${index}"]`);

      if (!card) {
        return;
      }

      const rect = pin.getBoundingClientRect();
      const { clientWidth, clientHeight } = document.documentElement;
      const half = card.offsetWidth / 2 + MARGIN;

      const x = clamp(rect.left + rect.width / 2, half, clientWidth - half);
      const y = clamp(rect.top + rect.height / 2, half, clientHeight - half);

      const angle =
        (MIN_ANGLE + Math.random() * (MAX_ANGLE - MIN_ANGLE)) *
        (Math.random() < 0.5 ? -1 : 1);

      card.style.setProperty("--x", `${x}px`);
      card.style.setProperty("--y", `${y}px`);
      card.style.setProperty("--angle", `${angle}deg`);
    },

    handleRelease() {
      this.pressed = null;
      this.drop();
    },

    // Word by word rather than in one piece: each word already has its own
    // box, so a label broken over two lines lands right.
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

    // The copy is out of the flow, so no typography is inherited.
    getGhost(part) {
      const rect = part.getBoundingClientRect();
      const styles = getComputedStyle(part);
      const ghost = part.cloneNode(true);

      // A second `[data-pin]` would answer the delegated listeners.
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

    // The long press holds the postcard open; the native callout cuts it short.
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
