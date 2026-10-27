'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LineSegments,
  ShaderMaterial,
} from 'three'
import { pose, runtime } from '@/animation/director'

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  varying float vHeight;
  varying float vFade;

  // A point source: a decaying radial sine.
  float source(vec2 p, vec2 origin) {
    float d = length(p - origin);
    return sin(d * 5.2 - uTime * 2.1) * exp(-d * 0.32);
  }

  void main() {
    vec3 p = position;
    // Two sources, one under each ear cup, interfere into a stereo field.
    float h = 0.5 * (source(p.xz, vec2(-0.75, 0.0)) + source(p.xz, vec2(0.75, 0.0)));
    // A slow swell underneath keeps the field alive between crests.
    h += 0.3 * sin(p.x * 0.55 + uTime * 0.45) * sin(p.z * 0.42 - uTime * 0.3);
    p.y += h * uAmp * 0.24;
    vHeight = h;
    float r = length(p.xz * vec2(0.8, 1.0));
    vFade = (1.0 - smoothstep(2.5, 8.5, r)) * smoothstep(0.0, 1.2, p.z + 7.5);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vHeight;
  varying float vFade;
  void main() {
    float crest = smoothstep(0.15, 0.85, vHeight);
    vec3 color = mix(uBase, uAccent, crest);
    float a = vFade * uOpacity * (0.28 + 0.72 * smoothstep(-0.6, 0.9, vHeight));
    gl_FragColor = vec4(color * a, a);
  }
`

/**
 * A field of fine lines below the product, displaced by two interfering
 * point sources — a stereo pair under the ear cups. Lines are drawn at native
 * 1 px width, which keeps the effect precise rather than glowing.
 */
export function FrequencyField({ rows }: { rows: number }) {
  const ref = useRef<LineSegments>(null)
  const geometry = useMemo(() => {
    const cols = 180
    const x0 = -8
    const x1 = 8
    const z0 = -7.5
    const z1 = 2.5
    const positions: number[] = []
    for (let r = 0; r < rows; r++) {
      const z = z0 + ((z1 - z0) * r) / (rows - 1)
      for (let c = 0; c < cols; c++) {
        const xa = x0 + ((x1 - x0) * c) / cols
        const xb = x0 + ((x1 - x0) * (c + 1)) / cols
        positions.push(xa, 0, z, xb, 0, z)
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(positions, 3))
    g.computeBoundingSphere()
    return g
  }, [rows])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: 1 },
          uOpacity: { value: 0 },
          uBase: { value: new Color('#8d97a3') },
          uAccent: { value: new Color('#ff6a32') },
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
    const l = ref.current
    if (!l) return
    l.visible = pose.wave > 0.005
    material.uniforms.uTime.value = runtime.elapsed
    material.uniforms.uOpacity.value = pose.wave * 0.75
    material.uniforms.uAmp.value = 0.4 + 0.6 * pose.wave
  })

  return <lineSegments ref={ref} geometry={geometry} material={material} position={[0, -1.32, 0]} frustumCulled={false} />
}
