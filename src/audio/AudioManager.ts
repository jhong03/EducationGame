/**
 * AudioManager (spec §6) — the ONLY place the game makes sound. Components call
 * this; they never touch SpeechSynthesis or Web Audio directly. That seam is
 * what lets recorded human voice-over replace TTS later without touching any
 * game code — swap the body of `speak`/`sayNumber` for clip playback and the
 * rest of the app is untouched.
 *
 * Voice quality (user feedback: "too plain and robotic") is fought on three
 * fronts, all inside this seam:
 * 1. VOICE CHOICE — devices ship many voices and the default is rarely the
 *    best. `rankVoices` prefers the modern neural/natural ones; the family
 *    can also pick a favourite in the grown-ups panel (persisted `voiceId`).
 * 2. DELIVERY STYLES — prompts are clear and steady, praise is bright and
 *    quick, comfort lines are soft and slow. One voice, many moods.
 * 3. NATURAL VARIATION — every utterance jitters rate/pitch a few percent,
 *    so a repeated "Try again!" never sounds like a sample being replayed.
 *
 * Everything is feature-detected and wrapped in try/catch: on a device with no
 * speech or no Web Audio, the game stays silent but never crashes.
 */

import { numberWord } from '../content/words'

export type SfxKind = 'good' | 'soft' | 'pop' | 'win'

/** How a line should be delivered. */
export type SpeakStyle = 'prompt' | 'praise' | 'soft' | 'count'

export interface VoiceChoice {
  id: string // voiceURI — what the store persists
  label: string // friendly, vendor-prefix-free name for the picker
}

export interface AudioManager {
  speak(text: string, style?: SpeakStyle): void // TTS now; recorded clips later
  sayNumber(n: number): void // "one".. for counting
  sfx(kind: SfxKind): void
  setMuted(muted: boolean): void
  /** Resume the AudioContext / prime TTS on the first user gesture. */
  unlock(): void
  /** Ranked English voices actually on this device, best first (≤ 6). */
  voiceChoices(): VoiceChoice[]
  /** Pick a voice by id; null returns to auto (best available). */
  setVoice(id: string | null): void
  /** Say a short line in the current voice — the settings preview. */
  preview(): void
}

/** The slice of SpeechSynthesisVoice the ranking needs (testable shape). */
export interface VoiceLike {
  voiceURI: string
  name: string
  lang: string
  localService: boolean
}

// Names the modern, natural-sounding voices tend to carry…
const QUALITY_MARKERS = ['natural', 'neural', 'premium', 'enhanced']
// …and specific families known to sound good across platforms.
const KNOWN_GOOD = ['google', 'samantha', 'aria', 'jenny', 'libby', 'sonia', 'karen', 'daniel']

/**
 * English voices, best-sounding first. Pure and exported so the heuristics
 * are pinned by tests: neural/natural markers beat known-good families beat
 * plain local voices; non-English voices never appear at all.
 */
export function rankVoices(voices: readonly VoiceLike[]): VoiceLike[] {
  const score = (v: VoiceLike): number => {
    const n = v.name.toLowerCase()
    let s = 0
    if (QUALITY_MARKERS.some((m) => n.includes(m))) s += 4
    if (KNOWN_GOOD.some((m) => n.includes(m))) s += 2
    if (v.localService) s += 1 // no network hiccups mid-sentence
    return s
  }
  return voices
    .filter((v) => v.lang.toLowerCase().startsWith('en'))
    .map((v, i) => ({ v, i }))
    .sort((a, b) => score(b.v) - score(a.v) || a.i - b.i) // stable
    .map((x) => x.v)
}

/** "Microsoft Aria Online (Natural) - English" → "Aria (Natural)". */
export function voiceLabel(name: string): string {
  return (
    name
      .replace(/^(Microsoft|Google|Apple)\s+/i, '')
      .replace(/\s+Online/i, '')
      .replace(/\s*[-–]\s*English.*$/i, '')
      .replace(/\s*\(.*(United|Great|UK|US|English).*\)\s*$/i, '')
      .trim() || name
  )
}

/** Delivery presets — the base each style jitters around. */
const STYLE_PRESETS: Record<SpeakStyle, { rate: number; pitch: number }> = {
  prompt: { rate: 0.92, pitch: 1.15 }, // clear, unhurried — the question
  praise: { rate: 1.05, pitch: 1.35 }, // bright and quick — the cheer
  soft: { rate: 0.85, pitch: 1.0 }, // gentle — comfort, never scolding
  count: { rate: 0.98, pitch: 1.2 }, // crisp — numbers land one by one
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
  private preferredId: string | null = null

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

  private allVoices(): SpeechSynthesisVoice[] {
    try {
      return window.speechSynthesis.getVoices()
    } catch {
      return []
    }
  }

  /** Resolve the active voice: the family's pick if present, else the best. */
  private loadVoice() {
    try {
      const voices = this.allVoices()
      if (!voices.length) return
      const preferred = this.preferredId
        ? voices.find((v) => v.voiceURI === this.preferredId)
        : undefined
      this.voice = preferred ?? (rankVoices(voices)[0] as SpeechSynthesisVoice | undefined) ?? voices[0]
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

  voiceChoices(): VoiceChoice[] {
    if (!this.hasSpeech()) return []
    return rankVoices(this.allVoices())
      .slice(0, 6)
      .map((v) => ({ id: v.voiceURI, label: voiceLabel(v.name) }))
  }

  setVoice(id: string | null): void {
    this.preferredId = id
    if (this.hasSpeech()) this.loadVoice()
  }

  preview(): void {
    this.speak("Hi! Let's play Number Meadow!", 'praise')
  }

  speak(text: string, style: SpeakStyle = 'prompt'): void {
    if (this.muted || !this.hasSpeech() || !text) return
    try {
      const synth = window.speechSynthesis
      synth.cancel() // latest prompt wins; no pile-up of queued speech
      // TODO: swap for recorded VO — replace this block with clip playback.
      const u = new SpeechSynthesisUtterance(text)
      const preset = STYLE_PRESETS[style]
      // ±4% humanizing jitter: the same line never plays back identically.
      const jitter = () => 1 + (Math.random() - 0.5) * 0.08
      u.rate = preset.rate * jitter()
      u.pitch = preset.pitch * jitter()
      if (this.voice) u.voice = this.voice
      synth.speak(u)
    } catch {
      /* speech unavailable — stay silent */
    }
  }

  sayNumber(n: number): void {
    this.speak(numberWord(n), 'count')
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
