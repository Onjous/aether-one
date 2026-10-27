# QA report

**Date:** 2026-10-26
**Environment:** macOS, Apple M1 Pro, Node 24.21. The production build (`next build` + `next start`)
was tested in Playwright Chromium (headless shell 153) with GPU rendering through ANGLE/Metal.
All results below come from runs of the scripts in `qa/`. Nothing was estimated.

## Static checks

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass, 0 errors |
| `npm run lint` | Pass, 0 errors / 0 warnings |
| `npm run build` (clean `.next`) | Pass, 0 warnings; all routes prerendered static |

## Functional checks (`qa/interact.mjs`): 34/34 passed

- **Exploded view:** separates fully at the hold, reassembles before the next chapter, and scrolling
  up reproduces scrolling down exactly (max pose deviation 0). Jumping from the finale or from the
  top straight into the sequence lands on the same pose as a gradual scroll.
- **Finishes:** Obsidian, Titanium and Ember selectable by click; the radio group responds to arrow
  keys; state and `:checked` agree.
- **Rotation:** mouse drag rotates (and reaches the rendered model); "Reset view" zeroes it; arrow
  keys rotate in 15° steps and update `aria-valuenow`; leaving the configurator releases rotation.
- **Touch (390×844, `hasTouch`):** a horizontal swipe rotates; the surface's `touch-action` is
  `pan-y`, so vertical scrolling stays with the browser; no horizontal overflow; portrait
  choreography active.
- **Dialog / nav:** the CTA opens the concept dialog; Escape closes it; nav links land on their
  chapter.
- **Memory:** JS heap after GC is stable across three full scroll cycles (≈11.6 MB → 11.5 MB).
- **Reduced motion:** no intro; the scene cuts to each chapter's still (no travelling camera);
  ambient loops are frozen; no text is hidden by reveal animations.
- **WebGL disabled** (`--disable-webgl --disable-3d-apis`): no canvas, `no-webgl` mode, and
  pre-rendered stills of the model are shown and loaded. No page errors.
- **Finale:** the product stays above the footer at the page end (normal and reduced motion);
  the concept disclaimer appears once (footer only).
- **Console:** no errors on desktop, touch or reduced-motion runs. One warning appears:
  `THREE.Clock: This module has been deprecated`. It comes from inside React Three Fiber 9.8,
  not from project code.

## Finale (`qa/finale.mjs`): 18/18 at each of 7 viewports

For 1440×900, 1920×1080, 1024×768, 768×1024, 430×932, 390×844 and 360×640, the script
measures the product's exact on-screen bounds (projected vertices) from the finale entrance to the
page end, with idle motion frozen. It checks that:

- at rest, the product clears the headline and sits above the CTA (7–100 px gap depending on
  viewport);
- it moves downward into place during the entrance;
- after story end it moves with the page (product vs CTA within 1–3 px over 170–365 px);
- it never enters the footer, at rest, halfway in, or at page end;
- scrolling back up reproduces identical story time and framing (≤ 1 px);
- there are no console errors.

## Visual review

Screenshots were reviewed at every chapter for 1440×900, 1920×1080, 1024×768, 768×1024,
390×844 and 360×640. A frame-by-frame review covered the exploded sequence (2.0 → 2.76), the hero
entrance (0.4 / 1.2 / 2.5 s), close-ups of both cap markings in two finishes, and the no-WebGL
fallback on desktop and mobile. `document.scrollWidth === innerWidth` at every tested width.

Issues found and fixed during review:

- Headlines clipped by containers.
- Leather sheen too bright.
- HUD overlapping the product.
- Exploded composition crowding the headline.
- Sound rings edge-on and invisible.
- Finale product colliding with the CTA.
- Mobile hero word-break.
- Label collisions and off-screen labels (labels now flip sides automatically).
- Portrait-tablet layout: CSS and 3D now switch on one shared aspect-aware query.
- Fallback stills: now transparent WebP.
- Cap marking invisible under clearcoat: now an emissive print.

The 430px width was not captured separately. It sits between the 390px and 768px layouts, both
verified, and uses the same portrait layout as 390px.

## Bugs found by automated QA and fixed

1. **Reveal triggers inside sticky viewports never fired**, so the bottom-pinned "frequency bands"
   list stayed hidden. Elements inside `[data-sticky]` are now triggered by their section.
2. **Reduced motion left text hidden**: the reveal effect ran before the preference was known and
   wasn't reverted. Fixed with `revertOnUpdate`.
3. **Adaptive resolution collapsed to DPR 1** on fast machines. drei's `PerformanceMonitor`
   counts no-op inclines as "flips", and its default upper bound equals the refresh rate. Monitoring
   now starts after loading, with reachable bounds and no fallback.
4. **Finale overlap (reported after delivery).** Story time stopped at the finale while the page
   kept scrolling, so the CTA, disclaimer and footer slid over a frozen product, and the finale
   shot was not tied to the layout. Fixed with slot fitting, a settling entrance and tail
   tracking (see 3D-IMPLEMENTATION.md). In the process: the finale CTA's reveal trigger sat
   exactly on its threshold at story end (now triggered by the section), and the duplicated
   disclaimer was removed from the finale.
5. **`next build` failed while `next dev` was running.** tsconfig's `noUnusedLocals` also checked
   Next's generated `.next/dev/types`. Unused-code checks moved to ESLint (as errors) instead.
6. **Stills initially written to a mis-encoded path** (`aether%20headphones`). The files were moved
   into the project, the stray folder removed, and the script fixed (`fileURLToPath`).

## Performance

Continuous 14-second scroll through the whole page (`qa/perf.mjs`), production build:

| Viewport | Render DPR | Avg FPS | p95 frame | Worst frame | Frames > 33 ms | Long tasks | Draw calls | Triangles |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 2 (adaptive) | 60 | 16.8 ms | 16.8 ms | 0 | 0 | 100 | 296,840 |
| 1920×1080 | 1 | 60 | 16.7 ms | 16.8 ms | 0 | 0 | 100 | 296,840 |
| 390×844 | 2 (pinned) | 60 | 16.8 ms | 16.8 ms | 0 | 0 | 81 | 92,236 |

Draw calls include the shadow pass on the high tier. The procedural build takes about 38 ms
(geometry) + about 12.5 ms (textures) on this machine.

**Lighthouse 13.5** (headless Chromium, production build, localhost):

| | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Desktop preset | 100 | 100 | 100 | 100 | 0.2 s | 0.6 s | 60 ms | 0 |
| Mobile (simulated 4× CPU, slow 4G) | 82 | 100 | 100 | 100 | 0.8 s | 2.9 s | 530 ms | 0 |

**JavaScript:** about 500 KB gzipped in total. The 3D chunk (three.js, R3F, drei, about 271 KB gz) is
loaded lazily after the HTML and text.

## Caveats and limits of this testing

- All browser testing used Chromium on one Apple Silicon machine. **Safari/WebKit, Firefox, real
  iOS/Android devices and low-end GPUs were not tested.** Headless frame timing is capped at
  60 fps and doesn't reflect thermal throttling on phones.
- Touch was tested with CDP-synthesised touch events. Native scroll/pan feel on a real phone needs
  manual testing.
- Screen readers were not run; accessibility rests on semantic markup, ARIA, keyboard tests and
  Lighthouse's automated audit.
- The mobile Lighthouse score is held back by main-thread time while three.js initialises (TBT
  530 ms under 4× throttling). The loader covers that period, but it is real work on slow phones.
