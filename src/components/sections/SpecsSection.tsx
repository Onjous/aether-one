import { SPECS } from '@/content/copy'

export function SpecsSection() {
  return (
    <section id="details" data-chapter="5" aria-labelledby="specs-title" className="relative">
      <div className="gutter relative z-20 grid pt-[38svh] pb-[30svh] wide:grid-cols-12 wide:pt-[22svh] wide:pb-[34svh]">
        <header className="wide:col-span-6 wide:col-start-7">
          <p className="eyebrow" data-reveal>
            {SPECS.eyebrow}
          </p>
          <h2 id="specs-title" data-split className="display mt-5 text-[clamp(2.2rem,10vw,3.4rem)] wide:text-[clamp(2.75rem,4.6vw,5rem)]">
            <span className="block">{SPECS.headline[0]}</span>
            <span className="block">{SPECS.headline[1]}</span>
          </h2>
          <p className="mt-6 max-w-[28rem] text-sm leading-relaxed text-mute" data-reveal="0.1">
            {SPECS.intro}
          </p>
        </header>

        <ol className="mt-16 wide:col-span-6 wide:col-start-7 wide:mt-24">
          {SPECS.features.map((f) => (
            <li
              key={f.index}
              className="grid grid-cols-[3rem_1fr] gap-x-4 border-t border-line bg-obsidian/80 py-8 wide:min-h-[38svh] wide:grid-cols-[4rem_1fr] wide:bg-transparent wide:py-10"
              data-reveal
            >
              <span className="tech pt-1.5 text-ember">{f.index}</span>
              <div>
                <h3 className="display-condensed text-[1.6rem] uppercase wide:text-[clamp(1.75rem,2.4vw,2.5rem)]">{f.title}</h3>
                <p className="mt-4 max-w-[30rem] text-[0.95rem] leading-relaxed text-titanium">{f.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
