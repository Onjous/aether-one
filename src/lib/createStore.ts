import { useSyncExternalStore } from 'react'

/**
 * Minimal external store used for the few pieces of state that React UI and
 * the 3D scene both need (selected finish, loading stages, WebGL status).
 * Per-frame values never go through here — see `animation/director.ts`.
 */
export function createStore<T extends object>(initial: T) {
  let state = initial
  const listeners = new Set<() => void>()

  const get = () => state
  const set = (patch: Partial<T> | ((s: T) => Partial<T>)) => {
    const next = typeof patch === 'function' ? patch(state) : patch
    state = { ...state, ...next }
    listeners.forEach((l) => l())
  }
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function useStore<S>(selector: (s: T) => S): S {
    return useSyncExternalStore(
      subscribe,
      () => selector(state),
      () => selector(initial),
    )
  }

  return { get, set, subscribe, useStore }
}
