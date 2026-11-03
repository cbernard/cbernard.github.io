// Safari slides a snapshot of the page on a two-finger swipe, and Swup then
// skips its own transition: the gesture is taken over and replayed as a plain
// history step, which Swup animates.

// In pixels of `deltaX`, far enough to tell a swipe from a drift of the fingers.
const THRESHOLD = 80;

// In ms without a wheel event, the end of the gesture and of its inertia.
const GESTURE_END = 200;

export default function historySwipe() {
  let distance = 0;
  let done = false;
  let timer = null;

  window.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
        return;
      }

      event.preventDefault();

      clearTimeout(timer);
      timer = setTimeout(() => {
        distance = 0;
        done = false;
      }, GESTURE_END);

      if (done) {
        return;
      }

      distance += event.deltaX;

      if (Math.abs(distance) > THRESHOLD) {
        done = true;
        distance < 0 ? history.back() : history.forward();
      }
    },
    { passive: false },
  );
}
