import type { GardenItem, GardenKind } from '../../content/garden'

/**
 * Appearance data + sizing for the 3D garden models — kept separate from the
 * model components so the component module stays fast-refresh clean. Each
 * catalogue item maps to a low-poly archetype (variant), a palette, and a
 * relative real-world size.
 */

export type ModelVariant =
  | 'flower'
  | 'tulip'
  | 'rose'
  | 'tall-flower'
  | 'tree'
  | 'cactus'
  | 'bush'
  | 'fern'
  | 'stalk'
  | 'mushroom'
  | 'lotus'
  | 'critter'
  | 'quad'
  | 'bunny'
  | 'frog'
  | 'panda'
  | 'chick'
  | 'flyer'
  | 'bee'
  | 'shell'
  | 'horned'
  | 'spiky'
  | 'ball'
  | 'balloon'
  | 'disc'
  | 'kite'
  | 'blocks'
  | 'plush'
  | 'castle'
  | 'ramp'
  | 'rock'
  | 'bowl'
  | 'garland'
  | 'lantern'
  | 'sparkle'
  | 'bench'
  | 'arch'
  | 'pillar'
  | 'clock'
  | 'tent'
  | 'hut'
  | 'fountain'
  | 'bridge'
  | 'house'
  | 'carousel'
  | 'pagoda'

export type Ears = 'long' | 'round' | 'pointy' | 'none'
export type Tail = 'curl' | 'stub' | 'bushy'

export interface Appearance {
  variant: ModelVariant
  color: string
  accent?: string
  ears?: Ears
  /** Quadruped ('quad') pets only: which tail they wear. */
  tail?: Tail
}

const A: Record<string, Appearance> = {
  // Plants
  'plant-blossom': { variant: 'flower', color: '#6aa84f', accent: '#ff9ec4' },
  'plant-tulip': { variant: 'tulip', color: '#6aa84f', accent: '#ff6b6b' },
  'plant-mushroom': { variant: 'mushroom', color: '#e8503a', accent: '#f5ead5' },
  'plant-fern': { variant: 'fern', color: '#4f9d5b' },
  'plant-cactus': { variant: 'cactus', color: '#4c9a5a', accent: '#ff9ec4' },
  'plant-sunflower': { variant: 'tall-flower', color: '#ffcf4b', accent: '#7a4a2a' },
  'plant-wheat': { variant: 'stalk', color: '#d9a94a' },
  'plant-rose': { variant: 'rose', color: '#5f9a48', accent: '#d64550' },
  'plant-lotus': { variant: 'lotus', color: '#ff9ec4', accent: '#ffe08a' },
  'plant-tree': { variant: 'tree', color: '#5aa15c', accent: '#8a5a3c' },
  // Toys
  'toy-balloon': { variant: 'balloon', color: '#ff6b6b' },
  'toy-yoyo': { variant: 'disc', color: '#7c5cff' },
  'toy-ball': { variant: 'ball', color: '#ff8f4b' },
  'toy-kite': { variant: 'kite', color: '#4bb3ff' },
  'toy-blocks': { variant: 'blocks', color: '#ff6b6b' },
  'toy-teddy': { variant: 'plush', color: '#b07a4a' },
  'toy-sandcastle': { variant: 'castle', color: '#e6c88a' },
  'toy-slide': { variant: 'ramp', color: '#ff7aa8' },
  // Decorations
  'deco-stone': { variant: 'rock', color: '#9a958c' },
  'deco-nest': { variant: 'bowl', color: '#8a6a45', accent: '#f5ead5' },
  'deco-bunting': { variant: 'garland', color: '#ff6b6b' },
  'deco-lantern': { variant: 'lantern', color: '#c94f4f', accent: '#ffd98a' },
  'deco-sparkles': { variant: 'sparkle', color: '#ffe08a' },
  'deco-bench': { variant: 'bench', color: '#9a6a45' },
  'deco-rainbow': { variant: 'arch', color: '#ff6b6b' },
  'deco-clock': { variant: 'clock', color: '#6a5a8a', accent: '#f5ead5' },
  'deco-statue': { variant: 'pillar', color: '#cfc7bd', accent: '#cfc7bd' },
  // Pets
  'pet-bunny': { variant: 'bunny', color: '#f3ede4', accent: '#ffb4c8' },
  'pet-chick': { variant: 'chick', color: '#ffd94b', accent: '#ff8f3a' },
  'pet-frog': { variant: 'frog', color: '#6bbf59', accent: '#e7f3cf' },
  'pet-cat': { variant: 'quad', color: '#e39a4a', accent: '#f5e7d0', ears: 'pointy', tail: 'curl' },
  'pet-puppy': { variant: 'quad', color: '#c08e55', accent: '#efdfc2', ears: 'round', tail: 'stub' },
  'pet-turtle': { variant: 'shell', color: '#6bbf59', accent: '#4a7a3a' },
  'pet-butterfly': { variant: 'flyer', color: '#ff9ec4', accent: '#6a4a8a' },
  'pet-bee': { variant: 'bee', color: '#ffcf4b', accent: '#2a2018' },
  'pet-hedgehog': { variant: 'spiky', color: '#a98a5f', accent: '#5a4530' },
  'pet-fox': { variant: 'quad', color: '#e2703a', accent: '#f5ead5', ears: 'pointy', tail: 'bushy' },
  'pet-panda': { variant: 'panda', color: '#f3ede4', accent: '#2e2a28' },
  'pet-unicorn': { variant: 'horned', color: '#f6f0f7', accent: '#c9a0ff' },
  // Builds
  'build-tent': { variant: 'tent', color: '#d76a6a', accent: '#f5ead5' },
  'build-hut': { variant: 'hut', color: '#d9c29a', accent: '#8a5a3c' },
  'build-fountain': { variant: 'fountain', color: '#b8c0c4', accent: '#7fd0e0' },
  'build-bridge': { variant: 'bridge', color: '#a9784a' },
  'build-cottage': { variant: 'house', color: '#efe0c4', accent: '#c05a4a' },
  'build-carousel': { variant: 'carousel', color: '#d0d0d8', accent: '#ff7aa8' },
  'build-pagoda': { variant: 'pagoda', color: '#d9c29a', accent: '#c05a4a' },
}

