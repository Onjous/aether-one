import { FORM } from '@/content/copy'
import { Still } from '../ui/Still'

export function FormSection() {
  return (
    <section id="design" data-chapter="1" aria-labelledby="form-title" className="relative h-[170svh]">
      <div data-sticky className="sticky top-0 z-20 h-[100svh] min-h-[600px]">
        <div className="gutter flex h-full flex-col justify-between pt-[calc(var(--nav-h)+1.5rem)] pb-8 wide:justify-center wide:pt-0 wide:pb-0">
          <div>
            <p className="eyebrow" data-reveal>
              {FORM.eyebrow}
            </p>
            <h2
              id="form-title"
              data-split
              className="display mt-5 text-[clamp(2.4rem,10.5vw,3.5rem)] wide:text-[clamp(2.75rem,5vw,5.5rem)]"
            >
              <span className="block">{FORM.headline[0]}</span>
              <span className="block">{FORM.headline[1]}</span>
            </h2>
            <p className="mt-5 max-w-[24rem] text-base leading-relaxed text-titanium wide:mt-7 wide:text-lg" data-reveal="0.1">
              {FORM.body}
            </p>
          </div>

          <div className="wide:hidden">
            <Still name="form" alt="AETHER ONE seen in profile, showing the headband arc and yoke" className="mx-auto my-6 w-full max-w-xl" />
          </div>

          <ul className="grid gap-4 wide:mt-12 wide:max-w-[30rem] wide:gap-6">
            {FORM.points.map((p, i) => (
              <li key={p.title} className="grid grid-cols-[2rem_1fr] gap-x-3 border-t border-line pt-3 wide:pt-4" data-reveal={0.08 * i}>
                <span className="tech pt-0.5 text-ember">0{i + 1}</span>
                <span>
                  <span className="tech block text-soft">{p.title}</span>
                  <span className="mt-1.5 block text-[0.8125rem] leading-snug text-mute wide:text-sm wide:leading-relaxed">
                    {p.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="absolute top-1/2 right-[4vw] hidden w-[46vw] max-w-3xl -translate-y-1/2 wide:block">
          <Still name="form" alt="" className="w-full" />
        </div>
      </div>
    </section>
  )
}
