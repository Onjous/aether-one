import { ANNOTATIONS, EXPLODED } from '@/content/copy'
import { Still } from '../ui/Still'
import { ExplodedSteps } from './ExplodedSteps'

export function ExplodedSection() {
  return (
    <section id="engineering" data-chapter="2" aria-labelledby="exploded-title" className="relative h-[420svh]">
      <div data-sticky className="sticky top-0 z-20 h-[100svh] min-h-[600px]">
        <div className="gutter flex h-full flex-col justify-between pt-[calc(var(--nav-h)+1.5rem)] pb-8 wide:pb-10">
          <div className="flex flex-col gap-5 wide:flex-row wide:items-start wide:justify-between">
            <div>
              <p className="eyebrow" data-reveal>
                {EXPLODED.eyebrow}
              </p>
              <h2
                id="exploded-title"
                data-split
                className="display mt-5 text-[clamp(2.2rem,10vw,3.4rem)] wide:text-[clamp(2.75rem,5vw,5.5rem)]"
              >
                <span className="block">{EXPLODED.headline[0]}</span>
                <span className="block">{EXPLODED.headline[1]}</span>
              </h2>
            </div>
            <p className="hidden max-w-[19rem] text-sm leading-relaxed text-mute wide:mt-9 wide:block" data-reveal="0.1">
              {EXPLODED.body}
            </p>
          </div>

          <div className="webgl-still">
            <Still name="exploded" alt="Exploded view of AETHER ONE showing cushions, grilles, drivers and electronics separated along each ear cup's axis" className="mx-auto w-full max-w-4xl" />
          </div>

          {/* Real-text equivalent of the 3D labels, for assistive technology. */}
          <ul className="sr-only">
            {ANNOTATIONS.explode.map((a) => (
              <li key={a.id}>
                {a.title}: {a.detail}
              </li>
            ))}
          </ul>

          <div className="wide:max-w-[52rem]" data-reveal="0.15">
            <ExplodedSteps />
          </div>
        </div>
      </div>
    </section>
  )
}
