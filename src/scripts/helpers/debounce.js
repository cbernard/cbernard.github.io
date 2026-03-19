/**
 * Debounce a function call
 * Inspired by https://davidwalsh.name/javascript-debounce-function
 */
export function debounce(fn, wait, immediate = false) {
  let timeout;

  return function caller(...args) {
    const self = this;

    const later = () => {
      timeout = null;
      if (!immediate) {
        fn.apply(self, args);
      }
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      fn.apply(self, args);
    }
  };
}
