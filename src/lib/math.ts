export const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Frame-rate independent exponential smoothing. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt))

/** Remaps `v` from [a, b] to [0, 1], clamped. */
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a))

export const smoothstep = (t: number) => t * t * (3 - 2 * t)

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
