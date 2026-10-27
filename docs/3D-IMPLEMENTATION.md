# 3D implementation

## Why a procedural model

The brief prefers a licensed GLB, with a procedural model as the fallback. A procedural model was
chosen deliberately:

- **Licensing and provenance are unambiguous.** Nothing is downloaded from third parties, and no
  real product's likeness is used.
- **The exploded view needs real, separable parts.** Most downloadable headphone models are merged
  meshes or lack internals (drivers, boards, baffles). Building in code guarantees every layer
  exists as its own mesh, in mechanically sensible positions.
- **Finishes and detail are parametric.** Proportions, tessellation and materials can be tuned per
  device tier.

## Coordinate system and units

≈ 1 unit = 10 cm. X runs ear to ear, Y is up, Z faces forward. Ear-cup parts are authored for the
**right** cup in a local frame whose origin is the cup's rim plane, with +X pointing away from the
head. The left side reuses the same geometry mirrored (`scale.x = -1`; three.js flips face
winding automatically for negative-determinant transforms). Anything with legible text (cap
marking, the L/R scrim mark) uses a mirrored texture for the side where it would read backwards.

All dimensions live in `DIM` and exploded travel in `EXPLODE` in
`src/three/geometry/headphoneGeometry.ts`.

## Geometry builders (`src/three/geometry/builders.ts`)

Two primitives produce almost every part:

- **`loft(profile, ring)`**: revolves a 2D profile `(x, s)` around the X axis, where every ring is a
  superellipse (`|y/b|^n + |z/a|^n = s^n`, n = 2.6). A third column blends a ring towards a circle,
  which is how the baffle plate goes from the oval cup outline to the round driver port. Used for
  cup shells, caps, cushions, piping, cushion mounts, scrims and baffles.
- **`sweep(path, planeNormal, profileAt)`**: extrudes a closed cross-section along a planar path
  with a stable frame (T, N = T × P, B = P). The cross-section can vary along the path. Used for
  the headband (tapering from crown to sliders), the titanium-tone spine, the suspended pad and the
  forked yokes.

Normal orientation is guaranteed by construction rather than fixed afterwards: closed loft
profiles are authored clockwise in (x, s), sweep cross-sections counter-clockwise in (u, v).
Repeating a profile point creates a zero-area strip, which gives a crisp crease (for example the
shell lip or the baffle edges) without splitting meshes. Seams wrap by index, so there are no
duplicate seam vertices and normals stay smooth.

Small details use standard primitives: lathe profiles (dome, cone with half-roll surround, basket
flange), cylinders (voice coil, magnet stack, pins, screws, rods), rounded boxes (housings,
battery, port), an extruded rounded-rectangle PCB, and instanced meshes for repeated parts
(basket spokes, SMD chips, screws, microphone ports).

## Parts and the exploded view

| Assembly | Parts | Exploded motion (scroll-driven) |
| --- | --- | --- |
| Frame | band, spine, pad + straps, slider housings, rods | lifts +Y; rods pull out of the swivels |
| Yoke (per side) | fork, swivel, bosses, pivot pins | stays; pins withdraw ±Z out of the cup |
| Cup (per side) | shell, buttons, LED, USB-C port, mic ports, screws | slides out of the fork along ±X |
| Cap | spun-metal cap, accent hairline | outward +X, beyond the shell |
| Electronics | PCB + chips + feed-forward mics (right) / battery (left) | inward along the cup axis |
| Motor | basket flange, spokes, top plate, magnet, pot | inward, further |
| Diaphragm | titanium-tone dome, iridescent cone and surround, voice coil | inward, further still |
| Baffle | oval-to-round plate + perforated grille | inward |
| Cushion | leather cushion, piping, mount ring, L/R scrim | furthest inward |

The order of travel matches the order of assembly, so no part passes through another. The
stages are staggered on the timeline so that on the way out the outer layers lead, and on the
way back the inner layers return first.

## Materials (`src/three/model/materials.ts`)

`MeshPhysicalMaterial` for the finish-dependent surfaces (shell, frame, caps, leather) with
clearcoat and sheen, `MeshStandardMaterial` elsewhere. Notable details:

- **Caps**: spun-metal grain as a roughness map plus a pad-printed `AETHER ONE` marking as an
  emissive map, so it reads on every finish regardless of reflections.
- **Driver**: polished dome; dark cone with thin-film iridescence.
- **Grille**: perforation alpha map with `alphaTest` (no transparency sorting).
- **Leather**: sheen-based fabric/leather response.

All textures are drawn on a 2D canvas at start-up (`textures.ts`) with a seeded PRNG, so they
are identical on every load. Mirrored variants are `clone()`s of the same texture with
`repeat.x = -1`, so the canvas is drawn and uploaded once.

**Finish switching** tweens the actual material parameters (`color`, `metalness`, `roughness`,
`clearcoat`, `clearcoatRoughness`, sheen colour, accent emissive) with GSAP over 1.1 s. The
values per finish live in `src/config/finishes.ts`.

