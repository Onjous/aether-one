'use client'

import { Environment, Lightformer } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { DirectionalLight, Object3D, SpotLight } from 'three'
import { pose, runtime } from '@/animation/director'

/**
 * Studio lighting.
 *
 * Reflections come from a procedural environment built from Lightformers —
 * soft boxes and strip lights rendered once into a cube map — so no HDR file
 * is downloaded. A key spot provides form and (on capable devices) shadows,
 * and two rims carve the silhouette out of the black. Intensities follow the
 * director so each chapter has its own lighting mood.
 */
export function Lighting({ shadows, envResolution }: { shadows: boolean; envResolution: number }) {
  const scene = useThree((s) => s.scene)
  const key = useRef<SpotLight>(null)
  const rim = useRef<DirectionalLight>(null)
  const accent = useRef<SpotLight>(null)
  const target = useRef<Object3D>(null)

  useLayoutEffect(() => {
    if (target.current) {
      if (key.current) key.current.target = target.current
      if (accent.current) accent.current.target = target.current
    }
  }, [])

  useFrame(() => {
    const intro = runtime.intro
    const fadeIn = 0.08 + 0.92 * intro
    if (key.current) key.current.intensity = 26 * pose.key * fadeIn
    if (rim.current) rim.current.intensity = 2.4 * pose.rim * fadeIn
    if (accent.current) accent.current.intensity = 34 * pose.accent * fadeIn
    scene.environmentIntensity = 0.85 * pose.env * (0.25 + 0.75 * intro)
  })

  return (
    <>
      <object3D ref={target} position={[0, 0, 0]} />
      <spotLight
        ref={key}
        position={[-3.2, 4.6, 4.2]}
        angle={0.42}
        penumbra={0.9}
        decay={0}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-radius={6}
        shadow-camera-near={2}
        shadow-camera-far={14}
      />
      <directionalLight ref={rim} position={[4, 2.5, -4]} color="#cfe0ff" />
      <spotLight ref={accent} position={[-4.5, 1.2, -3.6]} angle={0.55} penumbra={1} decay={0} color="#ff6a32" />
      <ambientLight intensity={0.04} />

      <Environment resolution={envResolution} frames={1} background={false}>
        {/* Overhead soft box */}
        <Lightformer form="rect" intensity={2.2} position={[0, 5, 0.5]} rotation-x={Math.PI / 2} scale={[7, 2.2, 1]} />
        {/* Tall strips left and right — the long highlights on the band and shells */}
        <Lightformer form="rect" intensity={3.2} position={[-5, 0.8, 1.5]} rotation-y={Math.PI / 2} scale={[0.7, 6, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[5, 0.6, -0.5]} rotation-y={-Math.PI / 2} scale={[0.5, 5, 1]} />
        {/* Low front fill */}
        <Lightformer form="rect" intensity={0.5} position={[0, -1.2, 5]} scale={[6, 1.2, 1]} />
        {/* Warm horizon strip behind the product */}
        <Lightformer form="rect" color="#ff6a32" intensity={0.9} position={[0, 0.2, -6]} scale={[9, 0.35, 1]} />
        {/* Cool kicker */}
        <Lightformer form="ring" color="#bcd3ff" intensity={1.2} position={[3.5, 3, -3]} scale={1.6} />
      </Environment>
    </>
  )
}
