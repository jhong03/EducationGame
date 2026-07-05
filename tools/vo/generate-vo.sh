#!/usr/bin/env bash
# Generate the recorded-VO clip pack with Piper (local neural TTS).
#
#   bash tools/vo/generate-vo.sh
#
# Voice: en_GB-jenny_dioco-medium, ENERGIZED (user feedback: default
# delivery was "way too robotic"). Two stages make her a playmate:
#
# 1. Piper prosody: noise_scale/noise_w well above defaults (more pitch
#    movement, more rhythm variance) and mood-based pacing.
# 2. ffmpeg character chain: a deliberate FORMANT-LIFTING pitch-up
#    (asetrate — raises the whole voice younger, the cartoon-guide sound;
#    rubberband would keep her adult), net tempo lift, treble sparkle,
#    punchy compression, then one loudness for the pack.
#
# Model lives in tools/vo/models/ (gitignored, ~63MB); grab it with:
#   curl -L -o tools/vo/models/en_GB-jenny_dioco-medium.onnx \
#     https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium.onnx
#   (+ the .onnx.json beside it)
#
# The line list mirrors src/audio/voClips.ts — keep them in sync (the
# AudioManager.test manifest checks catch drift on the app side). The
# SPOKEN text may differ slightly from the app key (e.g. "Woo-hoo!" reads
# better) — the app key is the left column's FILE, never the wording here.

set -euo pipefail

PIPER="${PIPER:-/c/Users/ojh20/AppData/Local/Programs/jarvis-dashboard/resources/piper/piper.exe}"
MODEL="$(dirname "$0")/models/en_GB-jenny_dioco-medium.onnx"
OUT_DIR="$(dirname "$0")/../../public/vo"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# Mood presets: piper length/noise/noise_w + post pitch factor & net tempo.
#   cheer : snappy, big pitch movement, lifted +~2.7 semitones, 6% quicker
#   gentle: unhurried but alive, lifted +~1.6 semitones
#   ask   : friendly question energy, in between
preset() {
  case "$1" in
    cheer)  echo "0.82 0.85 0.95 1.17 1.06" ;;
    gentle) echo "1.00 0.80 0.90 1.10 1.00" ;;
    ask)    echo "0.90 0.80 0.90 1.13 1.03" ;;
  esac
}

# file|mood|spoken text
# (Praise lines were retired 2026-07-05 — correct/wrong feedback is chime +
# on-screen words by user direction; only guidance and prompts are voiced.)
LINES=(
  "thats-okay.mp3|gentle|That's okay! We'll start here."
  "not-yet.mp3|gentle|Not yet! Finish the level before it."
  "off-you-go.mp3|cheer|Wow! Off you go!"
  "how-old.mp3|ask|How old are you?"
  "whats-name.mp3|ask|What's your name?"
)

mkdir -p "$OUT_DIR"
for entry in "${LINES[@]}"; do
  file="${entry%%|*}"
  rest="${entry#*|}"
  mood="${rest%%|*}"
  text="${rest#*|}"
  read -r scale noise noisew pitchf tempo <<<"$(preset "$mood")"
  wav="$TMP_DIR/${file%.mp3}.wav"

  printf '%s' "$text" | "$PIPER" \
    --model "$MODEL" \
    --output_file "$wav" \
    --length_scale "$scale" \
    --noise_scale "$noise" \
    --noise_w "$noisew" \
    --sentence_silence 0.05 >/dev/null 2>&1

  # Character chain: trim edges → formant-lifting pitch-up (asetrate) with
  # tempo compensation folded into the net tempo → sparkle → punch → level.
  sr=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of csv=p=0 "$wav")
  atempo=$(awk "BEGIN { printf \"%.5f\", $tempo / $pitchf }")
  ffmpeg -y -loglevel error -i "$wav" \
    -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,asetrate=${sr}*${pitchf},aresample=48000,atempo=${atempo},treble=g=3:f=3800,acompressor=threshold=-16dB:ratio=3:attack=5:release=120:makeup=2,loudnorm=I=-16:TP=-1.5" \
    -ac 1 -codec:a libmp3lame -q:a 4 "$OUT_DIR/$file"

  echo "✓ $file  [$mood]  ($text)"
done

echo "Done → $OUT_DIR"
