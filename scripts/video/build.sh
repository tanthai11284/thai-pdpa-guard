#!/usr/bin/env bash
# Usage: bash scripts/video/build.sh <take1.mp4> <take2.mp4>
# take1 = long recording (list view + settings), take2 = paste → mask → AI reply
set -euo pipefail
A="$1"; B="$2"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BLD="$ROOT/store/video/build"; OUT="$ROOT/store/video"
mkdir -p "$BLD"
ENC=(-c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -an)
BG=0x0b1020

# name src start dur crop speed freeze  (crop "" = full frame; freeze = seconds to hold last frame)
SEGS=(
  "s1|$B|2.6|2.8||1|0.6|c1"
  "s2|$A|103.2|4.0|960:540:600:130|1|0|c2"
  "s3|$B|5.4|1.6||1|0|c3"
  "s4|$B|7.0|0.04||1|2.6|c4"
  "s5|$B|10.4|11.0||1.2|1.2|c5"
  "s6|$A|222.0|4.0||1|0|c6"
)

for s in "${SEGS[@]}"; do
  IFS='|' read -r name src ss dur crop speed hold cap <<<"$s"
  base="setpts=PTS/$speed"
  [ "$hold" != "0" ] && base="$base,tpad=stop_mode=clone:stop_duration=$hold"
  if [ -n "$crop" ]; then
    h="crop=$crop,scale=1920:1080"
    v="crop=$crop,scale=1080:-2,pad=1080:1920:0:760:color=$BG"
  else
    h="scale=1920:-2,pad=1920:1080:0:0:color=$BG"
    v="crop=1120:ih:580:0,scale=1080:-2,pad=1080:1920:0:540:color=$BG"
  fi
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$src" -i "$BLD/$cap-h.png" \
    -filter_complex "[0:v]$base,$h[b];[b][1:v]overlay=0:0" "${ENC[@]}" "$BLD/$name-h.mp4"
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$src" -i "$BLD/$cap-v.png" \
    -filter_complex "[0:v]$base,$v[b];[b][1:v]overlay=0:0" "${ENC[@]}" "$BLD/$name-v.mp4"
  echo "built $name"
done

for o in h v; do
  ffmpeg -v error -y -loop 1 -t 3.5 -i "$BLD/end-$o.png" -vf "fade=t=in:st=0:d=0.4" "${ENC[@]}" "$BLD/s7-$o.mp4"
  : > "$BLD/list-$o.txt"
  for n in 1 2 3 4 5 6 7; do echo "file 's$n-$o.mp4'" >> "$BLD/list-$o.txt"; done
done

ffmpeg -v error -y -f concat -safe 0 -i "$BLD/list-h.txt" "${ENC[@]}" -movflags +faststart "$OUT/thai-pdpa-guard-demo-16x9.mp4"
ffmpeg -v error -y -f concat -safe 0 -i "$BLD/list-v.txt" "${ENC[@]}" -movflags +faststart "$OUT/thai-pdpa-guard-demo-9x16.mp4"
ls -la "$OUT"/*.mp4
