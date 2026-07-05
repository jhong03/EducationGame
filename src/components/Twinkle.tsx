/**
 * Twinkle — the star guide (spec §5). A hand-built SVG star with a face and
 * three moods:
 *   happy  → gentle idle bob
 *   cheer  → bounce/scale on a correct answer
 *   sad    → encouraging frown + gentle jitter on a wrong answer
 *
 * Redrawn for the warm-premium look: reads its colours from the theme tokens,
 * carries a soft radial sheen and a gentle drop shadow for depth, and wears a
 * calmer, cleaner face — a friendly guide, not a cartoon sticker.
 *
 * `beat` lets a parent replay the same one-shot mood (e.g. cheer twice in a
 * row): bump it and the SVG remounts, restarting the animation.
 */

export type TwinkleMood = 'happy' | 'cheer' | 'sad'

interface TwinkleProps {
  mood?: TwinkleMood
  beat?: number
  size?: number
  className?: string
}

const STAR =
  'M0 -70 L20 -24 L70 -20 L31 11 L44 61 L0 33 L-44 61 L-31 11 L-70 -20 L-20 -24 Z'

function Face({ mood }: { mood: TwinkleMood }) {
  return (
    <g>
      {mood === 'cheer' ? (
        // happy closed-arc eyes (^_^)
        <>
          <path d="M-34 -8 Q-24 -18 -14 -8" fill="none" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" />
          <path d="M14 -8 Q24 -18 34 -8" fill="none" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" />
        </>
      ) : (
        // round eyes with a glint
        <>
          <circle cx="-24" cy="-6" r="9.5" fill="var(--ink)" />
          <circle cx="24" cy="-6" r="9.5" fill="var(--ink)" />
          <circle cx="-20" cy="-10" r="3.2" fill="var(--cream)" />
          <circle cx="28" cy="-10" r="3.2" fill="var(--cream)" />
        </>
      )}

      {/* rosy cheeks */}
      <circle cx="-44" cy="14" r="7.5" fill="var(--coral)" opacity="0.5" />
      <circle cx="44" cy="14" r="7.5" fill="var(--coral)" opacity="0.5" />

      {/* mouth per mood */}
      {mood === 'sad' ? (
        <path d="M-18 32 Q0 16 18 32" fill="none" stroke="var(--ink)" strokeWidth="7" strokeLinecap="round" />
      ) : mood === 'cheer' ? (
        <path d="M-24 14 Q0 50 24 14 Z" fill="var(--ink)" />
      ) : (
        <path d="M-18 18 Q0 36 18 18" fill="none" stroke="var(--ink)" strokeWidth="7" strokeLinecap="round" />
      )}
    </g>
  )
}

export default function Twinkle({
  mood = 'happy',
  beat = 0,
  size = 140,
  className = '',
}: TwinkleProps) {
  const animClass =
    mood === 'cheer' ? 'anim-cheer' : mood === 'sad' ? 'anim-shake' : 'anim-bob'

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        key={`${mood}-${beat}`}
        className={animClass}
        viewBox="-90 -90 180 180"
        width={size}
        height={size}
        style={{
          transformOrigin: 'center',
          overflow: 'visible',
          filter: 'drop-shadow(0 6px 10px rgba(46,35,64,0.16))',
        }}
      >
        <defs>
          <radialGradient id="twinkle-sheen" cx="42%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#FCD986" />
            <stop offset="60%" stopColor="var(--sun)" />
            <stop offset="100%" stopColor="#DDA034" />
          </radialGradient>
        </defs>
        <path
          d={STAR}
          fill="url(#twinkle-sheen)"
          stroke="var(--sun-dp)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <Face mood={mood} />
      </svg>
    </div>
  )
}
