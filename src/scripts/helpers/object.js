/**
 * Check if the param is an object
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Check if the value is a plain object
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

/**
 * Deep merge two objects.
 *
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isPlainObject(target) && isPlainObject(source)) {
    for (const key in source) {
      if (isPlainObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}
