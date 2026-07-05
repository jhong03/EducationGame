import { lazy, Suspense, useState } from 'react'
import {
  useGameStore,
  starBalance,
  diamondBalance,
  availableCount,
} from '../engine/store'
import {
  GARDEN_ITEMS,
  GARDEN_SECTIONS,
  gardenItemById,
  itemsByKind,
  type GardenItem,
} from '../content/garden'
import { audio } from '../audio/AudioManager'
import MuteButton from '../components/MuteButton'
import { hasWebGL } from './garden3d/webgl'

/**
 * GardenScreen — the reward sandbox (user-approved 2026-07-05, upgraded to real
 * 3D 2026-07-05). A DOM heads-up display (header wallet, tray, shop) framing a
 * live 3D garden: buy in the shop, hold a tray item, tap the ground to plant
 * it, tap a placed item (or a wandering pet) to pick it back up. No timers, no
 * chores, nothing lost.
 *
 * The 3D scene is code-split and only mounts when WebGL is available; otherwise
 * (old devices, and the jsdom test env) a simple 2D plot stands in, so the shop
 * + economy work everywhere. The heavy three.js chunk never loads on the core
 * game path.
 */

const Garden3D = lazy(() => import('./garden3d/Garden3D'))

/** A cool gem accent for diamonds — distinct from the warm gold of stars. */
const DIAMOND = '#3f9dc4'
const SLOTS = 30

interface GardenScreenProps {
  onBack: () => void
}

