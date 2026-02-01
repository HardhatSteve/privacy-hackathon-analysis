#!/bin/bash
# Download and transcribe ETHGlobal Mux-hosted videos using Whisper

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/transcripts"
VIDEO_DIR="$SCRIPT_DIR/videos"

mkdir -p "$OUTPUT_DIR" "$VIDEO_DIR"

# Mux video URLs from ETHGlobal finalists
declare -A VIDEOS=(
    ["daogenie"]="https://stream.mux.com/QztDu1aTrBkAqT01suT7r7Zb6JMHYKtvelK2g3lYZ2ds/high.mp4"
    ["priv8"]="https://stream.mux.com/F5LxKRRdXvgioXH01jwGaC6OY4eeE00oUpUjaM601zWocM/high.mp4"
    ["bob-the-solver"]="https://stream.mux.com/H5SmtXiPZFGRa2Hn5HtuHucFIYsHmzXmzgnpGT8k4ps/high.mp4"
    ["croissant"]="https://stream.mux.com/B2MpwDFe70000t00T87RFPVS8Ovtv51LCv00E19DEpDtlDc/high.mp4"
    ["zook"]="https://stream.mux.com/rMCfqOQx502dDq2sVqiAyNSsLavnJ5FxyVwOdkgUP2sc/high.mp4"
    ["chameleon"]="https://stream.mux.com/F4oxeLoExdHtRxT8011yTiEAeliVvkPq02LdS7ujVMiPs/high.mp4"
    ["widget-protocol"]="https://stream.mux.com/nJhXc1js00PVL2XeGqUJhdCZiqlblTSqajGgytqYtEUo/high.mp4"
    ["zk-vendor-cred"]="https://stream.mux.com/eAGiIrAgL80102xV00ed01HPOmknC81cfZgyrhAM5Mi4ULQ/high.mp4"
    ["zkcord"]="https://stream.mux.com/bIx6YKYa00vYvqAwUxzjdzy4MkNSnna6B02mJL016v612E/high.mp4"
    ["rugstop"]="https://stream.mux.com/hCLoQ5f3lTBIYZrZOyVPbnUvY3pLjVdFSG2JJkFO4c8/high.mp4"
)

echo "=== ETHGlobal Video Transcription ==="
echo "Output directory: $OUTPUT_DIR"
echo "Videos to process: ${#VIDEOS[@]}"
echo ""

for name in "${!VIDEOS[@]}"; do
    url="${VIDEOS[$name]}"
    video_file="$VIDEO_DIR/${name}.mp4"
    transcript_file="$OUTPUT_DIR/${name}.txt"

    # Skip if transcript already exists
    if [ -f "$transcript_file" ]; then
        echo "[$name] Transcript exists, skipping..."
        continue
    fi

    echo "[$name] Downloading..."
    if [ ! -f "$video_file" ]; then
        curl -L -o "$video_file" "$url" 2>/dev/null || {
            echo "[$name] Download failed, skipping..."
            continue
        }
    fi

    echo "[$name] Transcribing with Whisper..."
    whisper "$video_file" --model base --output_format txt --output_dir "$OUTPUT_DIR" 2>/dev/null || {
        echo "[$name] Transcription failed"
        continue
    }

    # Rename output file
    if [ -f "$OUTPUT_DIR/${name}.txt" ]; then
        echo "[$name] Done!"
    elif [ -f "$OUTPUT_DIR/$(basename "$video_file" .mp4).txt" ]; then
        mv "$OUTPUT_DIR/$(basename "$video_file" .mp4).txt" "$transcript_file"
        echo "[$name] Done!"
    fi

    echo ""
done

echo "=== Transcription Complete ==="
echo "Transcripts saved to: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"
