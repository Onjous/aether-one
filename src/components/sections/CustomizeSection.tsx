import { CUSTOMIZE } from '@/content/copy'
import { FinishSelector, FinishStill } from './FinishSelector'
import { RotateControls, RotateSurface } from './RotateSurface'

export function CustomizeSection() {
  return (
    <section id="finishes" data-chapter="4" aria-labelledby="customize-title" className="relative h-[165svh]">
      <div data-sticky className="sticky top-0 z-20 h-[100svh] min-h-[620px]">
        <div className="gutter relative flex h-full flex-col justify-between pt-[calc(var(--nav-h)+1.5rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))] wide:justify-center wide:pb-0">
          <div className="pointer-events-none">
            <p className="eyebrow" data-reveal>
              {CUSTOMIZE.eyebrow}
            </p>
            <h2
              id="customize-title"
              data-split
              className="display mt-5 text-[clamp(2.4rem,11vw,3.6rem)] wide:text-[clamp(3rem,5.2vw,5.75rem)]"
            >
              <span className="block">{CUSTOMIZE.headline[0]}</span>
              <span className="block">{CUSTOMIZE.headline[1]}</span>
            </h2>
            <p className="mt-5 hidden max-w-[22rem] leading-relaxed text-titanium wide:block" data-reveal="0.1">
              {CUSTOMIZE.body}
            </p>
          </div>

          <RotateSurface />
          <FinishStill />

          <div className="relative z-10 flex flex-col gap-5 wide:mt-10 wide:max-w-[24rem]" data-reveal="0.15">
            <FinishSelector />
            <RotateControls />
          </div>
        </div>
      </div>
    </section>
  )
}
