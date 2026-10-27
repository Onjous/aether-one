'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { pose, runtime } from '@/animation/director'
import { useScrollDirector } from '@/animation/useScrollDirector'
import { appState } from '@/lib/appState'
import { detectWebGL } from '@/lib/device'
import { Loader } from '../ui/Loader'
import { AnnotationLayer } from './AnnotationLayer'
import { Backdrop } from './Backdrop'
import { ChapterRail } from './ChapterRail'
import { Hud } from './Hud'
import { MotionController } from './MotionController'

// three.js, R3F and the model are only downloaded on the client, after the
// page's HTML and text are already on screen.
const Stage = dynamic(() => import('@/three/Stage'), { ssr: false, loading: () => null })

/** Client shell: the fixed 3D layer, overlays and the scroll director. */
export function Experience() {
  useScrollDirector()
  const webgl = appState.useStore((s) => s.webgl)
  const revealed = appState.useStore((s) => s.revealed)

  useEffect(() => {
    appState.set({ webgl: detectWebGL() ? 'supported' : 'unsupported' })
    // Read-only debugging handle for automated QA (`?qa` in the URL).
    if (new URLSearchParams(window.location.search).has('qa')) {
      ;(window as unknown as { __aether: unknown }).__aether = { pose, runtime, appState }
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('no-webgl', webgl === 'unsupported' || webgl === 'lost')
  }, [webgl])

  return (
    <>
      <Backdrop />
      {webgl === 'supported' && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed inset-x-0 top-0 z-10 h-[100lvh] transition-opacity duration-[1600ms] ${revealed ? 'opacity-100' : 'opacity-0'}`}
        >
          <Stage />
        </div>
      )}
      <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 z-[15]" />
      <AnnotationLayer />
      <ChapterRail />
      <Hud />
      <MotionController />
      <Loader />
    </>
  )
}
