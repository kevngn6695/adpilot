/** Rounds a max value up to a "nice" number so axis ticks land on round values. */
export function niceMax(value: number, tickCount = 4): number {
  if (value <= 0) return tickCount;
  const rawStep = value / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceStep = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return niceStep * magnitude * tickCount;
}

export function linear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

/**
 * Nudges label positions apart so none overlap, keeping each as close to its
 * line end as possible. Input and output are in the same order.
 */
export function spreadLabels(positions: number[], minGap: number, min: number, max: number): number[] {
  const order = positions.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);

  for (let k = 1; k < order.length; k += 1) {
    const prev = order[k - 1]!;
    const cur = order[k]!;
    if (cur.y - prev.y < minGap) cur.y = prev.y + minGap;
  }
  // If the stack ran off the bottom, push it back up.
  const overflow = (order.at(-1)?.y ?? 0) - max;
  if (overflow > 0) for (const item of order) item.y -= overflow;
  for (const item of order) item.y = Math.max(item.y, min);

  const result: number[] = [];
  for (const item of order) result[item.i] = item.y;
  return result;
}
