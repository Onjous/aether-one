'use client'

import { useEffect, useRef } from 'react'
import { onDirectorFrame, runtime } from '@/animation/director'
import { CHAPTERS } from '@/content/copy'

/** Vertical chapter index on large screens; highlights the current chapter. */
export function ChapterRail() {
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    let current = -1
    return onDirectorFrame(() => {
      if (runtime.chapter === current || !list.current) return
      current = runtime.chapter
      list.current.querySelectorAll('a').forEach((a, i) => {
        if (i === current) a.setAttribute('aria-current', 'step')
        else a.removeAttribute('aria-current')
      })
    })
  }, [])

  return (
    <nav
      aria-label="Chapters"
      data-hero="rail"
      className="fixed top-1/2 right-[calc(var(--gutter)*0.6)] z-30 hidden -translate-y-1/2 xl:block"
    >
      <ol ref={list} className="flex flex-col gap-3.5">
        {CHAPTERS.map((c) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              className="group tech flex items-center justify-end gap-3 text-dim transition-colors duration-500 hover:text-soft aria-[current=step]:text-soft"
            >
              <span className="translate-x-1 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 group-aria-[current=step]:translate-x-0 group-aria-[current=step]:opacity-100">
                {c.title}
              </span>
              <span className="tabular-nums">{c.index}</span>
              <span
                aria-hidden="true"
                className="block h-px w-3 bg-current transition-all duration-500 group-aria-[current=step]:w-7 group-aria-[current=step]:bg-ember"
              />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
