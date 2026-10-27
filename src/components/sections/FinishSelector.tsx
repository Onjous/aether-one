'use client'

import { FINISH_ORDER, FINISHES } from '@/config/finishes'
import { appState } from '@/lib/appState'
import { Still } from '../ui/Still'

/**
 * Finish configurator: a native radio group (arrow keys move between finishes)
 * that updates the shared state; the 3D model tweens its real materials in
 * response.
 */
export function FinishSelector() {
  const finish = appState.useStore((s) => s.finish)

  return (
    <div>
      <fieldset>
        <legend className="eyebrow mb-4">Finish</legend>
        <div className="grid grid-cols-3 gap-2 wide:grid-cols-1 wide:gap-2.5">
          {FINISH_ORDER.map((id) => {
            const f = FINISHES[id]
            return (
              <label key={id} className="finish-option block cursor-pointer">
                <input
                  type="radio"
                  name="finish"
                  value={id}
                  checked={finish === id}
                  onChange={() => appState.set({ finish: id })}
                  className="peer sr-only"
                />
                <span className="finish-chip flex items-center gap-3 rounded-lg border border-line px-3 py-3 transition-colors duration-300 hover:border-line-strong wide:gap-4 wide:px-4">
                  <span
                    aria-hidden="true"
                    className="h-7 w-7 shrink-0 rounded-full border border-white/15 wide:h-8 wide:w-8"
                    style={{ background: `linear-gradient(135deg, ${f.swatch[0]} 0%, ${f.swatch[0]} 50%, ${f.swatch[1]} 50%)` }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-soft wide:text-base">{f.name}</span>
                    <span className="mt-0.5 hidden text-[0.8125rem] leading-snug text-mute wide:block">{f.description}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="finish-chip__state hidden h-1.5 w-1.5 shrink-0 rounded-full bg-ember opacity-0 transition-opacity wide:block"
                  />
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
      <p className="sr-only" aria-live="polite">
        {FINISHES[finish].name} finish selected. {FINISHES[finish].description}
      </p>
      <p className="mt-3 text-[0.8125rem] leading-snug text-mute wide:hidden">{FINISHES[finish].description}</p>
    </div>
  )
}

/** Without WebGL: a still of the selected finish, placed where the 3D product would be. */
export function FinishStill() {
  const finish = appState.useStore((s) => s.finish)
  return (
    <div className="webgl-still wide:absolute wide:top-1/2 wide:right-[5%] wide:w-[50vw] wide:max-w-4xl wide:-translate-y-1/2">
      <Still name={finish} alt={`AETHER ONE in the ${FINISHES[finish].name} finish`} className="w-full" />
    </div>
  )
}
