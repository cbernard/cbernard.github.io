/**
 * Ensure that `el` is returned as an Element.
 */

export function lazySelector(el) {
  if (typeof el === "string") {
    return document.querySelector(el);
  } else if (el instanceof Element || el?.nodeType === 1) {
    return el;
  }
  throw new Error(`Expected Element or String, got ${typeof el}.`);
}

const focusableSelectors = [
  "a[href]",
  "area[href]",
  'input:not([type="hidden"]):not([type="radio"]):not([disabled])',
  'input[type="radio"]:not([disabled])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]",
  "[tabindex]",
  "[data-focusable]",
];

/**
 * Return an array of all focusable elements that are within the element passed as an argument.
 * @param {*} el
 * @return {Array}
 */
export function getFocusableElements(el) {
  const focusableEls = el.querySelectorAll(focusableSelectors.join(","));
  return Array.from(focusableEls);
}

/**
 * Return an array of all currently focusable elements (excluding `tabindex="-1") that are within the element passed as an argument.
 * @param {Element} el The element to search in
 * @return {Array}
 */
export function getCurrentlyFocusableElements(el) {
  const focusableEls = el.querySelectorAll(
    focusableSelectors
      .map((selector) => `${selector}:not([tabindex^="-"])`)
      .join(","),
  );

  return Array.from(focusableEls);
}

/**
 * Save the currently active element
 * @return {() => void} A function to restore the previously active element
 */
export function saveActiveElement() {
  const activeElement = document.activeElement;

  return () => {
    activeElement?.focus();
  };
}
