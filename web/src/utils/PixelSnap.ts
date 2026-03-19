export function pixelSnap(value: number): number {
  return Math.round(value);
}

export function pixelSnapVec(x: number, y: number): { x: number; y: number } {
  return { x: Math.round(x), y: Math.round(y) };
}
