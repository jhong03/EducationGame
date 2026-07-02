import { useGameStore, hasCleared, isUnlocked } from '../engine/store'
import { TRAIL } from '../content/math'
import { audio } from '../audio/AudioManager'
import MuteButton from '../components/MuteButton'
import Twinkle from '../components/Twinkle'

/**
 * Home / Trail map (spec §5). A winding dotted path climbing a green hill with
 * one node per level. Nodes are locked (grey 🔒, not tappable) or open (its
 * icon, gently glowing). A star counter sits top-left; mute top-right.
 */

interface HomeMapProps {
  onSelectLevel: (order: number) => void
}

// Node anchor points along the path, in a 0–100 box (x = %width, y = %height).
// The dotted <path> below is drawn in the same coordinate space with
// preserveAspectRatio="none", so points and nodes always line up.
const NODE_POS = [
  { x: 22, y: 84 },
  { x: 62, y: 71 },
  { x: 30, y: 55 },
  { x: 70, y: 39 },
  { x: 44, y: 19 },
]

export default function HomeMap({ onSelectLevel }: HomeMapProps) {
  const unlockedOrder = useGameStore((s) => s.unlockedOrder)
  const progress = useGameStore((s) => s.progress)
  const stars = useGameStore((s) => s.stars)

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2">
      {/* Sun — a real circle (kept out of the stretched SVG below). */}
      <div
        className="absolute z-0 rounded-full"
        style={{
          top: '13%',
          right: '7%',
          width: 'clamp(56px, 14vw, 96px)',
          height: 'clamp(56px, 14vw, 96px)',
          background: 'var(--sun)',
          opacity: 0.9,
          filter: 'blur(0.5px)',
        }}
        aria-hidden="true"
      />

      {/* Scenery: hills and the dotted trail (stretched to fill; matches nodes). */}
      <svg
        className="absolute inset-0 z-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 70 Q30 58 55 66 Q80 73 100 62 L100 100 L0 100 Z" fill="var(--leaf)" />
        <path d="M0 82 Q35 72 60 80 Q82 86 100 78 L100 100 L0 100 Z" fill="var(--leaf-dp)" />
        <path
          d="M22 84 Q45 80 62 71 Q40 62 30 55 Q55 48 70 39 Q52 30 44 19"
          fill="none"
          stroke="var(--cream)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray="0.2 4"
          opacity="0.9"
        />
      </svg>

      {/* Top bar: star counter + mute. */}
      <div className="safe-pt absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
        <div
          className="flex items-center gap-2 rounded-full bg-cream/80 px-4 py-2 shadow-md backdrop-blur"
          role="img"
          aria-label={`${stars} stars`}
        >
          <span style={{ fontSize: 24 }} aria-hidden="true">
            ⭐
          </span>
          <span className="font-bold text-ink" style={{ fontSize: 22 }}>
            {stars}
          </span>
        </div>
        <MuteButton />
      </div>

      {/* Title */}
      <h1
        className="absolute inset-x-0 top-20 z-10 text-center font-bold text-ink drop-shadow-sm"
        style={{ fontSize: 'clamp(28px, 7vw, 44px)' }}
      >
        Number Meadow
      </h1>

      {/* Twinkle greets from the hill. */}
      <div className="absolute z-10" style={{ left: '6%', bottom: '4%' }}>
        <Twinkle mood="happy" size={110} />
      </div>

      {/* Level nodes */}
      {TRAIL.map((level, i) => {
        const pos = NODE_POS[i] ?? { x: 50, y: 50 }
        const unlocked = isUnlocked(level.order, unlockedOrder)
        const cleared = hasCleared(progress, level.id)
        const glow = unlocked && !cleared

        return (
          <button
            key={level.id}
            type="button"
            disabled={!unlocked}
            onClick={() => {
              if (!unlocked) return
              audio.unlock()
              audio.sfx('pop')
              onSelectLevel(level.order)
            }}
            aria-label={
              unlocked ? `${level.name}` : `${level.name}, locked`
            }
            className={`absolute z-10 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-transform ${
              unlocked ? 'active:scale-90' : 'cursor-not-allowed'
            } ${glow ? 'anim-glow' : ''}`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: 'clamp(66px, 17vw, 92px)',
              height: 'clamp(66px, 17vw, 92px)',
              background: unlocked ? 'var(--grape)' : 'var(--locked)',
              boxShadow: glow
                ? undefined
                : `0 6px 0 ${unlocked ? 'var(--grape-dp)' : 'var(--locked-dp)'}`,
              border: '4px solid var(--cream)',
            }}
          >
            <span
              aria-hidden="true"
              style={{ fontSize: 'clamp(30px, 8vw, 42px)', lineHeight: 1 }}
            >
              {unlocked ? level.icon : '🔒'}
            </span>
            {cleared && (
              <span
                className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-sun text-ink shadow"
                style={{ fontSize: 16 }}
                aria-hidden="true"
              >
                ⭐
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
