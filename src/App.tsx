import { useEffect, useState } from 'react'
import { useGameStore } from './engine/store'
import { audio } from './audio/AudioManager'
import { MAX_ORDER, levelByOrder } from './content/math'
import HomeMap from './screens/HomeMap'
import PlayScreen from './screens/PlayScreen'
import ClearedScreen from './screens/ClearedScreen'

type Route =
  | { screen: 'map' }
  | { screen: 'play'; order: number }
  | { screen: 'cleared'; order: number }

export default function App() {
  const [route, setRoute] = useState<Route>({ screen: 'map' })
  const muted = useGameStore((s) => s.muted)

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

  if (route.screen === 'play') {
    const level = levelByOrder(route.order)
    if (!level) return <HomeMap onSelectLevel={(o) => setRoute({ screen: 'play', order: o })} />
    return (
      <PlayScreen
        key={level.id} // fresh mount per level
        level={level}
        onExit={() => setRoute({ screen: 'map' })}
        onCleared={() => setRoute({ screen: 'cleared', order: level.order })}
      />
    )
  }

  if (route.screen === 'cleared') {
    const level = levelByOrder(route.order)
    if (!level) return <HomeMap onSelectLevel={(o) => setRoute({ screen: 'play', order: o })} />
    const isLast = level.order >= MAX_ORDER
    return (
      <ClearedScreen
        level={level}
        isLast={isLast}
        onBackToMap={() => setRoute({ screen: 'map' })}
        onNext={() =>
          setRoute(
            isLast
              ? { screen: 'map' }
              : { screen: 'play', order: level.order + 1 },
          )
        }
      />
    )
  }

  return (
    <HomeMap onSelectLevel={(order) => setRoute({ screen: 'play', order })} />
  )
}
