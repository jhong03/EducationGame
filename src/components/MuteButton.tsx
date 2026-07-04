import { useGameStore } from '../engine/store'
import { audio } from '../audio/AudioManager'

/**
 * The global mute toggle — always visible, top-right (spec §6). Writes to the
 * persisted store; App mirrors that into the AudioManager. Muting also cancels
 * any in-flight speech (handled inside AudioManager.setMuted).
 */
export default function MuteButton({ className = '' }: { className?: string }) {
  const muted = useGameStore((s) => s.muted)
  const toggleMuted = useGameStore((s) => s.toggleMuted)

  return (
    <button
      type="button"
      onClick={() => {
        // Unlock audio on this gesture, then flip mute.
        audio.unlock()
        toggleMuted()
      }}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      className={`grid place-items-center rounded-full bg-cream/80 shadow-md backdrop-blur transition-transform active:scale-90 ${className}`}
      style={{ width: 64, height: 64, fontSize: 28 }}
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
    </button>
  )
}