export default function GardenScreen({ onBack }: GardenScreenProps) {
  const owned = useGameStore((s) => s.owned)
  const garden = useGameStore((s) => s.garden)
  const placeItem = useGameStore((s) => s.placeItem)
  const removeItem = useGameStore((s) => s.removeItem)
  const buyItem = useGameStore((s) => s.buyItem)
  const starWallet = useGameStore((s) => starBalance(s))
  const diamondWallet = useGameStore((s) => diamondBalance(s))

  const [selected, setSelected] = useState<string | null>(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [webgl] = useState(() => hasWebGL())
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  const tray = GARDEN_ITEMS.filter((it) => availableCount(owned, garden, it.id) > 0)
  const selectedAvailable = selected ? availableCount(owned, garden, selected) : 0

  function place(slot: number) {
    if (!selected) return
    if (garden[String(slot)] !== undefined) return // occupied
    placeItem(slot, selected)
    audio.sfx('pop')
    if (selectedAvailable <= 1) setSelected(null)
  }

  function remove(slot: number) {
    audio.unlock()
    removeItem(slot)
    audio.sfx('pop')
  }

  function tapTray(item: GardenItem) {
    audio.unlock()
    audio.sfx('pop')
    setSelected((cur) => (cur === item.id ? null : item.id))
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-sky-1 to-sky-2">
      {/* Header: back · title · wallet · mute */}
      <header className="safe-pt z-20 flex items-center justify-between gap-2 p-3 sm:p-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to the meadow"
          className="u-glass flex shrink-0 items-center gap-1.5 rounded-full px-4 transition-transform active:scale-90"
          style={{ height: 56 }}
        >
          <span aria-hidden="true" className="text-ink-soft" style={{ fontSize: 20 }}>
            ‹
          </span>
          <span className="hidden font-text font-semibold text-ink-soft sm:inline">Meadow</span>
        </button>

        <h1
          className="truncate font-bold text-ink"
          style={{ fontSize: 'clamp(19px, 5vw, 26px)', letterSpacing: '-0.01em' }}
        >
          🌻 My Garden
        </h1>

        <div className="flex items-center gap-2">
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() =>
                useGameStore.setState((s) => ({
                  stars: s.stars + 100000,
                  diamonds: s.diamonds + 100000,
                }))
              }
              aria-label="DEV: grant currency"
              title="DEV only — grant 100k of each (never ships)"
              className="u-glass grid shrink-0 place-items-center rounded-full text-ink-soft transition-transform active:scale-90"
              style={{ width: 44, height: 44, fontSize: 18 }}
            >
              🔧
            </button>
          )}
          <Wallet stars={starWallet} diamonds={diamondWallet} />
          <MuteButton />
        </div>
      </header>

      {/* The garden — real 3D where supported, a simple plot where not. */}
      <main className="relative z-0 min-h-0 flex-1">
        {webgl ? (
          <Suspense fallback={<GardenLoading />}>
            <Garden3D
              garden={garden}
              selected={selected}
              onPlace={place}
              onRemove={remove}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        ) : (
          <FallbackPlot garden={garden} selected={selected} onPlace={place} onRemove={remove} />
        )}

        {selected && (
          <p
            className="u-glass pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full px-4 py-1.5 text-center font-text text-sm font-semibold text-ink-soft"
            role="status"
          >
            Tap the garden to plant it 🌱
          </p>
        )}
      </main>

      {/* Bottom bar: Shop + the tray of owned-but-unplaced items */}
      <div className="safe-pb z-20 border-t border-[color:var(--line)] bg-sky-1/85 px-3 pt-2 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-md items-center gap-2">
          <button
            type="button"
            onClick={() => {
              audio.unlock()
              audio.sfx('pop')
              setShopOpen(true)
            }}
            aria-label="Open the shop"
            className="flex shrink-0 items-center gap-2 rounded-2xl px-4 font-bold text-cream transition-all active:translate-y-0.5"
            style={{
              height: 56,
              background: 'var(--grape-grad)',
              boxShadow:
                '0 5px 14px rgba(46,35,64,0.18), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -3px 0 var(--grape-dp)',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 20 }}>
              🛍️
            </span>
            Shop
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
            {tray.length === 0 ? (
              <span className="px-1 font-text text-sm font-medium text-ink-faint">
                Nothing to place yet
              </span>
            ) : (
              tray.map((item) => {
                const spare = availableCount(owned, garden, item.id)
                const picked = selected === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => tapTray(item)}
                    aria-label={`${item.name}, ${spare} to place${picked ? ', selected' : ''}`}
                    aria-pressed={picked}
                    className="relative grid shrink-0 place-items-center rounded-2xl transition-transform active:scale-95"
                    style={{
                      width: 52,
                      height: 52,
                      fontSize: 26,
                      background: picked
                        ? 'color-mix(in srgb, var(--leaf) 26%, var(--cream))'
                        : 'var(--cream)',
                      border: picked ? '2px solid var(--leaf)' : '1px solid var(--line)',
                      boxShadow: 'var(--e1)',
                    }}
                  >
                    <span aria-hidden="true">{item.emoji}</span>
                    {spare > 1 && (
                      <span
                        className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 font-text font-bold text-cream"
                        style={{ fontSize: 11, background: 'var(--ink)' }}
                        aria-hidden="true"
                      >
                        {spare}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {shopOpen && (
        <Shop
          starWallet={starWallet}
          diamondWallet={diamondWallet}
          owned={owned}
          onBuy={(item) => {
            const ok = buyItem(item.id, item.currency, item.price)
            audio.sfx(ok ? 'good' : 'soft')
            return ok
          }}
          onClose={() => setShopOpen(false)}
        />
      )}
    </div>
  )
}

function GardenLoading() {
  return (
    <div className="grid h-full w-full place-items-center">
      <p className="font-text text-sm font-semibold text-ink-soft">Growing your garden… 🌱</p>
    </div>
  )
}

/**
 * A plain 2D plot for devices without WebGL (and the test env): the same
 * tap-to-place / tap-to-lift model as the 3D scene, so the garden is fully
 * usable everywhere.
 */
function FallbackPlot({
  garden,
  selected,
  onPlace,
  onRemove,
}: {
  garden: Record<string, string>
  selected: string | null
  onPlace: (slot: number) => void
  onRemove: (slot: number) => void
}) {
  return (
    <div className="h-full w-full overflow-y-auto px-4 py-3">
      <div
        className="mx-auto grid w-full max-w-md gap-2 rounded-3xl p-3"
        style={{
          gridTemplateColumns: 'repeat(5, 1fr)',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--leaf) 14%, var(--cream)), color-mix(in srgb, var(--clay) 12%, var(--cream)))',
          border: '1px solid var(--line)',
        }}
      >
        {Array.from({ length: SLOTS }, (_, slot) => {
          const item = gardenItemById(garden[String(slot)] ?? '')
          return (
            <button
              key={slot}
              type="button"
              onClick={() => (item ? onRemove(slot) : onPlace(slot))}
              aria-label={item ? `${item.name} — tap to pick up` : 'empty plot'}
              className="grid aspect-square place-items-center rounded-xl transition-transform active:scale-95"
              style={{
                background: item ? 'rgba(255,253,248,0.55)' : 'var(--tint)',
                border: selected && !item ? '2px dashed color-mix(in srgb, var(--leaf) 55%, transparent)' : '1px solid transparent',
              }}
            >
              {item && (
                <span aria-hidden="true" style={{ fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 }}>
                  {item.emoji}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** The ⭐ / 💎 wallet pill shown in headers. */
function Wallet({ stars, diamonds }: { stars: number; diamonds: number }) {
  return (
    <div
      className="u-glass flex items-center gap-2.5 rounded-full px-3.5"
      style={{ height: 44 }}
      role="img"
      aria-label={`${stars} stars, ${diamonds} diamonds to spend`}
    >
      <span className="flex items-center gap-1">
        <span aria-hidden="true" style={{ fontSize: 15 }}>
          ⭐
        </span>
        <span className="font-text font-bold tabular-nums text-ink" style={{ fontSize: 15 }}>
          {stars}
        </span>
      </span>
      <span className="flex items-center gap-1">
        <span aria-hidden="true" style={{ fontSize: 14 }}>
          💎
        </span>
        <span className="font-text font-bold tabular-nums" style={{ fontSize: 15, color: DIAMOND }}>
          {diamonds}
        </span>
      </span>
    </div>
  )
}

/**
 * Shop — a full-screen store panel over the garden. Sections by kind; each item
 * is a card that buys one on tap (dimmed + inert when the matching wallet can't
 * afford it). Owned counts show as a badge.
 */
function Shop({
  starWallet,
  diamondWallet,
  owned,
  onBuy,
  onClose,
}: {
  starWallet: number
  diamondWallet: number
  owned: Record<string, number>
  onBuy: (item: GardenItem) => boolean
  onClose: () => void
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-gradient-to-b from-sky-1 to-sky-2">
      <header className="safe-pt z-10 flex items-center justify-between gap-2 border-b border-[color:var(--line)] bg-sky-1/85 p-3 backdrop-blur-lg sm:p-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the shop"
          className="u-glass flex shrink-0 items-center gap-1.5 rounded-full px-4 transition-transform active:scale-90"
          style={{ height: 56 }}
        >
          <span aria-hidden="true" className="text-ink-soft" style={{ fontSize: 20 }}>
            ‹
          </span>
          <span className="hidden font-text font-semibold text-ink-soft sm:inline">Garden</span>
        </button>
        <h1
          className="font-bold text-ink"
          style={{ fontSize: 'clamp(19px, 5vw, 26px)', letterSpacing: '-0.01em' }}
        >
          🛍️ Shop
        </h1>
        <Wallet stars={starWallet} diamonds={diamondWallet} />
      </header>

      <main className="safe-pb mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 overflow-y-auto p-4">
        {GARDEN_SECTIONS.map((section) => (
          <section key={section.kind} aria-label={section.label}>
            <p className="u-eyebrow mb-2 flex items-center gap-1.5 px-1" style={{ fontSize: 11 }}>
              <span aria-hidden="true">{section.icon}</span> {section.label}
            </p>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {itemsByKind(section.kind).map((item) => {
                const wallet = item.currency === 'star' ? starWallet : diamondWallet
                const affordable = wallet >= item.price
                const count = owned[item.id] ?? 0
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!affordable}
                    onClick={() => onBuy(item)}
                    aria-label={`Buy ${item.name} for ${item.price} ${item.currency}s${
                      affordable ? '' : ' — not enough yet'
                    }`}
                    className="u-card relative flex flex-col items-center gap-1 p-2.5 transition-transform active:translate-y-px"
                    style={{ opacity: affordable ? 1 : 0.5 }}
                  >
                    <span aria-hidden="true" style={{ fontSize: 'clamp(30px, 9vw, 40px)', lineHeight: 1 }}>
                      {item.emoji}
                    </span>
                    <span
                      className="truncate font-text font-semibold text-ink"
                      style={{ fontSize: 12, maxWidth: '100%' }}
                    >
                      {item.name}
                    </span>
                    <span
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 font-text font-bold"
                      style={{
                        fontSize: 12,
                        background:
                          item.currency === 'star'
                            ? 'color-mix(in srgb, var(--sun) 20%, var(--cream))'
                            : `color-mix(in srgb, ${DIAMOND} 20%, var(--cream))`,
                        color: 'var(--ink)',
                      }}
                    >
                      <span aria-hidden="true">{item.currency === 'star' ? '⭐' : '💎'}</span>
                      {item.price}
                    </span>
                    {count > 0 && (
                      <span
                        className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full px-1 font-text font-bold text-cream"
                        style={{ fontSize: 11, background: 'var(--leaf)', boxShadow: 'var(--e1)' }}
                        aria-hidden="true"
                      >
                        ×{count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
