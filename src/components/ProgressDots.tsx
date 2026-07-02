/**
 * ProgressDots — one dot per mastery goal, filling as the child answers
 * correctly (spec §5). Never empties: safe-failure means dots only fill.
 */

interface ProgressDotsProps {
  total: number
  filled: number
}

export default function ProgressDots({ total, filled }: ProgressDotsProps) {
  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={`${filled} of ${total} correct`}
    >
      {Array.from({ length: total }, (_, i) => {
        const isFilled = i < filled
        return (
          <span
            key={i}
            className={isFilled ? 'anim-pop' : ''}
            style={{
              width: 'clamp(16px, 4.5vw, 22px)',
              height: 'clamp(16px, 4.5vw, 22px)',
              borderRadius: '9999px',
              background: isFilled ? 'var(--sun)' : 'rgba(74,58,107,0.15)',
              boxShadow: isFilled ? '0 2px 0 rgba(233,166,59,0.9)' : 'none',
              transition: 'background 0.2s',
            }}
          />
        )
      })}
    </div>
  )
}
