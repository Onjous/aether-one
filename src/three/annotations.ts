import type { Object3D } from 'three'
import type { AnnotationId } from '@/content/copy'

/**
 * Bridges 3D anchor points on the model to DOM labels in the overlay.
 * The model registers anchors, the overlay registers elements, and a single
 * projector inside the render loop positions each element every frame.
 */
export const annotationAnchors = new Map<AnnotationId, Object3D>()
export const annotationElements = new Map<AnnotationId, HTMLElement>()
