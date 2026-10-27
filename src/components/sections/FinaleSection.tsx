import { FINALE } from '@/content/copy'
import { Still } from '../ui/Still'
import { ConceptDialog } from './ConceptDialog'

export function FinaleSection() {
  return (
    <section id="finale" data-chapter="6" aria-labelledby="finale-title" className="relative h-[100svh] min-h-[640px]">
      {/* No z-index on this wrapper, so its children layer against the canvas individually. */}
      <div data-reveal-scope className="gutter relative flex h-full flex-col items-center pt-[calc(var(--nav-h)+2rem)] pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center wide:pb-14">
        {/*
          Like the opening frame, the headline sits behind the canvas (z-1 < z-10):
          as the product settles it passes in front of the type, then comes to
          rest clear of it.
        */}
        <div className="relative z-[1]">
          <p className="eyebrow" data-reveal>
            {FINALE.eyebrow}
          </p>
          <h2
            id="finale-title"
            data-split
            className="display mt-5 text-[clamp(2.3rem,10.5vw,3.6rem)] wide:text-[clamp(3rem,6.4vw,7.5rem)]"
          >
            <span className="block">{FINALE.headline[0]}</span>
            <span className="block">{FINALE.headline[1]}</span>
          </h2>
        </div>

        {/*
          The space the layout reserves for the product. The scroll director
          measures it and the 3D camera frames the headphones into it, so the
          product always rests between the headline and the call to action.
        */}
        <div data-product-slot className="relative my-6 min-h-[200px] w-full flex-1 wide:my-8">
          <Still
            name="hero"
            alt="AETHER ONE, fully assembled"
            className="absolute inset-0 m-auto h-full w-full object-contain"
          />
        </div>

        <div data-reveal className="relative z-20">
          <ConceptDialog />
        </div>
      </div>
    </section>
  )
}
