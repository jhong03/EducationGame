# Recorded voice-over clips

Drop one mp3 per line below into THIS folder and the game plays it
automatically (missing files fall back to text-to-speech, per line — no
config, no code changes). The manifest lives in `src/audio/voClips.ts`;
keep both in sync when adding lines.

Recording notes: bright, warm, child-directed. Trim silence from both
ends. Keep praise punchy (~1s) and comfort lines gentle — "Try again!"
must sound like encouragement, never a buzzer.

| File | Line | Mood |
|---|---|---|
| `yes.mp3` | Yes! | delighted |
| `you-did-it.mp3` | You did it! | delighted |
| `great-job.mp3` | Great job! | delighted |
| `woohoo.mp3` | Woohoo! | delighted |
| `nice-counting.mp3` | Nice counting! | delighted |
| `well-done.mp3` | Well done! | delighted |
| `try-again.mp3` | Try again! | warm, gentle |
| `thats-okay.mp3` | That's okay! We'll start here. | warm, gentle |
| `not-yet.mp3` | Not yet! Finish the level before it. | warm, gentle |
| `level-complete.mp3` | Level complete! | celebratory |
| `off-you-go.mp3` | Wow! Off you go! | celebratory |
| `how-old.mp3` | How old are you? | friendly question |
| `whats-name.mp3` | What's your name? | friendly question |
