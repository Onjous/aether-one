/**
 * AETHER wordmark. The symbol is the exact superellipse used for the ear-cup
 * outline in the 3D model (n = 2.6), so the logo and product share one shape.
 */
function cupPath(cx: number, cy: number, a: number, b: number, n = 2.6, steps = 64) {
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const c = Math.cos(t)
    const s = Math.sin(t)
    const x = cx + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n)
    const y = cy + b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return pts.join(' ') + 'Z'
}

const OUTER = cupPath(12, 12, 8.4, 10.5)
const INNER = cupPath(12, 12, 4.2, 5.4)

export function CupMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d={OUTER} fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d={INNER} fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
      <circle cx="12" cy="12" r="1.6" fill="var(--color-ember)" />
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <CupMark className="h-[22px] w-[22px]" />
      <span
        className="text-[0.95rem] font-semibold tracking-[0.34em] uppercase"
        style={{ fontVariationSettings: "'wdth' 125" }}
      >
        Aether
      </span>
    </span>
  )
}
