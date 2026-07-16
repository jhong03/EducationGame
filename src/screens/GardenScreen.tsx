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
  isFloating,
  sellRefund,
  type GardenItem,
} from '../content/garden'
import type { PlacedItem } from '../engine/types'
import { audio } from '../audio/AudioManager'
import MuteButton from '../components/MuteButton'
import { hasWebGL } from './garden3d/webgl'

/**
 * GardenScreen — the reward sandbox. A DOM heads-up display (header wallet,
 * tray, shop, selection actions) framing a live 3D garden: buy in the shop
 * (and SELL back for half price), hold a tray item and tap the ground to plant
 * it, or tap a placed item to SELECT it — the camera glides over and follows
 * it while an action bar offers Move / Put back. No timers, no chores,
 * nothing lost.
 *
 * The 3D scene is code-split and only mounts when WebGL is available; otherwise
 * (old devices, and the jsdom test env) a simple 2D plot stands in, so the shop
 * + economy work everywhere. The heavy three.js chunk never loads on the core
 * game path.
 */

const Garden3D = lazy(() => import('./garden3d/Garden3D'))

/** A cool gem accent for diamonds — distinct from the warm gold of stars. */
const DIAMOND = '#3f9dc4'

interface GardenScreenProps {
  onBack: () => void
}

