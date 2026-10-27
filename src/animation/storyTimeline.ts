import gsap from 'gsap'
import { pose, POSE_DEFAULTS, type Layout, type Pose } from './director'

/**
 * The story timeline.
 *
 * Story time is measured in chapters: time `n` is the moment chapter `n`'s
 * section reaches the top of the viewport, and time moves from `n` to `n + 1`
 * as that section scrolls away. The master timeline below is authored in that
 * unit, so its choreography stays correct for any viewport height or section
 * length.
 *
 * The timeline is paused and never plays on its own; the scroll director sets
 * its time every frame from the (smoothed) scroll position. One timeline means
 * there is exactly one tween per property at any moment, so scrolling in either
 * direction — at any speed — is deterministic and fully reversible.
 */

type Shot = Partial<Pose>

interface ShotList {
  hero: Shot
  form: Shot
  explodeIn: Shot
  explodeClose: Shot
  explodeWide: Shot
  explodeHold: Shot
  explodeOut: Shot
  sound: Shot
  customize: Shot
  specsIn: Shot
  specsOut: Shot
  finale: Shot
}

const DESKTOP: ShotList = {
  hero: {
    camX: 0, camY: 0.15, camZ: 6.6, tgtX: 0, tgtY: 0, tgtZ: 0,
    rotX: 0.1, rotY: -0.55, rotZ: 0,
    idle: 1, pointer: 1, interact: 0,
    key: 1, rim: 1, accent: 0.35, env: 1, glow: 0.6, warm: 0, wave: 0,
  },
  form: {
    camX: -1.0, camY: 0.36, camZ: 5.8, tgtX: -1.0, tgtY: -0.02, tgtZ: 0,
    rotX: 0.14, rotY: -1.12, rotZ: 0,
    idle: 0.35, pointer: 0, accent: 0.2, glow: 0.35,
  },
  explodeIn: {
    camX: -0.3, camY: 0.65, camZ: 6.6, tgtX: -0.3, tgtY: 0, tgtZ: 0,
    rotX: 0.22, rotY: 0.62, rotZ: 0,
    idle: 0, accent: 0.3, glow: 0.4,
  },
  explodeClose: {
    camX: -0.45, camY: 0.55, camZ: 5.7, tgtX: -0.45, tgtY: -0.06, tgtZ: 0,
  },
  explodeWide: {
    camX: -0.6, camY: 1.25, camZ: 10.2, tgtX: -0.6, tgtY: 0.14, tgtZ: 0,
    rotX: 0.3, rotY: 0.52, rotZ: 0,
    key: 1.1, glow: 0.55,
  },
  explodeHold: {
    camX: -0.55, camY: 1.45, camZ: 9.9, tgtX: -0.55, tgtY: 0.12, tgtZ: 0,
    rotX: 0.34, rotY: 0.66, rotZ: 0,
  },
  explodeOut: {
    camX: 0, camY: 0.6, camZ: 6.6, tgtX: 0, tgtY: 0.02, tgtZ: 0,
    rotX: 0.2, rotY: 0.4, rotZ: 0,
    key: 1, glow: 0.45,
  },
  sound: {
    camX: -0.8, camY: 1.05, camZ: 7.8, tgtX: -0.8, tgtY: -0.32, tgtZ: 0,
    rotX: 0.14, rotY: -0.82, rotZ: 0,
    idle: 1, key: 0.7, rim: 1.2, accent: 1, glow: 0.9, warm: 1,
  },
  customize: {
    camX: -1.0, camY: 0.25, camZ: 6.2, tgtX: -1.0, tgtY: 0, tgtZ: 0,
    rotX: 0.1, rotY: -0.65, rotZ: 0,
    idle: 0.25, key: 1, rim: 1, accent: 0.3, glow: 0.55, warm: 0,
  },
  specsIn: {
    camX: 1.55, camY: 0.3, camZ: 7.4, tgtX: 1.55, tgtY: 0.05, tgtZ: 0,
    rotX: 0.12, rotY: -0.95, rotZ: 0,
    idle: 0.2, key: 0.9, env: 0.9, glow: 0.3,
  },
  specsOut: {
    camX: 1.55, camY: 0.1, camZ: 7.2, tgtX: 1.55, tgtY: 0.05, tgtZ: 0,
    rotX: 0.04, rotY: -1.7, rotZ: 0,
  },
  finale: {
    camX: 0, camY: -0.3, camZ: 8.4, tgtX: 0, tgtY: 0.28, tgtZ: 0,
    rotX: -0.02, rotY: -0.42, rotZ: 0,
    idle: 0.3, key: 1.1, rim: 1.3, accent: 0.8, env: 1, glow: 1, warm: 0.6,
  },
}

