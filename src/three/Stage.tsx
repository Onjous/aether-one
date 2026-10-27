'use client'

import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ACESFilmicToneMapping, type Object3D } from 'three'
import { setRenderHook } from '@/animation/director'
import { appState, markLoaded } from '@/lib/appState'
import { getDeviceProfile } from '@/lib/device'
import { AnnotationProjector } from './AnnotationProjector'
import { CameraRig } from './CameraRig'
import { FrequencyField } from './effects/FrequencyField'
import { Lighting } from './Lighting'
import { Headphones } from './model/Headphones'

/**
 * Connects the canvas to the shared GSAP ticker. The canvas runs with
 * `frameloop="never"`; the scroll director advances it once per tick, right
 * after updating the pose, so scroll, animation and rendering share one clock.
 */
function TickerBridge() {
  const advance = useThree((s) => s.advance)
  useEffect(() => {
    setRenderHook((ts) => advance(ts))
    return () => setRenderHook(null)
  }, [advance])
  return null
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

/**
 * Reports genuine loading milestones: the environment map has been rendered,
 * every shader program has been compiled, and a frame has been presented.
 */
function Bootstrap() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const frames = useRef(0)
  const started = useRef(false)

  useFrame(() => {
    frames.current++
    if (frames.current !== 1 || started.current) return
    started.current = true
    // drei's <Environment frames={1}> renders its cube map on the first frame.
    markLoaded('environment')
    ;(async () => {
      // Compile everything, including effects that start hidden, so nothing
      // stalls the first time it appears mid-scroll.
      const hidden: Object3D[] = []
      scene.traverse((o) => {
        if (!o.visible) {
          hidden.push(o)
          o.visible = true
        }
      })
      try {
        await gl.compileAsync(scene, camera)
      } catch {
        // compileAsync is an optimisation; rendering compiles lazily anyway.
      }
      hidden.forEach((o) => (o.visible = false))
      markLoaded('shaders')
      await nextFrame()
      await nextFrame()
      markLoaded('frame')
    })()
  })
  return null
}

export default function Stage() {
  const profile = useMemo(() => getDeviceProfile(), [])
  // QA only: `?qa&dpr=2` pins the resolution so it can be measured without adaptation.
  const pinnedDpr = useMemo(() => {
    const q = new URLSearchParams(window.location.search)
    return q.has('qa') && q.get('dpr') ? Number(q.get('dpr')) : null
  }, [])
  const [dpr, setDpr] = useState(() => pinnedDpr ?? Math.min(window.devicePixelRatio || 1, profile.maxDpr))

  useEffect(() => {
    markLoaded('engine')
  }, [])

  const revealed = appState.useStore((s) => s.revealed)
  const onGeometryReady = useCallback(() => markLoaded('geometry'), [])

  return (
    <Canvas
      frameloop="never"
      dpr={dpr}
      shadows={profile.shadows ? 'percentage' : false}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 28, near: 0.1, far: 60, position: [0, 0.15, 6.6] }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        gl.setClearColor(0x000000, 0)
        // Read-only renderer handle for automated QA (`?qa`): draw calls, memory.
        if (new URLSearchParams(window.location.search).has('qa')) {
          ;(window as unknown as { __aetherRenderer: unknown }).__aetherRenderer = gl
        }
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          appState.set({ webgl: 'lost' })
        })
      }}
      aria-hidden
    >
      <TickerBridge />
      {/* Adaptive resolution starts only after loading, so shader compilation
          hitches can't lower it. Bounds are set so a display capped at its
          refresh rate can still step back up (the default upper bound equals
          the refresh rate and is unreachable). There is no `onFallback`: drei
          counts every adjustment, including no-op inclines, as a flip. */}
      {pinnedDpr === null && revealed && (
        <PerformanceMonitor
          bounds={(refresh) => [refresh * 0.6, refresh * 0.92]}
          onDecline={() => setDpr((d) => Math.max(1, +(d - 0.25).toFixed(2)))}
          onIncline={() => setDpr((d) => Math.min(profile.maxDpr, Math.min(window.devicePixelRatio || 1, +(d + 0.25).toFixed(2))))}
        />
      )}
      <Lighting shadows={profile.shadows} envResolution={profile.envResolution} />
      <CameraRig>
        <Headphones quality={profile.tier === 'high' ? 'high' : 'low'} shadows={profile.shadows} onReady={onGeometryReady} />
      </CameraRig>
      <FrequencyField rows={profile.waveRows} />
      <AnnotationProjector />
      <Bootstrap />
    </Canvas>
  )
}
