import { DEFAULT_FINISH, type FinishId } from '@/config/finishes'
import { createStore } from './createStore'

export type LoadStageId = 'engine' | 'geometry' | 'environment' | 'shaders' | 'frame'

export const LOAD_STAGES: { id: LoadStageId; label: string }[] = [
  { id: 'engine', label: 'Rendering engine' },
  { id: 'geometry', label: 'Procedural geometry' },
  { id: 'environment', label: 'Studio lighting' },
  { id: 'shaders', label: 'Shader compilation' },
  { id: 'frame', label: 'First frame' },
]

export type WebGLStatus = 'unknown' | 'supported' | 'unsupported' | 'lost'

interface AppState {
  finish: FinishId
  webgl: WebGLStatus
  /** Stages that have genuinely completed. Drives the loader — never simulated. */
  loaded: LoadStageId[]
  /** True once the loader has left and the intro has started. */
  revealed: boolean
  reducedMotion: boolean
  /** Committed user rotation in degrees (for the rotation slider's ARIA value). */
  yawDeg: number
}

export const appState = createStore<AppState>({
  finish: DEFAULT_FINISH,
  webgl: 'unknown',
  loaded: [],
  revealed: false,
  reducedMotion: false,
  yawDeg: 0,
})

export function markLoaded(stage: LoadStageId) {
  appState.set((s) => (s.loaded.includes(stage) ? {} : { loaded: [...s.loaded, stage] }))
}
