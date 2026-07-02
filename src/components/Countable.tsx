import { useState } from 'react'

/**
 * Countable — one tappable object (spec §5, the core learning moment). Tapping
 * it wiggles the object; the parent speaks the running count. Once counted it
 * wears a small number badge so the child sees quantity become numeral.
 *
 * This component only reports taps and animates; the running-count bookkeeping
 * and audio live in the PlayScreen so a single count can flow across two groups
 * (as in addition).
 */

interface CountableProps {
  emoji: string
  /** Has this object been tapped/counted yet? */
  counted: boolean
  /** The number it was counted as (shown as a badge once counted). */
  ordinal?: number
  index: number // for the staggered pop-in
  onTap: () => void
  disabled?: boolean
}

export default function Countable({
  emoji,
  counted,
  ordinal,
  index,
  onTap,
  disabled = false,
}: CountableProps) {
  // Bumped on every tap so the wiggle animation restarts each time.
  const [wiggle, setWiggle] = useState(0)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        setWiggle((w) => w + 1)
        onTap()
      }}
      className="anim-pop relative grid place-items-center rounded-full transition-transform"
      style={{
        width: 'clamp(56px, 14vw, 84px)',
        height: 'clamp(56px, 14vw, 84px)',
        animationDelay: `${index * 60}ms`,
      }}
      aria-label={counted ? `counted ${ordinal}` : 'tap to count'}
    >
      <span
        key={wiggle}
        className={wiggle > 0 ? 'anim-wiggle' : ''}
        style={{
          fontSize: 'clamp(38px, 10vw, 60px)',
          lineHeight: 1,
          filter: counted
            ? 'drop-shadow(0 3px 2px rgba(74,58,107,0.25))'
            : 'saturate(0.92)',
        }}
      >
        {emoji}
      </span>

      {counted && ordinal !== undefined && (
        <span
          className="anim-pop absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-sun font-bold text-ink shadow"
          style={{ fontSize: 15 }}
        >
          {ordinal}
        </span>
      )}
    </button>
  )
}
