export function offsetsFor(sizes: number[]): number[] {
  const offsets = [0];

  for (const size of sizes) {
    offsets.push(offsets[offsets.length - 1] + size);
  }

  return offsets;
}

export function nearestOffsetIndex(offsets: number[], value: number): number {
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

export function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
