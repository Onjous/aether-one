'use client'

import { useEffect, useRef } from 'react'
import { ANNOTATIONS, type AnnotationId } from '@/content/copy'
import { annotationElements } from '@/three/annotations'

/** Which side of its anchor each label sits on. */
const SIDE: Record<AnnotationId, 'left' | 'right'> = {
  band: 'right',
  cushion: 'left',
  yoke: 'right',
  driver: 'left',
  anc: 'right',
  foam: 'right',
  frame: 'left',
}

/** Labels dropped on narrow screens, where they would collide with a neighbour. */
const HIDDEN_ON_MOBILE = new Set<AnnotationId>(['cushion', 'frame'])

function Label({ id, title, detail }: { id: AnnotationId; title: string; detail: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    annotationElements.set(id, el)
    return () => {
      if (annotationElements.get(id) === el) annotationElements.delete(id)
    }
  }, [id])

  return (
    <div
      ref={ref}
      className={`annotation ${HIDDEN_ON_MOBILE.has(id) ? 'narrow:hidden' : ''}`}
      data-side={SIDE[id]}
    >
      <span className="annotation__dot" />
      <span className="annotation__leader" />
      <span className="annotation__text">
        <span className="tech block text-soft">{title}</span>
        <span className="annotation__detail tech mt-1 block text-mute normal-case tracking-[0.06em]">{detail}</span>
      </span>
    </div>
  )
}

/**
 * Labels that track points on the 3D model. They duplicate information that
 * is also present as real text in each section, so they are hidden from
 * assistive technology.
 */
export function AnnotationLayer() {
  return (
    <div aria-hidden="true" className="webgl-only pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {[...ANNOTATIONS.form, ...ANNOTATIONS.explode].map((a) => (
        <Label key={a.id} id={a.id} title={a.title} detail={a.detail} />
      ))}
    </div>
  )
}
