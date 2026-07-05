/**
 * AudioManager (spec §6) — the ONLY place the game makes sound. Components
 * call this; they never touch Web Audio directly.
 *
 * The game is deliberately VOICELESS (user direction 2026-07-05): every
 * instruction is printed on screen, feedback is chimes plus on-screen words,
 * and counting shows its numbers visually. What remains here is the small
 * synthesized SFX palette — and because this seam is still the single door
 * to sound, a voice layer could return one day without touching game code.
 *
 * Everything is feature-detected and wrapped in try/catch: on a device with
 * no Web Audio, the game stays silent but never crashes.
 */

export type SfxKind = 'good' | 'soft' | 'pop' | 'win'

export interface AudioManager {
  sfx(kind: SfxKind): void
  setMuted(muted: boolean): void
  /** Resume the AudioContext on the first user gesture (autoplay policies). */
  unlock(): void
}

/** Simple gain-enveloped note recipes for each cue (frequencies in Hz). */
const SFX_NOTES: Record<SfxKind, Array<{ f: number; t: number; d: number }>> = {
  // happy rising chime (C5–E5–G5)
  good: [
    { f: 523.25, t: 0, d: 0.12 },
    { f: 659.25, t: 0.09, d: 0.12 },
    { f: 783.99, t: 0.18, d: 0.16 },
  ],
  // gentle, non-harsh low "boop" for a wrong answer
  soft: [{ f: 311.13, t: 0, d: 0.22 }],
  // short bright blip when an object is tapped / pops in
  pop: [{ f: 880, t: 0, d: 0.07 }],
  // celebratory arpeggio (C–E–G–C)
  win: [
    { f: 523.25, t: 0, d: 0.14 },
    { f: 659.25, t: 0.12, d: 0.14 },
    { f: 783.99, t: 0.24, d: 0.14 },
    { f: 1046.5, t: 0.36, d: 0.28 },
  ],
}

type AudioContextCtor = typeof AudioContext

class WebAudioManager implements AudioManager {
  private muted = false
  private ctx: AudioContext | null = null

  private getAudioCtor(): AudioContextCtor | null {
    if (typeof window === 'undefined') return null
    const w = window as unknown as {
      AudioContext?: AudioContextCtor
      webkitAudioContext?: AudioContextCtor
    }
    return w.AudioContext ?? w.webkitAudioContext ?? null
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx
    const Ctor = this.getAudioCtor()
    if (!Ctor) return null
    try {
      this.ctx = new Ctor()
    } catch {
      this.ctx = null
    }
    return this.ctx
  }

  unlock(): void {
    try {
      const ctx = this.ensureContext()
      if (ctx && ctx.state === 'suspended') void ctx.resume()
    } catch {
      /* ignore */
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  sfx(kind: SfxKind): void {
    if (this.muted) return
    const ctx = this.ensureContext()
    if (!ctx) return
    try {
      if (ctx.state === 'suspended') void ctx.resume()
      const now = ctx.currentTime
      for (const note of SFX_NOTES[kind]) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = note.f
        // Quick attack, smooth decay → no clicks, gentle on the ears.
        const start = now + note.t
        const peak = kind === 'soft' ? 0.18 : 0.25
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + note.d)
        osc.connect(gain).connect(ctx.destination)
        osc.start(start)
        osc.stop(start + note.d + 0.02)
      }
    } catch {
      /* Web Audio unavailable — stay silent */
    }
  }
}

/** The app-wide singleton the whole game talks to. */
export const audio: AudioManager = new WebAudioManager()
