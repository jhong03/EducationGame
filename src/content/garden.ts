/**
 * Garden — the reward economy's catalogue (data, not code; user-approved
 * 2026-07-05). Stars (earned by effort, 1 per correct answer) buy the everyday
 * things — plants, toys, decorations. Diamonds (earned by SKILL — mastering
 * levels and finishing chapters, see engine/rewards.ts) buy the treats: pets
 * and big builds. Nothing here has upkeep, timers, or loss: the child buys an
 * item, then places and rearranges it freely in a creative sandbox. Prices and
 * ids are stable forever (owned counts persist against the id).
 *
 * Adding an item = append one row. The engine/store never imports this file —
 * it holds an opaque `owned` map keyed by id and a `garden` layout of ids, so
 * the shop can grow without touching the spine (dependency stays engine ←
 * content, exactly like currency.ts).
 */

export type GardenKind = 'plant' | 'toy' | 'decoration' | 'pet' | 'build'
export type GardenCurrency = 'star' | 'diamond'

export interface GardenItem {
  /** Stable forever — `owned`/`garden` persist against it. */
  id: string
  name: string
  emoji: string
  kind: GardenKind
  currency: GardenCurrency
  price: number
}

/**
 * The catalogue. Guideline held by the test suite: plants & toys are always
 * STAR-priced; pets & builds are always DIAMOND-priced (the aspirational tier);
 * decorations may be either (a couple of premium diamond pieces).
 */
export const GARDEN_ITEMS: readonly GardenItem[] = [
  // 🌱 Plants — the cheapest, most plentiful things to earn.
  { id: 'plant-blossom', name: 'Blossom', emoji: '🌸', kind: 'plant', currency: 'star', price: 5 },
  { id: 'plant-tulip', name: 'Tulip', emoji: '🌷', kind: 'plant', currency: 'star', price: 6 },
  { id: 'plant-mushroom', name: 'Mushroom', emoji: '🍄', kind: 'plant', currency: 'star', price: 6 },
  { id: 'plant-fern', name: 'Fern', emoji: '🌿', kind: 'plant', currency: 'star', price: 7 },
  { id: 'plant-cactus', name: 'Cactus', emoji: '🌵', kind: 'plant', currency: 'star', price: 8 },
  { id: 'plant-sunflower', name: 'Sunflower', emoji: '🌻', kind: 'plant', currency: 'star', price: 8 },
  { id: 'plant-wheat', name: 'Wheat', emoji: '🌾', kind: 'plant', currency: 'star', price: 9 },
  { id: 'plant-rose', name: 'Rose', emoji: '🌹', kind: 'plant', currency: 'star', price: 10 },
  { id: 'plant-lotus', name: 'Lotus', emoji: '🪷', kind: 'plant', currency: 'star', price: 12 },
  { id: 'plant-tree', name: 'Tree', emoji: '🌳', kind: 'plant', currency: 'star', price: 20 },

  // 🧸 Toys — mid-priced fun.
  { id: 'toy-balloon', name: 'Balloon', emoji: '🎈', kind: 'toy', currency: 'star', price: 12 },
  { id: 'toy-yoyo', name: 'Yo-yo', emoji: '🪀', kind: 'toy', currency: 'star', price: 14 },
  { id: 'toy-ball', name: 'Ball', emoji: '⚽', kind: 'toy', currency: 'star', price: 15 },
  { id: 'toy-kite', name: 'Kite', emoji: '🪁', kind: 'toy', currency: 'star', price: 18 },
  { id: 'toy-blocks', name: 'Blocks', emoji: '🧱', kind: 'toy', currency: 'star', price: 20 },
  { id: 'toy-teddy', name: 'Teddy', emoji: '🧸', kind: 'toy', currency: 'star', price: 25 },
  { id: 'toy-sandcastle', name: 'Sandcastle', emoji: '🏰', kind: 'toy', currency: 'star', price: 30 },
  { id: 'toy-slide', name: 'Slide', emoji: '🛝', kind: 'toy', currency: 'star', price: 35 },

  // 🎀 Decorations — dress the plot. Two premium diamond pieces at the top.
  { id: 'deco-stone', name: 'Stepping stone', emoji: '🪨', kind: 'decoration', currency: 'star', price: 8 },
  { id: 'deco-nest', name: 'Bird nest', emoji: '🪺', kind: 'decoration', currency: 'star', price: 16 },
  { id: 'deco-bunting', name: 'Bunting', emoji: '🎏', kind: 'decoration', currency: 'star', price: 18 },
  { id: 'deco-lantern', name: 'Lantern', emoji: '🏮', kind: 'decoration', currency: 'star', price: 22 },
  { id: 'deco-sparkles', name: 'Fairy lights', emoji: '✨', kind: 'decoration', currency: 'star', price: 25 },
  { id: 'deco-bench', name: 'Bench', emoji: '🪑', kind: 'decoration', currency: 'star', price: 28 },
  { id: 'deco-rainbow', name: 'Rainbow', emoji: '🌈', kind: 'decoration', currency: 'star', price: 40 },
  { id: 'deco-clock', name: 'Garden clock', emoji: '🕰️', kind: 'decoration', currency: 'diamond', price: 3 },
  { id: 'deco-statue', name: 'Statue', emoji: '🗿', kind: 'decoration', currency: 'diamond', price: 4 },

  // 🐾 Pets — the everyday diamond treats; a couple cost just a diamond or two.
  { id: 'pet-bunny', name: 'Bunny', emoji: '🐰', kind: 'pet', currency: 'diamond', price: 3 },
  { id: 'pet-chick', name: 'Chick', emoji: '🐤', kind: 'pet', currency: 'diamond', price: 3 },
  { id: 'pet-frog', name: 'Frog', emoji: '🐸', kind: 'pet', currency: 'diamond', price: 4 },
  { id: 'pet-cat', name: 'Cat', emoji: '🐱', kind: 'pet', currency: 'diamond', price: 4 },
  { id: 'pet-puppy', name: 'Puppy', emoji: '🐶', kind: 'pet', currency: 'diamond', price: 4 },
  { id: 'pet-turtle', name: 'Turtle', emoji: '🐢', kind: 'pet', currency: 'diamond', price: 5 },
  { id: 'pet-butterfly', name: 'Butterfly', emoji: '🦋', kind: 'pet', currency: 'diamond', price: 5 },
  { id: 'pet-bee', name: 'Bee', emoji: '🐝', kind: 'pet', currency: 'diamond', price: 5 },
  { id: 'pet-hedgehog', name: 'Hedgehog', emoji: '🦔', kind: 'pet', currency: 'diamond', price: 6 },
  { id: 'pet-fox', name: 'Fox', emoji: '🦊', kind: 'pet', currency: 'diamond', price: 8 },
  { id: 'pet-panda', name: 'Panda', emoji: '🐼', kind: 'pet', currency: 'diamond', price: 10 },
  { id: 'pet-unicorn', name: 'Unicorn', emoji: '🦄', kind: 'pet', currency: 'diamond', price: 20 },

  // 🏡 Big builds — the aspirational saves.
  { id: 'build-tent', name: 'Tent', emoji: '⛺', kind: 'build', currency: 'diamond', price: 9 },
  { id: 'build-hut', name: 'Hut', emoji: '🛖', kind: 'build', currency: 'diamond', price: 10 },
  { id: 'build-fountain', name: 'Fountain', emoji: '⛲', kind: 'build', currency: 'diamond', price: 12 },
  { id: 'build-bridge', name: 'Bridge', emoji: '🌉', kind: 'build', currency: 'diamond', price: 14 },
  { id: 'build-cottage', name: 'Cottage', emoji: '🏡', kind: 'build', currency: 'diamond', price: 15 },
  { id: 'build-carousel', name: 'Carousel', emoji: '🎠', kind: 'build', currency: 'diamond', price: 18 },
  { id: 'build-pagoda', name: 'Pagoda', emoji: '🏯', kind: 'build', currency: 'diamond', price: 22 },
] as const

