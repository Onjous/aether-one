'use client'

import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { appState, LOAD_STAGES } from '@/lib/appState'
import { CupMark } from './Wordmark'

/**
 * Loading screen. Progress reflects real, completed milestones reported by the
 * 3D stage — never a timer. If loading stalls, visitors can continue while the
 * scene finishes in the background.
 */
export function Loader() {
  const loaded = appState.useStore((s) => s.loaded)
  const webgl = appState.useStore((s) => s.webgl)
  const reduced = appState.useStore((s) => s.reducedMotion)
  const ref = useRef<HTMLDivElement>(null)
  const [gone, setGone] = useState(false)
  const [slow, setSlow] = useState(false)

  const skip = webgl === 'unsupported' || webgl === 'lost'
  const total = LOAD_STAGES.length
  const done = skip ? total : loaded.length
  const complete = done >= total

  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 9000)
    return () => window.clearTimeout(t)
  }, [])

  const dismiss = (delay: number) => {
    const el = ref.current
    if (!el || appState.get().revealed) return
    appState.set({ revealed: true })
    gsap.to(el, {
      autoAlpha: 0,
      duration: reduced ? 0.2 : 0.9,
      delay,
      ease: 'power2.inOut',
      onComplete: () => setGone(true),
    })
  }

  useEffect(() => {
    if (complete) dismiss(reduced ? 0 : 0.25)
    // `dismiss` only reads refs and the store; re-running on its identity is unnecessary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete])

  if (gone) return null

  return (
    <div
      ref={ref}
      className="js-only fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-8">
        <CupMark className="h-10 w-10 text-soft" />
        <p className="tech text-mute">
          Preparing AETHER ONE
          <span className="sr-only">
            {`: ${done} of ${total} steps complete`}
          </span>
        </p>
        <ol className="tech grid w-64 gap-1.5 text-dim" aria-hidden="true">
          {LOAD_STAGES.map((s, i) => {
            const ok = skip || loaded.includes(s.id)
            return (
              <li key={s.id} className="flex justify-between">
                <span className={ok ? 'text-titanium' : ''}>
                  0{i + 1} {s.label}
                </span>
                <span className={ok ? 'text-ember' : ''}>{ok ? 'Ready' : '—'}</span>
              </li>
            )
          })}
        </ol>
        <div className="h-px w-64 bg-line" aria-hidden="true">
          <div
            className="h-px bg-soft transition-[width] duration-500 ease-out"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        {slow && !complete && (
          <button
            type="button"
            onClick={() => dismiss(0)}
            className="tech border-b border-line-strong pb-1 text-mute transition-colors hover:text-soft"
          >
            Taking a while — continue while it loads
          </button>
        )}
      </div>
    </div>
  )
}
