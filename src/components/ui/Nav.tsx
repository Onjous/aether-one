'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { NAV_LINKS } from '@/content/copy'
import { Wordmark } from './Wordmark'

export function Nav() {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onResize = () => window.innerWidth >= 768 && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  return (
    <header data-hero="nav" className="fixed inset-x-0 top-0 z-40">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-obsidian via-obsidian/75 to-transparent"
        aria-hidden="true"
      />
      <div className="gutter relative flex h-[var(--nav-h)] items-center justify-between">
        <a href="#arrival" className="text-soft" aria-label="AETHER — back to the beginning">
          <Wordmark />
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-7 lg:gap-9">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="tech text-mute transition-colors duration-300 hover:text-soft"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <span className="tech rounded-full border border-line-strong px-2.5 py-1 text-mute">Concept</span>
          <button
            ref={buttonRef}
            type="button"
            className="tech -mr-2 flex h-11 items-center gap-2 px-2 text-soft md:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
          >
            <span>{open ? 'Close' : 'Menu'}</span>
            <span className="relative block h-2.5 w-4" aria-hidden="true">
              <span
                className={`absolute left-0 h-px w-4 bg-current transition-transform duration-300 ${open ? 'top-1/2 rotate-45' : 'top-0'}`}
              />
              <span
                className={`absolute left-0 h-px w-4 bg-current transition-transform duration-300 ${open ? 'top-1/2 -rotate-45' : 'bottom-0'}`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id={panelId}
        hidden={!open}
        className="gutter relative border-b border-line bg-obsidian/95 pb-6 md:hidden"
      >
        <nav aria-label="Mobile">
          <ul className="flex flex-col">
            {NAV_LINKS.map((l, i) => (
              <li key={l.href} className="border-t border-line">
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline justify-between py-4 text-lg"
                >
                  <span className="display-condensed uppercase">{l.label}</span>
                  <span className="tech text-dim">0{i + 2}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
