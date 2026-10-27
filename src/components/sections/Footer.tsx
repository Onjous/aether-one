import { BRAND } from '@/content/copy'
import { Wordmark } from '../ui/Wordmark'

export function Footer() {
  return (
    <footer className="gutter relative z-20 border-t border-line bg-obsidian py-10 md:py-14">
      <div className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <Wordmark />
          <p className="tech mt-4 text-dim">{BRAND.product} — a concept, not a product</p>
        </div>
        <p className="text-sm leading-relaxed text-mute md:col-span-5">{BRAND.conceptNotice}</p>
        <div className="tech grid content-start gap-2 text-dim md:col-span-3 md:justify-items-end">
          <span>Real-time 3D · Three.js · React Three Fiber</span>
          <span>Motion · GSAP ScrollTrigger</span>
          <span>Original procedural model — no third-party assets</span>
        </div>
      </div>
    </footer>
  )
}
