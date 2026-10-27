'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect } from 'react'
import { appState } from '@/lib/appState'
import { clamp, damp } from '@/lib/math'
import { emitDirectorFrame, pose, runRenderHook, runtime } from './director'
import { buildStoryTimeline, CHAPTER_HOLD_TIMES, STORY_END } from './storyTimeline'

gsap.registerPlugin(ScrollTrigger)

/**
 * Screens that get the side-by-side compositions. Mirrors the `wide` variant
 * in globals.css so the 3D shots and the CSS layout always switch together.
 */
export const WIDE_QUERY = '(min-width: 768px) and (min-aspect-ratio: 4/5)'

/**
 * Drives the whole experience from one place:
 *
 * 1. Measures each chapter (`[data-chapter]` section) with a ScrollTrigger.
 * 2. Converts the scroll position into story time — the sum of each chapter's
 *    clamped progress — which is deterministic for any scroll position.
 * 3. Smooths story time and scrubs the GSAP master timeline to it.
 * 4. Notifies DOM subscribers, then renders the WebGL frame — all from the
 *    single GSAP ticker.
 */
export function useScrollDirector() {
  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true })

    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'))
    const triggers = sections.map((el) =>
      ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom top' }),
    )

    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyReduced = () => {
      runtime.reducedMotion = reduceQuery.matches
      appState.set({ reducedMotion: reduceQuery.matches })
    }
    applyReduced()
    reduceQuery.addEventListener('change', applyReduced)

    // Rebuild the master timeline when the layout crosses the breakpoint.
    let timeline: gsap.core.Timeline | null = null
    const mm = gsap.matchMedia()
    mm.add({ wide: WIDE_QUERY, narrow: `not all and ${WIDE_QUERY}` }, (ctx) => {
      runtime.layout = ctx.conditions?.wide ? 'desktop' : 'mobile'
      timeline = buildStoryTimeline(runtime.layout)
      timeline.time(clamp(runtime.time, 0, STORY_END))
      return () => {
        timeline?.kill()
        timeline = null
      }
    })

    // The finale's product slot, measured relative to its section so it equals
    // the slot's on-screen position at the end of the story. Re-measured on
    // every ScrollTrigger refresh (resize, fonts, layout switches).
    const finale = sections[sections.length - 1]
    const measureSlot = () => {
      const slot = finale?.querySelector<HTMLElement>('[data-product-slot]')
      if (!finale || !slot) {
        runtime.finaleSlot = null
        return
      }
      const s = slot.getBoundingClientRect()
      const f = finale.getBoundingClientRect()
      runtime.finaleSlot = { cx: s.left + s.width / 2 - f.left, cy: s.top + s.height / 2 - f.top, w: s.width, h: s.height }
    }
    measureSlot()
    ScrollTrigger.addEventListener('refresh', measureSlot)

    const computeTarget = (scrollY: number) => {
      let t = 0
      for (const st of triggers) {
        const len = Math.max(1, st.end - st.start)
        t += clamp((scrollY - st.start) / len)
      }
      return Math.min(t, STORY_END)
    }

    /** Index of the chapter whose section contains the middle of the viewport. */
    const computeChapter = (scrollY: number) => {
      const mid = scrollY + window.innerHeight * 0.5
      for (let i = triggers.length - 1; i >= 0; i--) {
        if (mid >= triggers[i].start) return i
      }
      return 0
    }

    // Jump straight to the right place on first load (e.g. a deep link or a
    // restored scroll position) instead of flying in from the top.
    runtime.targetTime = runtime.time = computeTarget(window.scrollY)

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerTarget.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const pointerTarget = { x: 0, y: 0 }
    window.addEventListener('pointermove', onPointer, { passive: true })

    const tick = (time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.1)
      const scrollY = window.scrollY
      runtime.targetTime = computeTarget(scrollY)
      runtime.chapter = computeChapter(scrollY)
      // Scroll past the end of the story is not smoothed: the product has to
      // move in lockstep with the finale section as the footer comes in.
      const last = triggers[triggers.length - 1]
      runtime.tail = last ? Math.max(0, scrollY - last.start) : 0

      if (runtime.reducedMotion) {
        // No travelling camera: snap to each chapter's representative frame.
        runtime.time = CHAPTER_HOLD_TIMES[runtime.chapter] ?? runtime.targetTime
      } else {
        // Faster catch-up for large jumps (e.g. navigation links).
        const gap = Math.abs(runtime.targetTime - runtime.time)
        runtime.time = damp(runtime.time, runtime.targetTime, gap > 1 ? 3.2 : 5.5, dt)
        if (Math.abs(runtime.targetTime - runtime.time) < 1e-4) runtime.time = runtime.targetTime
        runtime.elapsed += dt
      }
      timeline?.time(clamp(runtime.time, 0, STORY_END))
      if (runtime.poseOverride) Object.assign(pose, runtime.poseOverride)

      runtime.pointerX = damp(runtime.pointerX, runtime.reducedMotion ? 0 : pointerTarget.x, 3, dt)
      runtime.pointerY = damp(runtime.pointerY, runtime.reducedMotion ? 0 : pointerTarget.y, 3, dt)
      // Outside the configurator the product always returns to the choreography.
      if (pose.interact < 0.01) runtime.userYawTarget = runtime.userPitchTarget = 0
      runtime.userYaw = damp(runtime.userYaw, runtime.userYawTarget, 7, dt)
      runtime.userPitch = damp(runtime.userPitch, runtime.userPitchTarget, 7, dt)

      emitDirectorFrame(dt)
      runRenderHook(time * 1000)
    }
    gsap.ticker.add(tick)

    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)

    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('load', refresh)
      reduceQuery.removeEventListener('change', applyReduced)
      ScrollTrigger.removeEventListener('refresh', measureSlot)
      triggers.forEach((t) => t.kill())
      mm.revert()
    }
  }, [])
}
