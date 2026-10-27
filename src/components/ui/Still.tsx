/* eslint-disable @next/next/no-img-element -- static fallback stills; only shown when WebGL is unavailable */

export type StillName = 'hero' | 'form' | 'exploded' | 'obsidian' | 'titanium' | 'ember'

/**
 * Pre-rendered still of the real 3D model, displayed only when WebGL is
 * unavailable (or JavaScript is disabled). Lazy so it costs nothing otherwise.
 */
export function Still({ name, alt, className = '' }: { name: StillName; alt: string; className?: string }) {
  return (
    <img
      src={`/stills/${name}.webp`}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={1600}
      height={1000}
      className={`webgl-still pointer-events-none h-auto select-none ${className}`}
    />
  )
}