const MOBILE: ShotList = {
  hero: {
    camX: 0, camY: 0.1, camZ: 10.4, tgtX: 0, tgtY: -0.22, tgtZ: 0,
    rotX: 0.12, rotY: -0.6, rotZ: 0,
    idle: 1, pointer: 0, interact: 0,
    key: 1, rim: 1, accent: 0.35, env: 1, glow: 0.6, warm: 0, wave: 0,
  },
  form: {
    camX: 0, camY: 0.35, camZ: 11.2, tgtX: 0, tgtY: -0.2, tgtZ: 0,
    rotX: 0.14, rotY: -1.12, rotZ: 0,
    idle: 0.35, accent: 0.2, glow: 0.35,
  },
  explodeIn: {
    camX: 0, camY: 0.6, camZ: 9.2, tgtX: 0, tgtY: 0, tgtZ: 0,
    rotX: 0.22, rotY: 0.62, rotZ: 0,
    idle: 0, accent: 0.3, glow: 0.4,
  },
  explodeClose: {
    camX: 0, camY: 0.55, camZ: 8.2, tgtX: 0, tgtY: 0, tgtZ: 0,
  },
  // On portrait screens the product turns onto its side as it opens, so the
  // separation axis runs vertically and every layer stays on screen.
  explodeWide: {
    camX: -0.35, camY: 0.2, camZ: 15.5, tgtX: -0.35, tgtY: 0.45, tgtZ: 0,
    rotX: 0.6, rotY: 0.3, rotZ: 1.5,
    key: 1.1, glow: 0.55,
  },
  explodeHold: {
    camX: -0.35, camY: 0.4, camZ: 15.2, tgtX: -0.35, tgtY: 0.45, tgtZ: 0,
    rotX: 0.72, rotY: 0.42, rotZ: 1.5,
  },
  explodeOut: {
    camX: 0, camY: 0.6, camZ: 9.4, tgtX: 0, tgtY: 0, tgtZ: 0,
    rotX: 0.2, rotY: 0.4, rotZ: 0,
    key: 1, glow: 0.45,
  },
  sound: {
    camX: 0, camY: 1.2, camZ: 10.4, tgtX: 0, tgtY: -0.2, tgtZ: 0,
    rotX: 0.16, rotY: -0.72, rotZ: 0,
    idle: 1, key: 0.7, rim: 1.2, accent: 1, glow: 0.9, warm: 1,
  },
  customize: {
    camX: 0, camY: 0.25, camZ: 9.2, tgtX: 0, tgtY: 0.05, tgtZ: 0,
    rotX: 0.1, rotY: -0.65, rotZ: 0,
    idle: 0.25, key: 1, rim: 1, accent: 0.3, glow: 0.55, warm: 0,
  },
  specsIn: {
    camX: 0, camY: 0.3, camZ: 11.5, tgtX: 0, tgtY: -1.1, tgtZ: 0,
    rotX: 0.12, rotY: -0.95, rotZ: 0,
    idle: 0.2, key: 0.6, env: 0.6, glow: 0.2,
  },
  specsOut: {
    camX: 0, camY: 0.1, camZ: 11.5, tgtX: 0, tgtY: -1.1, tgtZ: 0,
    rotX: 0.04, rotY: -1.7, rotZ: 0,
  },
  finale: {
    camX: 0, camY: -0.25, camZ: 10.8, tgtX: 0, tgtY: 0.32, tgtZ: 0,
    rotX: -0.02, rotY: -0.42, rotZ: 0,
    idle: 0.3, key: 1.1, rim: 1.3, accent: 0.8, env: 1, glow: 1, warm: 0.6,
  },
}

/** Story times at which the exploded-view caption changes. */
export const EXPLODE_STEPS = [
  { from: 2.0, to: 2.2 },
  { from: 2.2, to: 2.34 },
  { from: 2.34, to: 2.62 },
  { from: 2.62, to: 2.8 },
] as const

