import { useMemo } from 'react'

/**
 * Confetti — a celebratory burst on a correct answer / level clear (spec §5).
 * Increment `fire` to launch a new burst; pieces fall once and settle
 * off-screen. Pure CSS keyframes, so it goes still under reduced motion.
 */

interface ConfettiProps {
  fire: number // bump to trigger a burst
  pieces?: number
}

const COLORS = [
  'var(--sun)',
  'var(--coral)',
  'var(--grape)',
  'var(--leaf)',
  'var(--sky-2)',
]

export default function Confetti({ fire, pieces = 26 }: ConfettiProps) {
  const bits = useMemo(() => {
    if (fire <= 0) return []
    return Array.from({ length: pieces }, (_, i) => ({
      key: `${fire}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.25,
      duration: 1.6 + Math.random() * 1.1,
      size: 8 + Math.random() * 8,
      color: COLORS[i % COLORS.length],
      rounded: Math.random() > 0.5,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fire])

  if (!bits.length) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      {bits.map((b) => (
        <span
          key={b.key}
          className="anim-confetti absolute top-0"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size * 1.3,
            background: b.color,
            borderRadius: b.rounded ? '9999px' : '2px',
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
