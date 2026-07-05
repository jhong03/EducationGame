/**
 * The recorded voice-over manifest — the game's FIXED lines and the clip
 * file each one plays from. This doubles as the recording script: generate
 * or record one clip per row into `public/vo/<file>` (48kHz mp3, a beat of
 * silence trimmed off both ends, bright and warm) and the AudioManager
 * starts using it automatically — no other code changes, ever.
 *
 * Dynamic sentences (question prompts with numbers, "Hi {name}!",
 * "You finished {category}!") stay TTS by design: they can't be
 * pre-recorded. Keys must match the spoken text EXACTLY — that's the whole
 * contract, and it's what keeps call sites untouched.
 */

export interface VoLine {
  /** The exact string components pass to audio.speak(). */
  text: string
  /** File under public/vo/. */
  file: string
}

export const VO_LINES: readonly VoLine[] = [
  // NOTE: praise is deliberately NOT here (user direction 2026-07-05):
  // correct/wrong feedback is chime + on-screen words, never a voice.
  // Comfort & guidance — must sound WARM, never scolding
  { text: "That's okay! We'll start here.", file: 'thats-okay.mp3' },
  { text: 'Not yet! Finish the level before it.', file: 'not-yet.mp3' },
  { text: 'Wow! Off you go!', file: 'off-you-go.mp3' },
  // The big fixed prompts
  { text: 'How old are you?', file: 'how-old.mp3' },
  { text: "What's your name?", file: 'whats-name.mp3' },
] as const

/** exact spoken text → public URL of its clip. */
export const VO_CLIPS: ReadonlyMap<string, string> = new Map(
  VO_LINES.map((l) => [l.text, `/vo/${l.file}`]),
)
