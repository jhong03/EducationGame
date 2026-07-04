/**
 * AudioManager (spec §6) — the ONLY place the game makes sound. Components call
 * this; they never touch SpeechSynthesis or Web Audio directly. That seam is
 * what lets recorded human voice-over replace TTS later without touching any
 * game code — swap the body of `speak`/`sayNumber` for clip playback and the
 * rest of the app is untouched.
 *
 * Everything is feature-detected and wrapped in try/catch: on a device with no
 * speech or no Web Audio, the game stays silent but never crashes.
 */

import { numberWord } from '../content/words'

export type SfxKind = 'good' | 'soft' | 'pop' | 'win'

export interface AudioManager {
  speak(text: string): void // TTS now; recorded clips later
  sayNumber(n: number): void // "one".. for counting
  sfx(kind: SfxKind): void
  setMuted(muted: boolean): void
  /** Resume the AudioContext / prime TTS on the first user gesture. */
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
  private voice: SpeechSynthesisVoice | null = null
  private voiceReady = false

  constructor() {
    // Voices populate asynchronously in most browsers.
    if (this.hasSpeech()) {
      try {
        this.loadVoice()
        window.speechSynthesis.addEventListener?.('voiceschanged', () =>
          this.loadVoice(),
        )
      } catch {
        /* ignore — speech just stays unavailable */
      }
    }
  }

  // ---- capability probes --------------------------------------------------

  private hasSpeech(): boolean {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance === 'function'
    )
  }

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

  private loadVoice() {
    try {
      const voices = window.speechSynthesis.getVoices()
      if (!voices.length) return
      this.voice =
        voices.find((v) => v.lang.startsWith('en') && v.localService) ??
        voices.find((v) => v.lang.startsWith('en')) ??
        voices[0]
      this.voiceReady = true
    } catch {
      /* ignore */
    }
  }

  // ---- public API ---------------------------------------------------------

  unlock(): void {
    // Autoplay policies suspend the context until a user gesture; resume it.
    try {
      const ctx = this.ensureContext()
      if (ctx && ctx.state === 'suspended') void ctx.resume()
    } catch {
      /* ignore */
    }
    // Nudge the voice list to populate if it hasn't yet.
    if (this.hasSpeech() && !this.voiceReady) this.loadVoice()
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (muted && this.hasSpeech()) {
      // Cutting sound off means cutting off any in-flight speech immediately.
      try {
        window.speechSynthesis.cancel()
      } catch {
        /* ignore */
      }
    }
  }

  speak(text: string): void {
    if (this.muted || !this.hasSpeech() || !text) return
    try {
      const synth = window.speechSynthesis
      synth.cancel() // latest prompt wins; no pile-up of queued speech
      // TODO: swap for recorded VO — replace this block with clip playback.
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 0.9 // friendly, unhurried
      u.pitch = 1.2 // warm, slightly higher
      if (this.voice) u.voice = this.voice
      synth.speak(u)
    } catch {
      /* speech unavailable — stay silent */
    }
  }

  sayNumber(n: number): void {
    this.speak(numberWord(n))
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