/**
 * For reduced motion: the representative story time of each chapter. The
 * scene snaps to these instead of travelling between them.
 */
export const CHAPTER_HOLD_TIMES = [0, 1, 2.55, 3, 4, 5.25, 6] as const

/**
 * Story time at which the finale section reaches the top of the viewport.
 * Scrolling beyond it (towards the footer) is not story time: the director
 * reports it as `runtime.tail` and the product travels up with the page.
 */
export const STORY_END = 6

export function buildStoryTimeline(layout: Layout) {
  const S = layout === 'mobile' ? MOBILE : DESKTOP

  // Start every build from the opening shot so `to` tweens capture the correct
  // starting values when the timeline is primed below.
  Object.assign(pose, POSE_DEFAULTS, S.hero)

  const tl = gsap.timeline({ paused: true })
  const to = (vars: Shot, start: number, end: number, ease = 'power2.inOut') =>
    // `lazy: false` makes each tween write its values the moment it renders.
    // With GSAP's default lazy rendering, priming the whole timeline in one
    // tick would let later tweens capture stale start values.
    tl.to(pose, { ...vars, duration: end - start, ease, overwrite: false, lazy: false }, start)

  // 01 → 02  Arrival to Form
  to({ pointer: 0 }, 0.05, 0.45, 'power1.out')
  to(S.form, 0.2, 1.0)
  to({ labelsForm: 1 }, 0.82, 1.0, 'power1.out')

  // 02 → 03  Form to the exploded set-up
  to({ labelsForm: 0 }, 1.18, 1.36, 'power1.in')
  to(S.explodeIn, 1.3, 2.0)

  // 03  The exploded view
  to(S.explodeClose, 2.0, 2.1, 'power1.inOut')
  to({ explodeFrame: 1, explodeCups: 1 }, 2.08, 2.3, 'power2.inOut')
  to(S.explodeWide, 2.1, 2.34, 'power2.inOut')
  to({ explodeCushion: 1, explodeCap: 1 }, 2.2, 2.4, 'power2.inOut')
  to({ explodeCore: 1 }, 2.28, 2.48, 'power2.inOut')
  to({ labelsExplode: 1 }, 2.44, 2.5, 'power1.out')
  to(S.explodeHold, 2.34, 2.62, 'sine.inOut')
  to({ labelsExplode: 0 }, 2.6, 2.64, 'power1.in')
  to({ explodeCore: 0 }, 2.63, 2.71, 'power2.inOut')
  to({ explodeCushion: 0, explodeCap: 0 }, 2.65, 2.73, 'power2.inOut')
  to({ explodeFrame: 0, explodeCups: 0 }, 2.67, 2.77, 'power2.inOut')
  to(S.explodeOut, 2.63, 2.78, 'power2.inOut')

  // 03 → 04  Into the sound field
  to(S.sound, 2.78, 3.0)
  to({ wave: 1 }, 2.8, 3.0, 'power1.out')

  // 04 → 05  Configurator
  to({ ...S.customize, wave: 0 }, 3.3, 4.0)
  to({ interact: 1 }, 3.85, 4.0, 'power1.out')

  // 05 → 06  Editorial details
  to({ interact: 0 }, 4.3, 4.42, 'power1.in')
  to(S.specsIn, 4.35, 5.0)
  to(S.specsOut, 5.0, 5.6, 'sine.inOut')

  // 06 → 07  Finale
  // The camera hands over from the authored shot to a framing fitted to the
  // finale's layout slot (see CameraRig). The product starts a little above the
  // slot and settles down into it, coming to rest exactly when the finale
  // section reaches the top of the viewport — the end of the story.
  to(S.finale, 5.6, 6.0)
  to({ slotDrop: 0.6 }, 5.4, 5.6, 'none')
  to({ slot: 1 }, 5.6, 5.92, 'power2.inOut')
  to({ slotDrop: 0 }, 5.66, 6.0, 'power3.out')

  // Pad to the end of the story so `duration()` equals STORY_END.
  tl.set({}, {}, STORY_END)

  // Prime: render every tween once, in order, then rewind. This records each
  // tween's start values deterministically no matter where the user first lands.
  tl.progress(1).progress(0)

  return tl
}
