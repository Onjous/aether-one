import { SOUND } from '@/content/copy'

export function SoundSection() {
  return (
    <section id="sound" data-chapter="3" aria-labelledby="sound-title" className="relative h-[150svh]">
      <div data-sticky className="sticky top-0 z-20 h-[100svh] min-h-[600px]">
        <div className="gutter flex h-full flex-col justify-between pt-[calc(var(--nav-h)+1.5rem)] pb-8 wide:pb-10">
          <div>
            <p className="eyebrow" data-reveal>
              {SOUND.eyebrow}
            </p>
            <h2
              id="sound-title"
              data-split
              className="display mt-5 text-[clamp(2.4rem,11vw,3.6rem)] wide:text-[clamp(2.75rem,5.2vw,5.75rem)]"
            >
              <span className="block">{SOUND.headline[0]}</span>
              <span className="block">{SOUND.headline[1]}</span>
            </h2>
          </div>

          <div className="flex flex-col gap-6 wide:flex-row wide:items-end wide:justify-between">
            <p className="max-w-[26rem] text-[0.95rem] leading-relaxed text-titanium wide:text-base" data-reveal>
              {SOUND.body}
            </p>
            <ol aria-label="Frequency range" className="flex gap-6 wide:gap-10" data-reveal="0.1">
              {SOUND.bands.map((b, i) => (
                <li key={b} className="flex flex-col items-start gap-2">
                  <span aria-hidden="true" className="flex h-6 items-end gap-[3px]">
                    {[0.35, 0.7, 1, 0.55].map((h, k) => (
                      <span
                        key={k}
                        className="block w-px bg-titanium/70"
                        style={{ height: `${Math.round((h * (0.55 + i * 0.15)) * 24)}px` }}
                      />
                    ))}
                  </span>
                  <span className="tech text-mute">{b}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
