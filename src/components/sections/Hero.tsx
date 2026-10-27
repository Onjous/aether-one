import { BRAND, HERO } from '@/content/copy'
import { Still } from '../ui/Still'

export function Hero() {
  return (
    <section
      id="arrival"
      data-chapter="0"
      aria-labelledby="hero-title"
      className="relative h-[100svh] min-h-[600px] overflow-hidden"
    >
      {/* Giant headline sits *behind* the 3D canvas (z-1 < z-10), so the product passes in front of it. */}
      <h1
        id="hero-title"
        data-hero="headline"
        className="display gutter absolute inset-x-0 top-[calc(var(--nav-h)+2.5rem)] z-[1] text-[clamp(3rem,15vw,9rem)] text-soft wide:top-1/2 wide:-translate-y-[54%] wide:text-[clamp(5rem,15.2vw,17.5rem)]"
      >
        <span className="block">{HERO.headline[0]}</span>
        <span className="block text-right">{HERO.headline[1]}</span>
      </h1>

      <p data-hero="eyebrow" className="eyebrow gutter absolute top-[calc(var(--nav-h)+0.75rem)] left-0 z-20 hidden wide:block">
        {BRAND.product} <span className="text-dim">/</span> {HERO.eyebrow}
      </p>

      <p className="sr-only">
        An interactive, real-time 3D render of the AETHER ONE concept headphones: a sculpted single-arc headband
        with a suspended pad, forked yokes, and oval ear cups with soft protein-leather cushions.
      </p>

      <Still name="hero" alt="AETHER ONE concept headphones in the Obsidian finish" className="absolute inset-x-0 top-1/2 z-[2] mx-auto w-[min(92vw,900px)] -translate-y-1/2" />

      <div className="gutter absolute inset-x-0 bottom-0 z-20 flex items-end justify-between pb-[max(1.5rem,env(safe-area-inset-bottom))] wide:pb-10">
        <div data-hero="body" className="max-w-[22rem]">
          <p className="text-[0.975rem] leading-relaxed text-titanium wide:text-base">{HERO.body}</p>
          <a
            href="#design"
            className="group mt-6 inline-flex h-12 items-center gap-4 rounded-full border border-line-strong pr-2 pl-6 text-sm font-medium transition-colors duration-500 hover:border-soft hover:bg-soft hover:text-obsidian"
          >
            {HERO.cta}
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-full bg-ember text-obsidian transition-transform duration-500 group-hover:translate-y-0.5"
            >
              ↓
            </span>
          </a>
        </div>

        <div data-hero="scroll" aria-hidden="true" className="hidden flex-col items-center gap-3 pb-1 wide:flex">
          <span className="tech text-dim">{HERO.scrollHint}</span>
          <span className="relative block h-12 w-px overflow-hidden bg-line">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.4s_var(--ease-in-out-quart)_infinite] bg-soft motion-reduce:animate-none" />
          </span>
        </div>
        <div className="hidden w-[22rem] lg:block" aria-hidden="true" />
      </div>
    </section>
  )
}
