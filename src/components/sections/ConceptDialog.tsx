'use client'

import { useRef } from 'react'
import { CONCEPT_DIALOG, FINALE } from '@/content/copy'

/**
 * The finale CTA. There is no product to buy, so it opens an honest note about
 * the concept instead of a fake checkout.
 */
export function ConceptDialog() {
  const dialog = useRef<HTMLDialogElement>(null)

  const replay = () => {
    dialog.current?.close()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        className="group inline-flex h-14 items-center gap-5 rounded-full bg-soft pr-2.5 pl-7 text-[0.95rem] font-medium text-obsidian transition-colors duration-500 hover:bg-white"
      >
        {FINALE.cta}
        <span
          aria-hidden="true"
          className="grid h-9 w-9 place-items-center rounded-full bg-obsidian text-soft transition-transform duration-500 group-hover:rotate-45"
        >
          ↗
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="concept-dialog-title"
        className="m-auto w-[min(92vw,34rem)] rounded-xl border border-line-strong bg-carbon p-0 text-soft"
        onClick={(e) => {
          // Close when the backdrop (the dialog element itself) is clicked.
          if (e.target === e.currentTarget) dialog.current?.close()
        }}
      >
        <div className="p-7 md:p-9">
          <p className="eyebrow">Independent creative concept</p>
          <h2 id="concept-dialog-title" className="display-condensed mt-4 text-3xl uppercase">
            {CONCEPT_DIALOG.title}
          </h2>
          <div className="mt-5 grid gap-4 text-[0.95rem] leading-relaxed text-titanium">
            {CONCEPT_DIALOG.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={replay}
              className="inline-flex h-11 items-center rounded-full bg-soft px-5 text-sm font-medium text-obsidian transition-colors hover:bg-white"
            >
              {CONCEPT_DIALOG.replay}
            </button>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="inline-flex h-11 items-center rounded-full border border-line-strong px-5 text-sm transition-colors hover:border-soft"
            >
              {CONCEPT_DIALOG.close}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
