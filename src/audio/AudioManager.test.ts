import { describe, it, expect } from 'vitest'
import { rankVoices, voiceLabel, type VoiceLike } from './AudioManager'

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
