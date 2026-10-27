'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import { pose, runtime } from '@/animation/director'

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Concentric pressure waves radiating from the cup outline. The radius is
// measured in a space stretched to the cup's oval, so rings echo its shape.
const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.6;
    float r = length(p / vec2(0.82, 1.0));
    float phase = fract(r * 2.6 - uTime * 0.32);
    float band = smoothstep(0.0, 0.03, phase) * (1.0 - smoothstep(0.03, 0.16, phase));
    float fade = smoothstep(0.5, 0.66, r) * (1.0 - smoothstep(0.75, 1.25, r));
    float a = band * fade * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`

/** Expanding rings around an ear cup, visible only in the sound chapter. */
export function SoundRings() {
  const mesh = useRef<Mesh>(null)
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(2.6, 2.6)
    g.rotateY(Math.PI / 2)
    return g
  }, [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0 },
          uColor: { value: new Color('#ff7a45') },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  )
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const i = pose.wave * (1 - pose.explodeCups)
    m.visible = i > 0.005
    material.uniforms.uTime.value = runtime.elapsed
    material.uniforms.uIntensity.value = i * 0.8
  })

  return <mesh ref={mesh} geometry={geometry} material={material} position={[0.36, 0, 0]} renderOrder={2} />
}
