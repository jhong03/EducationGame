import { useGameStore, starBalance } from '../engine/store'

/**
 * PlayerChip — the child's name and spendable star wallet, pinned to the top
 * bar while playing (mastery and sprint). The wallet ticks up live as answers
 * land, so the chip doubles as in-play status (and matches the number shown in
 * the garden shop). Renders nothing when no name is set — the bar simply looks
 * like it always did.
 */
export default function PlayerChip() {
  const name = useGameStore((s) => s.name)
  const stars = useGameStore((s) => starBalance(s))
  if (!name) return null
  return (
    <span
      role="status"
      aria-label={`${name}, ${stars} ${stars === 1 ? 'star' : 'stars'}`}
      className="u-glass flex min-w-0 items-center gap-1.5 rounded-full px-3.5"
      style={{ height: 44 }}
    >
      <span
        className="truncate font-text font-bold text-ink"
        style={{ fontSize: 14, maxWidth: 96 }}
      >
        {name}
      </span>
      <span aria-hidden="true" style={{ fontSize: 13 }}>
        ⭐
      </span>
      <span className="font-text font-bold tabular-nums text-ink" style={{ fontSize: 14 }}>
        {stars}
      </span>
    </span>
  )
}
