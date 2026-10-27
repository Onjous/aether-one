/** Client-only capability helpers. Never call during render on the server. */

export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ??
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false })
    if (!gl) return false
    // Release the probe context immediately so it does not count against the
    // browser's live-context limit.
    ;(gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export type DeviceTier = 'high' | 'medium' | 'low'

export interface DeviceProfile {
  tier: DeviceTier
  coarsePointer: boolean
  /** Upper bound for the renderer's device pixel ratio. */
  maxDpr: number
  shadows: boolean
  envResolution: number
  waveRows: number
}

export function getDeviceProfile(): DeviceProfile {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 768
  const cores = navigator.hardwareConcurrency ?? 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8

  let tier: DeviceTier = 'high'
  if (coarsePointer || narrow) tier = 'medium'
  if (cores <= 4 && memory <= 4) tier = 'low'

  return {
    tier,
    coarsePointer,
    maxDpr: tier === 'high' ? 2 : tier === 'medium' ? 1.75 : 1.25,
    shadows: tier === 'high',
    envResolution: tier === 'high' ? 256 : 128,
    waveRows: tier === 'high' ? 72 : tier === 'medium' ? 48 : 32,
  }
}
