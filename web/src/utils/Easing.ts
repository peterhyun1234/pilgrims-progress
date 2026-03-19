export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeIn(t: number): number {
  return t * t * t;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