/** Shop sections, in display order (icon + label per kind). */
export const GARDEN_SECTIONS: readonly { kind: GardenKind; label: string; icon: string }[] = [
  { kind: 'plant', label: 'Plants', icon: '🌱' },
  { kind: 'pet', label: 'Pets', icon: '🐾' },
  { kind: 'toy', label: 'Toys', icon: '🧸' },
  { kind: 'decoration', label: 'Decorations', icon: '🎀' },
  { kind: 'build', label: 'Big builds', icon: '🏡' },
]

const BY_ID = new Map(GARDEN_ITEMS.map((it) => [it.id, it]))

/** Look up an item by id (undefined if a persisted id no longer exists). */
export function gardenItemById(id: string): GardenItem | undefined {
  return BY_ID.get(id)
}

/** All items of one kind, in catalogue (price) order. */
export function itemsByKind(kind: GardenKind): GardenItem[] {
  return GARDEN_ITEMS.filter((it) => it.kind === kind)
}

/** Pets get idle charm (a gentle bob + a wiggle when tapped) in the garden. */
export function isLivelyKind(kind: GardenKind): boolean {
  return kind === 'pet'
}

/**
 * Selling an owned item back to the shop returns HALF its price (rounded up,
 * so even the cheapest item refunds something) to the same wallet. The refund
 * reduces the spent counter — lifetime earned totals never inflate.
 */
export function sellRefund(item: GardenItem): number {
  return Math.ceil(item.price / 2)
}

/**
 * Placement layer. Most items sit ON the ground (height 0); a few float in the
 * air and render at this height above the spot where they're dropped. Used by
 * the 3D scene to lift floating items and by the HUD to label them.
 */
const FLOAT_HEIGHT: Record<string, number> = {
  'deco-sparkles': 0.95, // fairy lights hang in the air
  'toy-balloon': 0.9, // a balloon drifts up
}

/** The height an item floats at when placed (0 = sits on the ground). */
export function floatHeight(item: GardenItem): number {
  return FLOAT_HEIGHT[item.id] ?? 0
}

/** Does this item float in the air rather than rest on the ground? */
export function isFloating(item: GardenItem): boolean {
  return floatHeight(item) > 0
}
