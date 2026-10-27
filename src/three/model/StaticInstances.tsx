'use client'

import { useLayoutEffect, useRef } from 'react'
import type { BufferGeometry, InstancedMesh, Material, Matrix4 } from 'three'

interface Props {
  geometry: BufferGeometry
  material: Material
  matrices: Matrix4[]
  castShadow?: boolean
  receiveShadow?: boolean
}

/** Many copies of one small part in a single draw call. */
export function StaticInstances({ geometry, material, matrices, castShadow, receiveShadow }: Props) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices])
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, matrices.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  )
}
