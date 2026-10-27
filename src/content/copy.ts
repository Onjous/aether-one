/**
 * All public-facing copy lives here so the narrative can be edited without
 * touching layout or animation code.
 *
 * AETHER is a fictional brand. Feature descriptions are concept-level product
 * storytelling, not verified hardware specifications.
 */

export const BRAND = {
  name: 'AETHER',
  product: 'AETHER ONE',
  tagline: 'BEYOND SOUND.',
  category: 'Wireless over-ear headphones',
  conceptNotice:
    'AETHER and AETHER ONE are fictional. This site is an independent creative-development concept with no affiliation to any audio manufacturer. Nothing here is for sale.',
} as const

export const NAV_LINKS = [
  { href: '#design', label: 'Design' },
  { href: '#engineering', label: 'Engineering' },
  { href: '#sound', label: 'Sound' },
  { href: '#finishes', label: 'Finishes' },
  { href: '#details', label: 'Details' },
] as const

export const CHAPTERS = [
  { id: 'arrival', index: '01', title: 'Arrival' },
  { id: 'design', index: '02', title: 'Form' },
  { id: 'engineering', index: '03', title: 'Exploded' },
  { id: 'sound', index: '04', title: 'Sound' },
  { id: 'finishes', index: '05', title: 'Finish' },
  { id: 'details', index: '06', title: 'Details' },
  { id: 'finale', index: '07', title: 'Finale' },
] as const

export const HERO = {
  eyebrow: 'Concept 2026 — Wireless over-ear',
  headline: ['BEYOND', 'SOUND.'],
  body: 'Engineered for immersion. Designed for everything beyond.',
  cta: 'Explore AETHER ONE',
  scrollHint: 'Scroll',
} as const

export const FORM = {
  eyebrow: '02 — Form meets function',
  headline: ['DESIGNED TO', 'DISAPPEAR.'],
  body: 'Every curve has a purpose. Every detail belongs.',
  points: [
    {
      title: 'Suspended headband',
      text: 'A single sculpted arc with a titanium-tone spine distributes weight away from the crown.',
    },
    {
      title: 'Ear cushions',
      text: 'Oval, slow-recovery cushions follow the shape of the ear instead of pressing against it.',
    },
    {
      title: 'Precision structure',
      text: 'Forked yokes and captive pivot pins let each cup settle at its own angle.',
    },
  ],
} as const

export const EXPLODED = {
  eyebrow: '03 — Inside AETHER ONE',
  headline: ['EVERY DETAIL.', 'REIMAGINED.'],
  body: 'Scroll to take it apart. Every layer separates along the axis it was assembled on, then returns home.',
  steps: [
    { key: 'separate', label: 'Separation', text: 'Cups release from their yokes; the headband lifts on its sliders.' },
    { key: 'isolate', label: 'Isolation', text: 'Cushions and acoustic grilles step away from the shell.' },
    { key: 'core', label: 'The core', text: 'Driver, motor and electronics come apart layer by layer.' },
    { key: 'return', label: 'Reassembly', text: 'Everything returns to exactly where it belongs.' },
  ],
} as const

export const ANNOTATIONS = {
  form: [
    { id: 'band', title: 'Headband', detail: 'Sculpted arc · suspended pad' },
    { id: 'cushion', title: 'Ear cushions', detail: 'Oval slow-recovery foam' },
    { id: 'yoke', title: 'Structure', detail: 'Forked yoke · captive pivots' },
  ],
  explode: [
    { id: 'driver', title: 'Precision acoustic driver', detail: 'Domed diaphragm · free-floating surround' },
    { id: 'anc', title: 'Adaptive noise isolation', detail: 'Feed-forward microphone array' },
    { id: 'foam', title: 'Memory foam cushioning', detail: 'Protein-leather wrap' },
    { id: 'frame', title: 'Titanium-inspired frame', detail: 'Lightweight spine and sliders' },
  ],
} as const

export type AnnotationId =
  | (typeof ANNOTATIONS.form)[number]['id']
  | (typeof ANNOTATIONS.explode)[number]['id']

export const SOUND = {
  eyebrow: '04 — Immersive sound',
  headline: ['FEEL EVERY', 'FREQUENCY.'],
  body: 'Two drivers, one field. Sound is shaped around you rather than aimed at you — from the weight of a low note to the air around a voice.',
  bands: ['Low', 'Mid', 'High', 'Air'],
} as const

export const CUSTOMIZE = {
  eyebrow: '05 — Your sound. Your way.',
  headline: ['MAKE IT', 'YOURS.'],
  body: 'Three finishes, each tuned as a complete material system — shell, frame, cap and cushion.',
  hintPointer: 'Drag to rotate',
  hintTouch: 'Swipe sideways to rotate',
  reset: 'Reset view',
} as const

export const SPECS = {
  eyebrow: '06 — Precision in every detail',
  headline: ['PRECISION IN', 'EVERY DETAIL.'],
  intro: 'Concept features, described the way we would want to live with them. Illustrative only — not measured specifications.',
  features: [
    {
      index: '01',
      title: 'Adaptive noise cancellation',
      text: 'Microphones on each cup listen to the room, so silence can adjust when the room does — a train, a café, an open office.',
    },
    {
      index: '02',
      title: 'Spatial audio',
      text: 'Sound is placed around you rather than inside your head, so a mix has width, depth and somewhere to breathe.',
    },
    {
      index: '03',
      title: 'Wireless connectivity',
      text: 'Pairs once and stays out of the way, moving between your devices without a menu.',
    },
    {
      index: '04',
      title: 'Lightweight construction',
      text: 'A slim titanium-tone spine and hollow yokes keep mass low where you feel it most — on the crown.',
    },
    {
      index: '05',
      title: 'All-day comfort',
      text: 'Oval cushions, a suspended pad and pivoting cups share the load evenly across hours of listening.',
    },
  ],
} as const

export const FINALE = {
  eyebrow: '07 — AETHER ONE',
  headline: ['THE FUTURE', 'SOUNDS DIFFERENT.'],
  cta: 'Discover the Experience',
} as const

export const CONCEPT_DIALOG = {
  title: 'About this concept',
  paragraphs: [
    'AETHER ONE is an imaginary product, designed and built as a creative-development showcase: real-time 3D, scroll-driven camera choreography and an interactive material system, running entirely in the browser.',
    'The headphones are an original procedural model generated in code with Three.js — no third-party product model or likeness is used. Every part you saw separate in the exploded view is a real, independent component.',
    'There is no shop, no pre-order and no product. Feature descriptions are illustrative storytelling, not engineering claims.',
  ],
  replay: 'Replay from the beginning',
  close: 'Close',
} as const
