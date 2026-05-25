/**
 * Mulberry32 — a tiny, deterministic 32-bit PRNG.
 * Used to make seed data reproducible across runs (no flaky demos).
 *
 * Seed any time. Same seed → same sequence.
 */
export class Prng {
  private state: number;

  constructor(seed: number = 0xa9ec_dead) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b_79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  bool(p = 0.5): boolean {
    return this.next() < p;
  }

  /** Returns a normally-distributed sample via Box-Muller */
  gaussian(mean: number, stdDev: number): number {
    const u = Math.max(this.next(), 1e-9);
    const v = Math.max(this.next(), 1e-9);
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mean + z * stdDev;
  }
}
