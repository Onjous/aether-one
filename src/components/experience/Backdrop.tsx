'use client'

import { useEffect, useRef } from 'react'
import { onDirectorFrame, pose } from '@/animation/director'
import { FINISHES } from '@/config/finishes'
import { appState } from '@/lib/appState'

/**
 * Atmosphere behind the canvas: fixed gradient layers whose *opacity* follows
 * the director. Only opacity changes per frame, so this stays on the compositor.
 */
export function Backdrop() {
  const glow = useRef<HTMLDivElement>(null)
  const warm = useRef<HTMLDivElement>(null)
  const tint = useRef<HTMLDivElement>(null)
  const finish = appState.useStore((s) => s.finish)

  useEffect(() => {
    let g = -1
    let w = -1
    return onDirectorFrame(() => {
      const ng = Math.round(pose.glow * 100) / 100
      const nw = Math.round(pose.warm * 100) / 100
      if (ng !== g && glow.current) glow.current.style.opacity = String((g = ng))
      if (nw !== w && warm.current) warm.current.style.opacity = String((w = nw) * 0.7)
    })
  }, [])

  return (
    <div aria-hidden="true" data-backdrop className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        ref={glow}
        className="absolute inset-0"
        style={{
          opacity: 0.6,
          background:
            'radial-gradient(60% 55% at 50% 46%, rgb(48 54 64 / 0.55) 0%, rgb(23 26 32 / 0.35) 38%, transparent 72%)',
        }}
      />
      <div
        ref={tint}
        className="absolute inset-0 transition-[background] duration-1000"
        style={{
          background: `radial-gradient(42% 38% at 50% 50%, ${FINISHES[finish].ambient}14 0%, transparent 70%)`,
        }}
      />
      <div
        ref={warm}
        className="absolute inset-0"
        style={{
          opacity: 0,
          background:
            'radial-gradient(70% 45% at 50% 100%, rgb(255 106 50 / 0.22) 0%, rgb(255 106 50 / 0.06) 40%, transparent 75%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 45%, transparent 55%, rgb(0 0 0 / 0.65) 100%)' }}
      />
    </div>
  )
}
