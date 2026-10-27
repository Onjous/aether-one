'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { runtime } from '@/animation/director'
import { appState } from '@/lib/appState'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

/**
 * Elements inside a sticky viewport never move relative to the screen while
 * it is pinned, and elements near the bottom of a full-height final chapter
 * would only cross a viewport line after the chapter has settled. Both are
 * triggered by their section entering instead.
 */
function triggerFor(el: HTMLElement, start: string): ScrollTrigger.Vars {
  const scope = el.closest<HTMLElement>('[data-sticky], [data-reveal-scope]')
  const section = scope?.closest('section')
  if (section) return { trigger: section, start: 'top 68%', toggleActions: 'play none none reverse' }
  return { trigger: el, start, toggleActions: 'play none none reverse' }
}

/**
 * Typographic motion: the hero entrance after loading, and scroll-linked
 * reveals for every other chapter. Reveals reverse when scrolling back up.
 * With reduced motion nothing is hidden or moved.
 */
export function MotionController() {
  const revealed = appState.useStore((s) => s.revealed)
  const reduced = appState.useStore((s) => s.reducedMotion)

  // Scroll reveals for chapters 02–07.
  useGSAP(
    () => {
      if (reduced) return

      gsap.utils.toArray<HTMLElement>('[data-split]:not([data-hero])').forEach((el) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'split-line',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 108,
              duration: 1.15,
              ease: 'expo.out',
              stagger: 0.09,
              scrollTrigger: triggerFor(el, 'top 84%'),
            }),
        })
      })

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 22,
          autoAlpha: 0,
          duration: 1,
          ease: 'power3.out',
          delay: Number(el.dataset.reveal || 0),
          scrollTrigger: triggerFor(el, 'top 90%'),
        })
      })
    },
    // Revert (un-hide) everything if the motion preference changes, including
    // the first switch from the server default once the real value is known.
    { dependencies: [reduced], revertOnUpdate: true },
  )

  // Hero entrance, once the loader has handed over.
  useGSAP(
    () => {
      if (!revealed) return
      if (reduced) {
        runtime.intro = 1
        return
      }
      const tl = gsap.timeline()
      tl.to(runtime, { intro: 1, duration: 3.4, ease: 'power3.out' }, 0)

      const headline = document.querySelector<HTMLElement>('[data-hero="headline"]')
      if (headline) {
        const split = SplitText.create(headline, { type: 'chars,lines', mask: 'lines', linesClass: 'split-line' })
        tl.from(split.chars, { yPercent: 115, duration: 1.5, ease: 'expo.out', stagger: 0.035 }, 0.45)
      }
      tl.from('[data-hero="eyebrow"]', { autoAlpha: 0, y: 10, duration: 1, ease: 'power3.out' }, 0.9)
      tl.from('[data-hero="body"] > *', { autoAlpha: 0, y: 18, duration: 1.1, ease: 'power3.out', stagger: 0.1 }, 1.1)
      tl.from('[data-hero="nav"], [data-hero="rail"], [data-hero="hud"], [data-hero="scroll"]', { autoAlpha: 0, duration: 1.4, ease: 'power2.out' }, 1.3)
    },
    { dependencies: [revealed, reduced] },
  )

  return null
}
