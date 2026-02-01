#!/bin/bash
# Batch download and transcribe ETHGlobal videos via OpenAI API

set -e
source ~/.envrc

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_DIR="$SCRIPT_DIR/videos"
AUDIO_DIR="$SCRIPT_DIR/videos/audio"
TRANSCRIPT_DIR="$SCRIPT_DIR/transcripts"

mkdir -p "$VIDEO_DIR" "$AUDIO_DIR" "$TRANSCRIPT_DIR"

# Function to extract Mux URL from project page
get_mux_url() {
    local project_url="$1"
    curl -s "$project_url" | grep -oE 'stream\.mux\.com/[^"]+/high\.mp4' | head -1
}

# Function to process a single video
process_video() {
    local name="$1"
    local mux_url="$2"

    # Skip if transcript exists
    if [ -f "$TRANSCRIPT_DIR/${name}.txt" ] && [ -s "$TRANSCRIPT_DIR/${name}.txt" ]; then
        echo "[$name] Already transcribed, skipping"
        return 0
    fi

    local video_file="$VIDEO_DIR/${name}.mp4"
    local audio_file="$AUDIO_DIR/${name}.mp3"

    # Download if not exists
    if [ ! -f "$video_file" ]; then
        echo "[$name] Downloading..."
        curl -sL -o "$video_file" "https://$mux_url" || return 1
    fi

    # Extract audio if not exists
    if [ ! -f "$audio_file" ]; then
        echo "[$name] Extracting audio..."
        ffmpeg -i "$video_file" -vn -acodec libmp3lame -q:a 4 "$audio_file" -y 2>/dev/null || return 1
    fi

    # Transcribe via OpenAI API
    echo "[$name] Transcribing..."
    curl -s https://api.openai.com/v1/audio/transcriptions \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -F file="@$audio_file" \
        -F model="whisper-1" \
        -F response_format="text" > "$TRANSCRIPT_DIR/${name}.txt"

    if [ -s "$TRANSCRIPT_DIR/${name}.txt" ]; then
        echo "[$name] Done!"
    else
        echo "[$name] Transcription failed"
        rm -f "$TRANSCRIPT_DIR/${name}.txt"
        return 1
    fi
}

export -f process_video get_mux_url
export OPENAI_API_KEY VIDEO_DIR AUDIO_DIR TRANSCRIPT_DIR

echo "=== ETHGlobal Batch Transcription ==="
echo "Output: $TRANSCRIPT_DIR"