## Lighting (`src/three/Lighting.tsx`)

- Drei `<Environment>` built from `<Lightformer>`s (overhead soft box, tall strips, warm horizon,
  cool kicker), rendered once into a cube map. There is no HDR download.
- A key spot light (PCF shadows on high-tier devices), a cool rim and an amber accent rim.
- Every intensity is multiplied by the director's `key`, `rim`, `accent` and `env` values, so each
  chapter has its own lighting mood, and by the intro progress for the fade-up from darkness.

ACES Filmic tone mapping, exposure 1.05, transparent canvas over CSS gradient layers.

## Effects

- **Frequency field** (`effects/FrequencyField.tsx`): about 13k line segments on a plane, displaced
  in the vertex shader by two decaying radial sine sources (one under each cup) that interfere,
  plus a slow swell. Native 1 px lines, additive, crest colour shifts to ember.
- **Sound rings** (`effects/SoundRings.tsx`): a quad per cup; the fragment shader draws expanding
  rings in a space stretched to the cup's oval, so the rings echo its shape.

Both only render when `pose.wave > 0`.

## Scroll orchestration

```
scroll position
  → per-chapter ScrollTriggers ([data-chapter], 'top top' → 'bottom top')
  → story time = Σ clamp(chapter progress)          (deterministic for any position)
  → smoothed story time (exponential damping, frame-rate independent)
  → masterTimeline.time(storyTime)                    (GSAP, paused, authored in chapter units)
  → pose (plain object)  → CameraRig / Headphones / Lighting / overlays read it each frame
```

- **One timeline, one writer per value.** The master timeline is the only thing that writes
  `pose`, so scrolling in either direction at any speed (or jumping via a nav link) is
  deterministic and reversible. Automated QA verifies identical poses scrolling down vs. up and
  after long jumps.
- Tweens use `lazy: false`, and the timeline is primed with `progress(1).progress(0)` so start
  values are recorded in order.
- **One loop.** The canvas runs `frameloop="never"`; the GSAP ticker updates the director,
  notifies DOM subscribers (chapter rail, HUD, captions, backdrop) and then advances the R3F
  render, all in the same frame.
- **Layouts.** Desktop and portrait shot lists are rebuilt through `gsap.matchMedia` on the same
  query as the CSS `wide` variant, so text layout and camera choreography always switch
  together. The camera rig also compensates for aspect ratio and short screens by dollying.
- **Layered rotation.** The inner group carries the choreographed rotation; the outer group adds
  idle sway, pointer parallax (hero only) and user rotation (configurator only), each weighted by
  a pose value. They can't fight the scroll animation, and user rotation is released when the
  chapter ends.
- **Finale framing and the page end.** Story time ends when the finale section
  reaches the top of the viewport; the page still scrolls by the footer's height after that.
  Two mechanisms make the ending work:
  1. *Slot fitting.* The finale reserves a `[data-product-slot]` element between headline and
     CTA. The director measures it on every ScrollTrigger refresh (relative to its section, which
     equals its on-screen position at story end). During the finale entrance the timeline blends
     the `slot` weight from 0 to 1, and the camera rig computes the distance and aim that fit the
     product into the slot. A decaying `slotDrop` makes the product descend and settle, coming to
     rest exactly at story end.
  2. *Tail tracking.* Scroll beyond story end is reported unsmoothed as `runtime.tail` (px). The
     rig pans the camera along its own up axis by that many pixels, measured at the product's
     depth, so the product leaves with the finale section and can never sit over the footer.
     (Panning along world Y lagged by about 1% because the finale camera looks slightly upward.)

  The finale headline sits behind the canvas, like the hero's, so the settling product passes in
  front of the type and rests clear of it.
- **Pinning** uses CSS `position: sticky` inside tall sections rather than ScrollTrigger pins, so
  there is no scroll hijacking and no layout jumps.

## Loading

The loader reports five real milestones: engine module loaded, geometry built, environment map
rendered, shaders compiled (`renderer.compileAsync`, including initially hidden effects), and
first frame presented. Progress is never simulated. After 9 s a "continue while it loads"
option appears.

## Performance measures

- three.js / R3F / drei are lazy-loaded (`next/dynamic`, `ssr: false`) after the HTML and text.
- Device profile: DPR cap (2 / 1.75 / 1.25), shadows only on the high tier, lower tessellation and
  texture sizes and fewer field lines on mobile and low-memory devices.
- Adaptive resolution with drei `PerformanceMonitor`, started only after loading. Bounds are
  tuned so 60 Hz displays can step back up, and there is no `onFallback` (drei counts no-op
  inclines as flips, which used to force DPR 1).
- Instancing for repeated parts, shared geometries between sides, shared materials, one cube map.
- Annotation overlays write only `transform` / `opacity` / `visibility`, and measure label widths
  once.
- Every geometry, material and texture is disposed on unmount; every ScrollTrigger, ticker
  callback, matchMedia context and listener is removed.