export default function GardenScreen({ onBack }: GardenScreenProps) {
  const owned = useGameStore((s) => s.owned)
  const garden = useGameStore((s) => s.garden)
  const placeItem = useGameStore((s) => s.placeItem)
  const moveItem = useGameStore((s) => s.moveItem)
  const removeItem = useGameStore((s) => s.removeItem)
  const buyItem = useGameStore((s) => s.buyItem)
  const sellItem = useGameStore((s) => s.sellItem)
  const sellAll = useGameStore((s) => s.sellAll)
  const starWallet = useGameStore((s) => starBalance(s))
  const diamondWallet = useGameStore((s) => diamondBalance(s))

  // Selection state: holding a TRAY item (to plant) and selecting a PLACED
  // item (to move / put back) are mutually exclusive.
  const [traySel, setTraySel] = useState<string | null>(null)
  const [placedSel, setPlacedSel] = useState<string | null>(null)
  const [moveMode, setMoveMode] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [webgl] = useState(() => hasWebGL())
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  const tray = GARDEN_ITEMS.filter((it) => availableCount(owned, garden, it.id) > 0)
  const trayAvailable = traySel ? availableCount(owned, garden, traySel) : 0
  const traySelItem = traySel ? gardenItemById(traySel) : undefined
  const traySelFloats = traySelItem ? isFloating(traySelItem) : false

  // The live selection (it may have just been removed — then it's simply gone).
  const placedEntry = garden.find((p) => p.key === placedSel)
  const placedItem = placedEntry ? gardenItemById(placedEntry.itemId) : undefined

  function handleGround(x: number, z: number) {
    audio.unlock()
    if (moveMode && placedEntry) {
      moveItem(placedEntry.key, x, z)
      audio.sfx('pop')
      setMoveMode(false) // stay selected — the camera settles on the new spot
      return
    }
    if (traySel) {
      placeItem(traySel, x, z)
      audio.sfx('pop')
      if (trayAvailable <= 1) setTraySel(null)
      return
    }
    if (placedSel) setPlacedSel(null) // tapping empty ground deselects
  }

  function handleTapItem(key: string) {
    audio.unlock()
    audio.sfx('pop')
    setTraySel(null)
    setMoveMode(false)
    setPlacedSel(key)
  }

  function putBack() {
    if (placedEntry) {
      removeItem(placedEntry.key)
      audio.sfx('pop')
    }
    setPlacedSel(null)
    setMoveMode(false)
  }

  function tapTray(item: GardenItem) {
    audio.unlock()
    audio.sfx('pop')
    setPlacedSel(null)
    setMoveMode(false)
    setTraySel((cur) => (cur === item.id ? null : item.id))
  }

  const placing = Boolean(traySel) || (moveMode && Boolean(placedEntry))

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
              active={placing}
              focusKey={placedEntry?.key ?? null}
              onGround={handleGround}
              onTapItem={handleTapItem}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        ) : (
          <FallbackPlot
            garden={garden}
            active={placing}
            selectedKey={placedEntry?.key ?? null}
            onGround={handleGround}
            onTapItem={handleTapItem}
          />
        )}

        {/* Selected-item action bar: Move / Put back (or the move hint). */}
        {placedEntry && placedItem ? (
          <div
            className="u-card absolute inset-x-0 bottom-2 z-10 mx-auto flex w-fit max-w-[94%] items-center gap-2 px-3 py-2"
            role="toolbar"
            aria-label={`${placedItem.name} selected`}
          >
            {moveMode ? (
              <>
                <span className="px-1 font-text text-sm font-semibold text-ink-soft">
                  Tap the garden to move {placedItem.name} 📍
                </span>
                <button
                  type="button"
                  onClick={() => setMoveMode(false)}
                  className="rounded-xl px-3 py-2 font-text text-sm font-bold text-ink-soft"
                  style={{ background: 'var(--tint)' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span
                  className="flex items-center gap-1.5 px-1 font-text text-sm font-bold text-ink"
                  style={{ maxWidth: 150 }}
                >
                  <span aria-hidden="true" style={{ fontSize: 20 }}>
                    {placedItem.emoji}
                  </span>
                  <span className="truncate">{placedItem.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMoveMode(true)}
                  aria-label={`Move ${placedItem.name}`}
                  className="rounded-xl px-3 py-2 font-text text-sm font-bold text-cream"
                  style={{ background: 'var(--grape-grad)' }}
                >
                  📍 Move
                </button>
                <button
                  type="button"
                  onClick={putBack}
                  aria-label={`Put ${placedItem.name} back in the tray`}
                  className="rounded-xl px-3 py-2 font-text text-sm font-bold text-ink"
                  style={{ background: 'color-mix(in srgb, var(--sun) 22%, var(--cream))' }}
                >
                  🧺 Put back
                </button>
                <button
                  type="button"
                  onClick={() => setPlacedSel(null)}
                  aria-label="Deselect"
                  className="grid h-9 w-9 place-items-center rounded-xl font-text text-sm font-bold text-ink-faint"
                  style={{ background: 'var(--tint)' }}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        ) : (
          traySel && (
            <p
              className="u-glass pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full px-4 py-1.5 text-center font-text text-sm font-semibold text-ink-soft"
              role="status"
            >
              {traySelFloats
                ? 'Tap the garden to float it in the air ✨'
                : 'Tap the garden to plant it 🌱'}
            </p>
          )
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
                const picked = traySel === item.id
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
          garden={garden}
          onBuy={(item) => {
            const ok = buyItem(item.id, item.currency, item.price)
            audio.sfx(ok ? 'good' : 'soft')
            return ok
          }}
          onSell={(item) => {
            const ok = sellItem(item.id, item.currency, sellRefund(item))
            audio.sfx(ok ? 'good' : 'soft')
            return ok
          }}
          onSellAll={(sales) => {
            const sold = sellAll(sales)
            audio.sfx(sold > 0 ? 'good' : 'soft')
            return sold
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
 * A plain 2D plot for devices without WebGL (and the test env). It can't show
 * spatial placement, but it keeps the same interaction rules: tap the plot to
 * drop/move, tap a placed chip to SELECT it (the screen-level action bar then
 * offers Move / Put back).
 */
function FallbackPlot({
  garden,
  active,
  selectedKey,
  onGround,
  onTapItem,
}: {
  garden: PlacedItem[]
  active: boolean
  selectedKey: string | null
  onGround: (x: number, z: number) => void
  onTapItem: (key: string) => void
}) {
  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-y-auto p-4 pb-16">
      <button
        type="button"
        disabled={!active}
        onClick={() => {
          const n = garden.length
          onGround(((n % 5) - 2) * 1.1, (Math.floor(n / 5) - 2) * 1.1)
        }}
        aria-label="Plant here"
        className="grid min-h-[40%] w-full place-items-center rounded-3xl px-4 text-center font-text font-semibold text-ink-soft"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--leaf) 16%, var(--cream)), color-mix(in srgb, var(--clay) 12%, var(--cream)))',
          border: active
            ? '2px dashed color-mix(in srgb, var(--leaf) 55%, transparent)'
            : '1px solid var(--line)',
          opacity: active ? 1 : 0.75,
        }}
      >
        {active
          ? 'Tap here to put it down 🌱'
          : 'Pick a tray item (or select a placed one) — then tap here'}
      </button>

      {garden.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {garden.map((p) => {
            const item = gardenItemById(p.itemId)
            if (!item) return null
            const picked = p.key === selectedKey
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onTapItem(p.key)}
                aria-label={`${item.name} — tap to select`}
                aria-pressed={picked}
                className="grid h-12 w-12 place-items-center rounded-2xl transition-transform active:scale-95"
                style={{
                  fontSize: 26,
                  background: picked
                    ? 'color-mix(in srgb, var(--sun) 26%, var(--cream))'
                    : 'var(--cream)',
                  border: picked ? '2px solid var(--sun-dp)' : '1px solid var(--line)',
                  boxShadow: 'var(--e1)',
                }}
              >
                <span aria-hidden="true">{item.emoji}</span>
              </button>
            )
          })}
        </div>
      )}
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
        <span
          className="font-text font-bold tabular-nums"
          style={{ fontSize: 15, color: DIAMOND }}
        >
          {diamonds}
        </span>
      </span>
    </div>
  )
}

/**
 * Shop — a full-screen store panel over the garden. Sections by kind; each item
 * card buys one on tap, and owned items grow a SELL chip that returns half the
 * price (only spare, unplaced copies can be sold).
 */