const FALLBACK: Record<GardenKind, Appearance> = {
  plant: { variant: 'bush', color: '#4f9d5b' },
  toy: { variant: 'ball', color: '#ff8f4b' },
  decoration: { variant: 'rock', color: '#9a958c' },
  pet: { variant: 'critter', color: '#e39a4a', ears: 'round' },
  build: { variant: 'house', color: '#efe0c4', accent: '#c05a4a' },
}

export function appearanceFor(item: GardenItem): Appearance {
  return A[item.id] ?? FALLBACK[item.kind]
}

/**
 * Relative real-world sizing: buildings dwarf plants, which dwarf pets. Applied
 * once in the scene (a wrapping <group scale>), so the models are all authored
 * at a comfortable ~0.5u working size.
 */
export function modelScale(item: GardenItem): number {
  switch (item.id) {
    case 'plant-tree':
      return 1.6
    case 'deco-rainbow':
      return 1.9
    case 'deco-stone':
      return 0.7
    case 'deco-clock':
      return 1.05
    case 'pet-butterfly':
    case 'pet-bee':
      return 0.42
    case 'pet-unicorn':
      return 0.8 // the dream pet stands taller than the other animals
    default:
      break
  }
  switch (item.kind) {
    case 'pet':
      return 0.62
    case 'plant':
      return 0.85
    case 'toy':
      return 0.8
    case 'decoration':
      return 0.9
    case 'build':
      return 1.8
    default:
      return 1
  }
}

/** Butterflies and bees fly (aerial flutter) instead of walking the ground. */
export function isFlyer(item: GardenItem): boolean {
  const v = appearanceFor(item).variant
  return v === 'flyer' || v === 'bee'
}
