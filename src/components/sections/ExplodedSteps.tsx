'use client'

import { useEffect, useRef } from 'react'
import { onDirectorFrame, runtime } from '@/animation/director'
import { EXPLODE_STEPS } from '@/animation/storyTimeline'
import { EXPLODED } from '@/content/copy'
import { clamp } from '@/lib/math'

/**
 * Step captions for the exploded view, synchronised with the same story time
 * that drives the 3D separation. All four steps are always in the DOM as an
 * ordered list; the active one is emphasised.
 */
export function ExplodedSteps() {
  const list = useRef<HTMLOListElement>(null)
  const bar = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let active = -2
    let progress = -1
    return onDirectorFrame(() => {
      const t = runtime.time
      const first = EXPLODE_STEPS[0].from
      const last = EXPLODE_STEPS[EXPLODE_STEPS.length - 1].to
      const p = Math.round(clamp((t - first) / (last - first)) * 1000) / 1000
      if (p !== progress && bar.current) {
        progress = p
        bar.current.style.transform = `scaleX(${p})`
      }
      let a = -1
      EXPLODE_STEPS.forEach((s, i) => {
        if (t >= s.from) a = i
      })
      if (t > last + 0.05) a = -1
      if (a === active || !list.current) return
      active = a
      list.current.querySelectorAll('li').forEach((li, i) => {
        li.dataset.active = String(i === a)
      })
    })
  }, [])

  return (
    <div>
      <span aria-hidden="true" className="relative mb-5 block h-px w-full bg-line wide:mb-6">
        <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-ember" />
      </span>
      <ol ref={list} className="grid grid-cols-4 gap-3 wide:gap-6">
        {EXPLODED.steps.map((s, i) => (
          <li key={s.key} data-active="false" className="group transition-opacity duration-500 data-[active=false]:opacity-45">
            <span className="tech block text-dim group-data-[active=true]:text-ember">0{i + 1}</span>
            <span className="tech mt-2 block text-soft">{s.label}</span>
            <span className="mt-2 hidden text-sm leading-snug text-mute wide:block">{s.text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
