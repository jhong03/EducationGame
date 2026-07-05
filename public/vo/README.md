# Recorded voice-over clips

Drop one mp3 per line below into THIS folder and the game plays it
automatically (missing files fall back to text-to-speech, per line — no
config, no code changes). The manifest lives in `src/audio/voClips.ts`;
keep both in sync when adding lines. Regenerate with
`bash tools/vo/generate-vo.sh` (Piper).

Praise is deliberately NOT voiced (user direction 2026-07-05): correct
and wrong answers get chimes plus on-screen words. Only guidance lines
and the big fixed prompts speak.

Recording notes: bright, warm, child-directed. Trim silence from both
ends; comfort lines must sound like encouragement, never a buzzer.

| File | Line | Mood |
|---|---|---|
| `thats-okay.mp3` | That's okay! We'll start here. | warm, gentle |
| `not-yet.mp3` | Not yet! Finish the level before it. | warm, gentle |
| `off-you-go.mp3` | Wow! Off you go! | celebratory |
| `how-old.mp3` | How old are you? | friendly question |
| `whats-name.mp3` | What's your name? | friendly question |
