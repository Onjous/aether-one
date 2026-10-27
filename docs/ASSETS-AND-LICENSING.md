# Assets and licensing

## Original work (this project)

| Asset | Origin |
| --- | --- |
| AETHER ONE 3D model | Original, generated procedurally in code (`src/three/geometry/`). No third-party model, scan or product likeness is used. |
| Textures (cap grain and marking, scrim knit, grille perforation, PCB) | Original, drawn on a 2D canvas at runtime (`src/three/model/textures.ts`). |
| Studio lighting / reflections | Procedural Lightformer environment rendered in the browser. No HDRI files. |
| Shaders (frequency field, sound rings) | Original GLSL. |
| Logo / wordmark / favicon | Original. The symbol is the model's own ear-cup superellipse. |
| Fallback stills and `og.jpg` (`public/stills/`) | Rendered from this project's own scene with `qa/stills.mjs`. |
| Copy | Original. All product claims are fictional and illustrative. |

The brand, product and feature descriptions are fictional. The site states this in the hero
metadata, the finale and the footer, and in the concept dialog.

## Fonts

Self-hosted at build time through `next/font/google`, so no runtime requests go to Google.

| Font | Use | License |
| --- | --- | --- |
| Archivo (variable, wdth + wght) — Omnibus-Type | Display and body | SIL Open Font License 1.1 |
| Geist Mono — Vercel | Technical labels | SIL Open Font License 1.1 |

## Libraries (runtime)

| Package | License |
| --- | --- |
| next, react, react-dom | MIT |
| three | MIT |
| @react-three/fiber, @react-three/drei | MIT |
| gsap (incl. ScrollTrigger, SplitText), @gsap/react | GreenSock "Standard" no-charge license. Since GSAP 3.13 all plugins are free to use, including commercially. **Re-check the current terms at https://gsap.com/licensing/ before publishing.** |
| tailwindcss | MIT |

## Development-only tooling

TypeScript (Apache-2.0), ESLint and eslint-config-next (MIT), Playwright (Apache-2.0) and
Lighthouse (Apache-2.0). Playwright and Lighthouse live only in `qa/` and are never shipped.

## Attribution requirements

None of the assets above require visible attribution. The OFL requires the license to accompany
redistributed font files, and `next/font` handles serving them. Keep the libraries' license files
(in `node_modules`) if you redistribute the source.
