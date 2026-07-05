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
              width: 'clamp(14px, 4vw, 19px)',
              height: 'clamp(14px, 4vw, 19px)',
              borderRadius: '9999px',
              background: isFilled ? 'var(--sun-grad)' : 'var(--line-strong)',
              boxShadow: isFilled ? '0 1px 3px rgba(197,137,31,0.5)' : 'none',
              transition: 'background 0.2s',
            }}
          />
        )
      })}
    </div>
  )
}
