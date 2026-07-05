import { useEffect, useState } from 'react'
import { useGameStore } from './engine/store'
import { audio } from './audio/AudioManager'
import { categoryById, levelById, nextLevelAfter } from './content/math'
import { bandForAge } from './engine/band'
import { placementPlanFor } from './content/placement'
import AgeScreen from './screens/AgeScreen'
import NameScreen from './screens/NameScreen'
import PlacementScreen from './screens/PlacementScreen'
import Home from './screens/Home'
import CategoryScreen from './screens/CategoryScreen'
import PlayScreen from './screens/PlayScreen'
import SprintScreen from './screens/SprintScreen'
import ClearedScreen from './screens/ClearedScreen'
import GardenScreen from './screens/GardenScreen'
import ParentView from './screens/ParentView'

type Route =
  | { screen: 'home' }
  | { screen: 'name' }
  | { screen: 'placement'; age: number }
  | { screen: 'category'; categoryId: string }
  | { screen: 'play'; levelId: string }
  | { screen: 'sprint'; levelId: string }
  | { screen: 'cleared'; levelId: string; earnedDiamonds: number }
  | { screen: 'garden' }
  | { screen: 'parent' }

export default function App() {
  const [route, setRoute] = useState<Route>({ screen: 'home' })
  const muted = useGameStore((s) => s.muted)
  const age = useGameStore((s) => s.age)
  const setAge = useGameStore((s) => s.setAge)

  // Mirror the persisted mute choice into the AudioManager.
  useEffect(() => {
    audio.setMuted(muted)
  }, [muted])

  // Resume audio on the first user gesture (autoplay policies, spec §6).
  useEffect(() => {
    const unlock = () => audio.unlock()
    const opts = { once: true, passive: true } as const
    window.addEventListener('pointerdown', unlock, opts)
    window.addEventListener('keydown', unlock, opts)
    window.addEventListener('touchstart', unlock, opts)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [])

  // The grown-ups panel renders even with no age set — resetting clears the
  // age from inside it, and yanking the adult to the age gate mid-panel would
  // be hostile. They meet the gate on the way OUT (onClose → home → gate).
  if (route.screen === 'parent') {
    return <ParentView onClose={() => setRoute({ screen: 'home' })} />
  }

  // First-launch gate (also after a full reset): no age chosen → ask before
  // any child-facing screen. A grown-up can change it later in the
  // For-grown-ups panel. Ages with a placement plan (5+) and no progress yet
  // go through the quick "show me what you can do" check so they start at a
  // fitting rung.
  if (age === null) {
    return (
      <AgeScreen
        onPick={(picked) => {
          setAge(picked)
          // The name comes next; placement (if any) follows from there.
          setRoute({ screen: 'name' })
        }}
      />
    )
  }
  const band = bandForAge(age)

  if (route.screen === 'name') {
    return (
      <NameScreen
        onDone={(picked) => {
          if (picked) useGameStore.getState().setName(picked)
          const fresh = !Object.values(useGameStore.getState().progress).some(
            (p) => p.cleared,
          )
          if (fresh && placementPlanFor(age).length > 0) {
            setRoute({ screen: 'placement', age })
          } else {
            setRoute({ screen: 'home' })
          }
        }}
      />
    )
  }

  if (route.screen === 'placement') {
    return (
      <PlacementScreen age={route.age} onDone={() => setRoute({ screen: 'home' })} />
    )
  }

  const home = (
    <Home
      band={band}
      onSelectCategory={(categoryId) => setRoute({ screen: 'category', categoryId })}
      onSelectLevel={(levelId) => setRoute({ screen: 'play', levelId })}
      onOpenParent={() => setRoute({ screen: 'parent' })}
      onOpenGarden={() => setRoute({ screen: 'garden' })}
    />
  )

  if (route.screen === 'category') {
    const category = categoryById(route.categoryId)
    if (!category) return home
    return (
      <CategoryScreen
        category={category}
        onSelectLevel={(levelId) => setRoute({ screen: 'play', levelId })}
        onSelectSprint={(levelId) => setRoute({ screen: 'sprint', levelId })}
        onBack={() => setRoute({ screen: 'home' })}
      />
    )
  }

  if (route.screen === 'sprint') {
    const level = levelById(route.levelId)
    if (!level) return home
    return (
      <SprintScreen
        key={level.id}
        level={level}
        onExit={() => setRoute({ screen: 'category', categoryId: level.categoryId })}
      />
    )
  }

  if (route.screen === 'play') {
    const level = levelById(route.levelId)
    if (!level) return home
    return (
      <PlayScreen
        key={level.id} // fresh mount per level
        level={level}
        onExit={() => setRoute({ screen: 'category', categoryId: level.categoryId })}
        onCleared={(earnedDiamonds) =>
          setRoute({ screen: 'cleared', levelId: level.id, earnedDiamonds })
        }
      />
    )
  }

  if (route.screen === 'cleared') {
    const level = levelById(route.levelId)
    if (!level) return home
    const category = categoryById(level.categoryId)
    // Age-aware: an age-gated rung above this child's tier is never "next" —
    // their ladder genuinely ends where their tier ends.
    const nextLevel = nextLevelAfter(level, age)
    return (
      <ClearedScreen
        level={level}
        categoryName={category?.name ?? ''}
        earnedDiamonds={route.earnedDiamonds}
        isLast={!nextLevel}
        onSprint={() => setRoute({ screen: 'sprint', levelId: level.id })}
        onBack={() =>
          setRoute(
            // Finished the whole category → celebrate back on the meadow.
            nextLevel
              ? { screen: 'category', categoryId: level.categoryId }
              : { screen: 'home' },
          )
        }
        onNext={() =>
          setRoute(
            nextLevel
              ? { screen: 'play', levelId: nextLevel.id }
              : { screen: 'home' },
          )
        }
      />
    )
  }

  if (route.screen === 'garden') {
    return <GardenScreen onBack={() => setRoute({ screen: 'home' })} />
  }

  return home
}
