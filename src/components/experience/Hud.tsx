'use client'

import { useEffect, useRef } from 'react'
import { onDirectorFrame, pose, runtime } from '@/animation/director'

/** Signed angle in degrees, wrapped to (-180, 180]. */
const deg = (r: number) => {
  let d = ((((r * 180) / Math.PI) % 360) + 360) % 360
  if (d > 180) d -= 360
  return (d < 0 ? '−' : '+') + Math.abs(d).toFixed(1).padStart(5, '0')
}

/**
 * A restrained instrument readout of the live camera and assembly state.
 * Purely decorative (aria-hidden); it reflects the real values being rendered.
 */
export function Hud() {
  const az = useRef<HTMLSpanElement>(null)
  const el = useRef<HTMLSpanElement>(null)
  const ex = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let last = ''
    return onDirectorFrame(() => {
      const yaw = pose.rotY + runtime.userYaw * pose.interact
      const pitch = pose.rotX + runtime.userPitch * pose.interact
      const explode = (pose.explodeCups + pose.explodeCushion + pose.explodeCore) / 3
      const a = deg(-yaw)
      const e = deg(pitch)
      const x = Math.round(explode * 100).toString().padStart(3, '0')
      const key = a + e + x
      if (key === last) return
      last = key
      if (az.current) az.current.textContent = a
      if (el.current) el.current.textContent = e
      if (ex.current) ex.current.textContent = x
    })
  }, [])

  return (
    <div
      aria-hidden="true"
      data-hero="hud"
      className="webgl-only tech pointer-events-none fixed top-[calc(50%+8.5rem)] right-[calc(var(--gutter)*0.6)] z-30 hidden flex-col items-end gap-1.5 text-dim xl:flex"
    >
      <span>
        AZ <span ref={az} className="text-mute tabular-nums">+000.0</span>°
      </span>
      <span>
        EL <span ref={el} className="text-mute tabular-nums">+000.0</span>°
      </span>
      <span>
        SEP <span ref={ex} className="text-mute tabular-nums">000</span>%
      </span>
    </div>
  )
}
