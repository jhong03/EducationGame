#!/usr/bin/env bash
# Generate the recorded-VO clip pack with Piper (local neural TTS).
#
#   bash tools/vo/generate-vo.sh
#
# Voice: en_GB-jenny_dioco-medium (warm UK female — Twinkle's voice).
# Model lives in tools/vo/models/ (gitignored, ~63MB); grab it with:
#   curl -L -o tools/vo/models/en_GB-jenny_dioco-medium.onnx \
#     https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium.onnx
#   (+ the .onnx.json beside it)
#
# The line list mirrors src/audio/voClips.ts — keep them in sync (the
# AudioManager.test manifest checks catch drift on the app side).
# Per-mood pacing rides Piper's length_scale: praise a touch quicker,
# comfort unhurried. ffmpeg trims edge silence and normalizes loudness so
# the pack sits at one consistent level.

set -euo pipefail

PIPER="${PIPER:-/c/Users/ojh20/AppData/Local/Programs/jarvis-dashboard/resources/piper/piper.exe}"
MODEL="$(dirname "$0")/models/en_GB-jenny_dioco-medium.onnx"
OUT_DIR="$(dirname "$0")/../../public/vo"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# file|length_scale|text   (0.92 = praise-quick, 1.0 = neutral, 1.06 = gentle)
LINES=(
  "yes.mp3|0.92|Yes!"
  "you-did-it.mp3|0.92|You did it!"
  "great-job.mp3|0.92|Great job!"
  "woohoo.mp3|0.92|Woohoo!"
  "nice-counting.mp3|0.92|Nice counting!"
  "well-done.mp3|0.92|Well done!"
  "try-again.mp3|1.06|Try again!"
  "thats-okay.mp3|1.06|That's okay! We'll start here."
  "not-yet.mp3|1.06|Not yet! Finish the level before it."
  "level-complete.mp3|0.92|Level complete!"
  "off-you-go.mp3|0.92|Wow! Off you go!"
  "how-old.mp3|1.0|How old are you?"
  "whats-name.mp3|1.0|What's your name?"
)

mkdir -p "$OUT_DIR"
for entry in "${LINES[@]}"; do
  file="${entry%%|*}"
  rest="${entry#*|}"
  scale="${rest%%|*}"
  text="${rest#*|}"
  wav="$TMP_DIR/${file%.mp3}.wav"

  printf '%s' "$text" | "$PIPER" \
    --model "$MODEL" \
    --output_file "$wav" \
    --length_scale "$scale" \
    --sentence_silence 0.1 >/dev/null 2>&1

  # Tight edges + one loudness for the whole pack, then small mono mp3s.
  ffmpeg -y -loglevel error -i "$wav" \
    -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-18:TP=-2" \
    -ac 1 -codec:a libmp3lame -q:a 4 "$OUT_DIR/$file"

  echo "✓ $file  ($text)"
done

echo "Done → $OUT_DIR"
