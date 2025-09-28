/**
 * Detects if the device used is "touch enabled"
 */
export function isTouchDevice() {
  return matchMedia("(hover: none), (pointer: coarse)").matches;
}
