'use client'

import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { runtime } from '@/animation/director'
import { CUSTOMIZE } from '@/content/copy'
import { appState } from '@/lib/appState'
import { clamp } from '@/lib/math'

const STEP = Math.PI / 12 // 15° per arrow key press

/** Publishes the current rotation so the slider's ARIA value stays accurate. */
function commit() {
  appState.set({ yawDeg: Math.round((runtime.userYawTarget * 180) / Math.PI) })
}

function resetRotation() {
  runtime.userYawTarget = 0
  runtime.userPitchTarget = 0
  commit()
}

/**
 * Dedicated rotation area for the configurator. It is the only place where the
 * product can be turned freely, and `touch-action: pan-y` hands vertical
 * gestures straight to the browser, so it never blocks scrolling on touch.
 * Keyboard users get the same control as a slider (arrow keys, Home to reset).
 */
export function RotateSurface() {
  const drag = useRef<{ id: number; x: number; y: number; mouse: boolean } | null>(null)
  const yawDeg = appState.useStore((s) => s.yawDeg)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, mouse: e.pointerType !== 'touch' }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    d.x = e.clientX
    d.y = e.clientY
    runtime.userYawTarget += dx * 0.009
    if (d.mouse) runtime.userPitchTarget = clamp(runtime.userPitchTarget + dy * 0.004, -0.4, 0.4)
  }
  const end = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== e.pointerId) return
    drag.current = null
    commit()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') runtime.userYawTarget -= STEP
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') runtime.userYawTarget += STEP
    else if (e.key === 'Home') {
      resetRotation()
      e.preventDefault()
      return
    } else return
    e.preventDefault()
    commit()
  }

  const normalized = ((((yawDeg + 180) % 360) + 360) % 360) - 180

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Rotate the product"
      aria-valuemin={-180}
      aria-valuemax={180}
      aria-valuenow={normalized}
      aria-valuetext={`Rotated ${normalized} degrees`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
      className="webgl-only absolute inset-x-0 top-[26%] bottom-[36%] cursor-grab touch-pan-y select-none focus-visible:outline-offset-[-6px] active:cursor-grabbing wide:top-[14%] wide:right-[6%] wide:bottom-[14%] wide:left-[42%]"
    />
  )
}

export function RotateControls() {
  return (
    <div className="webgl-only flex items-center justify-between gap-5 wide:justify-start">
      <span className="tech flex items-center gap-2 text-mute">
        <span aria-hidden="true" className="inline-block h-px w-5 bg-current" />
        <span className="pointer-coarse:hidden">{CUSTOMIZE.hintPointer}</span>
        <span className="hidden pointer-coarse:inline">{CUSTOMIZE.hintTouch}</span>
      </span>
      <button
        type="button"
        onClick={resetRotation}
        className="tech -my-3 py-3 text-soft underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-soft"
      >
        {CUSTOMIZE.reset}
      </button>
    </div>
  )
}
