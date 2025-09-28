/**
 * A helper for handling transitions.
 */

import { mergeDeep } from "./object";

export default class Transition {
  constructor(options = {}) {
    this._options = mergeDeep(
      {
        before: () => {},
        transition: () => {},
        after: () => {},
        event: "transitionend",
      },
      options,
    );

    this._onEnd = this._onEnd.bind(this);

    this._options.element.addEventListener(this._options.event, this._onEnd);

    // Fire a callback function before the transition starts
    this._options.before();

    // Perform the transition
    this._options.transition();
  }

  _onEnd(e) {
    // Ignore events that bubble up from child elements
    if (e.target !== this._options.element) {
      return;
    }

    // Remove the event listenrs to avoid duplicate behaviors
    this.destroy();

    // Fire a callback function after the transition ends
    this._options.after();
  }

  /**
   * Public
   */

  destroy() {
    this._options.element.removeEventListener(this._options.event, this._onEnd);
  }
}
