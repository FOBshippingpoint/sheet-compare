/**
 * @param {number[]} sizes
 */
export function offsetsFor(sizes) {
  const offsets = [0];

  for (const size of sizes) {
    offsets.push(offsets[offsets.length - 1] + size);
  }

  return offsets;
}

/**
 * @param {number[]} offsets
 * @param {number} value
 */
export function nearestOffsetIndex(offsets, value) {
  let nearest = 0;
  let distance = Infinity;

  for (let i = 0; i < offsets.length; i++) {
    const candidateDistance = Math.abs(value - offsets[i]);

    if (candidateDistance < distance) {
      nearest = i;
      distance = candidateDistance;
    }
  }

  return nearest;
}

export function clamp(min, value, max) {
  return Math.min(max, Math.max(min, value));
}
