/**
 * The director is the single source of truth for everything that moves.
 *
 * - `pose` is written exclusively by the GSAP master timeline
 *   (see `storyTimeline.ts`). It is a plain mutable object so GSAP can tween it
 *   without involving React.
 * - `runtime` holds per-frame inputs (scroll time, pointer, user rotation,
 *   intro progress) written by the scroll director and interaction handlers.
 * - The 3D scene and DOM overlays *read* both every frame.
 *
 * Keeping this outside React means scroll and render never trigger
 * re-renders, and there is exactly one writer per value.
 */

export const POSE_DEFAULTS = {
  // Camera
  camX: 0,
  camY: 0.25,
  camZ: 6.4,
  tgtX: 0,
  tgtY: 0.05,
  tgtZ: 0,
  // Product transform (Euler XYZ, radians)
  rotX: 0.08,
  rotY: -0.55,
  rotZ: 0,
  posX: 0,
  posY: 0,
  posZ: 0,
  // Behaviour weights (0..1)
  idle: 1,
  pointer: 1,
  interact: 0,
  // Exploded-view stages (0 = assembled, 1 = fully separated)
  explodeFrame: 0,
  explodeCups: 0,
  explodeCushion: 0,
  explodeCore: 0,
  explodeCap: 0,
  // Overlay visibility
  labelsForm: 0,
  labelsExplode: 0,
  // Atmosphere
  wave: 0,
  key: 1,
  rim: 1,
  accent: 0.25,
  env: 1,
  glow: 0.5,
  warm: 0,
  // Finale framing: 1 = fit the product into the finale's layout slot.
  slot: 0,
  // Extra height (world units) above the slot, eased to 0 so the product settles downward.
  slotDrop: 0,
}

export type Pose = typeof POSE_DEFAULTS
export type PoseKey = keyof Pose

export const pose: Pose = { ...POSE_DEFAULTS }

export type Layout = 'desktop' | 'mobile'

export const runtime = {
  /** Story time the scroll position asks for (chapter index + progress). */
  targetTime: 0,
  /** Smoothed story time actually rendered. */
  time: 0,
  /** Index of the chapter currently dominating the viewport. */
  chapter: 0,
  /** Seconds since start, paused while reduced motion freezes ambient loops. */
  elapsed: 0,
  /** Normalised pointer position in [-1, 1]. */
  pointerX: 0,
  pointerY: 0,
  /** User-driven product rotation (only honoured while `pose.interact` > 0). */
  userYaw: 0,
  userPitch: 0,
  userYawTarget: 0,
  userPitchTarget: 0,
  /** Intro reveal progress 0..1, animated once after loading. */
  intro: 0,
  reducedMotion: false,
  layout: 'desktop' as Layout,
  /** Viewport aspect ratio (width / height). */
  aspect: 16 / 9,
  /**
   * The finale's product slot, measured from the DOM: centre and size in CSS px
   * relative to the finale section's top-left — i.e. its position on screen at
   * the end of the story, when that section sits at the top of the viewport.
   */
  finaleSlot: null as { cx: number; cy: number; w: number; h: number } | null,
  /** Pixels scrolled past the end of the story (finale at the top → page end). */
  tail: 0,
  /** QA only (`?qa`): pose values forced on top of the timeline, e.g. to render stills. */
  poseOverride: null as Partial<Pose> | null,
}

type FrameListener = (dt: number) => void
const frameListeners = new Set<FrameListener>()

/** Register a callback that runs once per frame after the director updates. */
export function onDirectorFrame(listener: FrameListener) {
  frameListeners.add(listener)
  return () => {
    frameListeners.delete(listener)
  }
}

export function emitDirectorFrame(dt: number) {
  frameListeners.forEach((l) => l(dt))
}

/** Hook used by the WebGL stage to render after the director has updated. */
let renderHook: ((timestampMs: number) => void) | null = null

export function setRenderHook(hook: ((timestampMs: number) => void) | null) {
  renderHook = hook
}

export function runRenderHook(timestampMs: number) {
  renderHook?.(timestampMs)
}
