import { useGameStore } from '../engine/store'

/**
 * PlayerChip — the child's name and star count, pinned to the top bar while
 * playing (mastery and sprint). Stars tick up live as answers land, so the
 * chip doubles as in-play status. Renders nothing when no name is set — the
 * bar simply looks like it always did.
 */
export default function PlayerChip() {
  const name = useGameStore((s) => s.name)
  const stars = useGameStore((s) => s.stars)
  if (!name) return null
  return (
    <span
      role="status"
      aria-label={`${name}, ${stars} ${stars === 1 ? 'star' : 'stars'}`}
      className="flex min-w-0 items-center gap-1.5 rounded-full bg-cream/85 px-3 shadow-md backdrop-blur"
      style={{ height: 44 }}
    >
      <span
        className="truncate font-bold text-ink"
        style={{ fontSize: 14, maxWidth: 96 }}
      >
        {name}
      </span>
      <span aria-hidden="true" style={{ fontSize: 14 }}>
        ⭐
      </span>
      <span className="font-bold text-ink" style={{ fontSize: 14 }}>
        {stars}
      </span>
    </span>
  )
}