function Shop({
  starWallet,
  diamondWallet,
  owned,
  garden,
  onBuy,
  onSell,
  onSellAll,
  onClose,
}: {
  starWallet: number
  diamondWallet: number
  owned: Record<string, number>
  garden: PlacedItem[]
  onBuy: (item: GardenItem) => boolean
  onSell: (item: GardenItem) => boolean
  onSellAll: (
    sales: { itemId: string; currency: GardenItem['currency']; refund: number }[],
  ) => number
  onClose: () => void
}) {
  // "Sell all" needs an explicit confirmation — a whole collection is at stake.
  const [confirmAll, setConfirmAll] = useState(false)

  // One entry PER SPARE COPY (placed copies are never sold).
  const sales = GARDEN_ITEMS.flatMap((item) => {
    const spare = availableCount(owned, garden, item.id)
    return spare > 0
      ? Array.from({ length: spare }, () => ({
          itemId: item.id,
          currency: item.currency,
          refund: sellRefund(item),
        }))
      : []
  })
  const starTotal = sales.reduce((n, s) => n + (s.currency === 'star' ? s.refund : 0), 0)
  const gemTotal = sales.reduce((n, s) => n + (s.currency === 'diamond' ? s.refund : 0), 0)
  const refundLabel = [
    starTotal > 0 ? `+${starTotal} ⭐` : '',
    gemTotal > 0 ? `+${gemTotal} 💎` : '',
  ]
    .filter(Boolean)
    .join(' ')

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
        {/* Sell-all — always behind a confirmation, and only ever spares. */}
        {sales.length > 0 && (
          <section aria-label="Sell everything" className="u-card flex flex-col gap-2 p-3">
            {confirmAll ? (
              <>
                <p className="font-text text-sm font-bold text-ink">
                  Sell all {sales.length} spare item{sales.length === 1 ? '' : 's'} for{' '}
                  {refundLabel}?
                </p>
                <p className="font-text text-xs font-medium text-ink-soft">
                  Anything placed in your garden stays safe — this only sells what’s
                  waiting in the tray.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSellAll(sales)
                      setConfirmAll(false)
                    }}
                    aria-label="Yes, sell them all"
                    className="rounded-xl px-4 py-2 font-text text-sm font-bold text-cream"
                    style={{ background: 'var(--coral-grad)' }}
                  >
                    ✓ Yes, sell all
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAll(false)}
                    aria-label="No, keep them"
                    className="rounded-xl px-4 py-2 font-text text-sm font-bold text-ink-soft"
                    style={{ background: 'var(--tint)' }}
                  >
                    Keep them
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 font-text text-sm font-semibold text-ink-soft">
                  {sales.length} spare item{sales.length === 1 ? '' : 's'} in the tray
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmAll(true)}
                  aria-label="Sell all spare items"
                  className="shrink-0 rounded-xl px-3.5 py-2 font-text text-sm font-bold"
                  style={{
                    color: 'var(--coral-dp)',
                    background: 'color-mix(in srgb, var(--coral) 12%, var(--cream))',
                    border: '1px solid color-mix(in srgb, var(--coral) 30%, transparent)',
                  }}
                >
                  Sell all {refundLabel}
                </button>
              </div>
            )}
          </section>
        )}

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
                const spare = availableCount(owned, garden, item.id)
                const refund = sellRefund(item)
                const coin = item.currency === 'star' ? '⭐' : '💎'
                return (
                  <div key={item.id} className="u-card relative flex flex-col items-center gap-1.5 p-2.5">
                    <button
                      type="button"
                      disabled={!affordable}
                      onClick={() => onBuy(item)}
                      aria-label={`Buy ${item.name} for ${item.price} ${item.currency}s${
                        affordable ? '' : ' — not enough yet'
                      }`}
                      className="flex w-full flex-col items-center gap-1 transition-transform active:translate-y-px"
                      style={{ opacity: affordable ? 1 : 0.5 }}
                    >
                      <span
                        aria-hidden="true"
                        style={{ fontSize: 'clamp(30px, 9vw, 40px)', lineHeight: 1 }}
                      >
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
                        <span aria-hidden="true">{coin}</span>
                        {item.price}
                      </span>
                    </button>
                    {count > 0 && (
                      <button
                        type="button"
                        disabled={spare <= 0}
                        onClick={() => onSell(item)}
                        aria-label={`Sell ${item.name} for ${refund} ${item.currency}s back${
                          spare <= 0 ? ' — all placed in the garden' : ''
                        }`}
                        title={spare <= 0 ? 'All copies are in the garden — pick one up first' : undefined}
                        className="rounded-full px-2.5 py-1 font-text font-bold transition-transform active:scale-95"
                        style={{
                          fontSize: 11,
                          color: spare > 0 ? 'var(--coral-dp)' : 'var(--ink-faint)',
                          background: 'color-mix(in srgb, var(--coral) 12%, var(--cream))',
                          border: '1px solid color-mix(in srgb, var(--coral) 30%, transparent)',
                          opacity: spare > 0 ? 1 : 0.55,
                        }}
                      >
                        Sell +{refund} {coin}
                      </button>
                    )}
                    {count > 0 && (
                      <span
                        className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full px-1 font-text font-bold text-cream"
                        style={{ fontSize: 11, background: 'var(--leaf)', boxShadow: 'var(--e1)' }}
                        aria-hidden="true"
                      >
                        ×{count}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
