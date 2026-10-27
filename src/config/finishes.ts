/**
 * Finish definitions for AETHER ONE.
 *
 * Each finish describes the physically based parameters of the materials that
 * change between colourways. The 3D model tweens between these values, so a
 * finish switch is a real material change on the rendered product — never a
 * texture swap or a label change.
 */

export type FinishId = 'obsidian' | 'titanium' | 'ember'

export interface SurfaceSpec {
  color: string
  metalness: number
  roughness: number
  clearcoat: number
  clearcoatRoughness: number
}

export interface FinishSpec {
  id: FinishId
  name: string
  /** Short editorial description used in the configurator. */
  description: string
  /** Swatch colours for the UI chip (outer, inner). */
  swatch: [string, string]
  /** Ear-cup shells and the outer headband. */
  shell: SurfaceSpec
  /** Yokes, sliders, housings and the headband spine. */
  frame: SurfaceSpec
  /** Outer cap plates. */
  cap: SurfaceSpec
  /** Protein-leather cushions. */
  cushion: { color: string; sheenColor: string; roughness: number }
  /** Hairline accent ring and status light. */
  accent: { color: string; emissive: string; emissiveIntensity: number }
  /** Ambient tint used by the backdrop for this finish. */
  ambient: string
}

export const FINISHES: Record<FinishId, FinishSpec> = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Satin black shell, graphite frame, a single ember hairline.',
    swatch: ['#16181c', '#3a3e46'],
    shell: { color: '#16181c', metalness: 0.45, roughness: 0.4, clearcoat: 0.55, clearcoatRoughness: 0.32 },
    frame: { color: '#4a4f58', metalness: 1, roughness: 0.3, clearcoat: 0, clearcoatRoughness: 0.4 },
    cap: { color: '#0c0d10', metalness: 0.7, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 },
    cushion: { color: '#141518', sheenColor: '#2c3036', roughness: 0.58 },
    accent: { color: '#ff6a32', emissive: '#ff6a32', emissiveIntensity: 0.55 },
    ambient: '#ff6a32',
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium',
    description: 'Bead-blasted silver, polished steel, cool graphite cushions.',
    swatch: ['#c4cbd3', '#8d949c'],
    shell: { color: '#b6bdc5', metalness: 1, roughness: 0.34, clearcoat: 0.2, clearcoatRoughness: 0.4 },
    frame: { color: '#d8dde3', metalness: 1, roughness: 0.18, clearcoat: 0, clearcoatRoughness: 0.4 },
    cap: { color: '#9aa1a9', metalness: 1, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.15 },
    cushion: { color: '#26292e', sheenColor: '#4d535b', roughness: 0.56 },
    accent: { color: '#ff6a32', emissive: '#ff6a32', emissiveIntensity: 0.45 },
    ambient: '#9fb4c8',
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    description: 'Anodised burnt-orange shell over a dark bronze frame.',
    swatch: ['#c2532a', '#3a2a24'],
    shell: { color: '#c2532a', metalness: 0.75, roughness: 0.36, clearcoat: 0.7, clearcoatRoughness: 0.22 },
    frame: { color: '#5b4338', metalness: 1, roughness: 0.32, clearcoat: 0, clearcoatRoughness: 0.4 },
    cap: { color: '#1b120e', metalness: 0.6, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 },
    cushion: { color: '#1f1613', sheenColor: '#4a2e22', roughness: 0.58 },
    accent: { color: '#ffb27a', emissive: '#ff8a4a', emissiveIntensity: 0.6 },
    ambient: '#ff6a32',
  },
}

export const FINISH_ORDER: FinishId[] = ['obsidian', 'titanium', 'ember']

export const DEFAULT_FINISH: FinishId = 'obsidian'
