import { describe, it, expect } from 'vitest'
import { rankVoices, voiceLabel, type VoiceLike } from './AudioManager'
import { VO_CLIPS, VO_LINES } from './voClips'
import { PRAISE } from '../content/words'

/**
 * The voice-quality heuristics ("too plain and robotic" feedback): the
 * ranking must reliably surface the modern natural voices a device ships,
 * and labels must read like names, not product SKUs.
 */

const v = (name: string, lang = 'en-US', localService = true): VoiceLike => ({
  voiceURI: name,
  name,
  lang,
  localService,
})

describe('rankVoices', () => {
  it('prefers natural/neural voices, then known-good families, then plain local', () => {
    const ranked = rankVoices([
      v('Basic Bob'),
      v('Google UK English Female', 'en-GB', false),
      v('Microsoft Aria Online (Natural)', 'en-US', false),
      v('Microsoft Zira', 'en-US', true),
    ])
    expect(ranked[0].name).toContain('Aria') // natural marker wins
    expect(ranked[1].name).toContain('Google') // known-good family next
  })

  it('never surfaces non-English voices', () => {
    const ranked = rankVoices([v('Hortense', 'fr-FR'), v('Bob', 'en-AU')])
    expect(ranked.map((x) => x.name)).toEqual(['Bob'])
  })

  it('keeps the device order for equal scores (stable sort)', () => {
    const ranked = rankVoices([v('Alpha'), v('Beta')])
    expect(ranked.map((x) => x.name)).toEqual(['Alpha', 'Beta'])
  })
})

describe('voiceLabel', () => {
  it('strips vendor prefixes and locale tails down to a name', () => {
    expect(voiceLabel('Microsoft Aria Online (Natural) - English (United States)')).toBe(
      'Aria (Natural)',
    )
    expect(voiceLabel('Google UK English Female')).toBe('UK English Female')
    expect(voiceLabel('Karen (English (Australia))')).toBe('Karen')
    expect(voiceLabel('Samantha')).toBe('Samantha')
  })
})

describe('VO clip manifest', () => {
  it('lines and files are unique, files are kebab mp3s under /vo/', () => {
    expect(new Set(VO_LINES.map((l) => l.text)).size).toBe(VO_LINES.length)
    expect(new Set(VO_LINES.map((l) => l.file)).size).toBe(VO_LINES.length)
    for (const line of VO_LINES) {
      expect(line.file).toMatch(/^[a-z0-9-]+\.mp3$/)
      expect(VO_CLIPS.get(line.text)).toBe(`/vo/${line.file}`)
    }
  })

  it('covers every praise line and the key fixed prompts EXACTLY as spoken', () => {
    for (const line of PRAISE) {
      expect(VO_CLIPS.has(line), line).toBe(true)
    }
    for (const line of [
      'Try again!',
      "That's okay! We'll start here.",
      'Not yet! Finish the level before it.',
      'Level complete!',
      'Wow! Off you go!',
      'How old are you?',
      "What's your name?",
    ]) {
      expect(VO_CLIPS.has(line), line).toBe(true)
    }
  })
})
