#!/usr/bin/env python3
"""
Fetch YouTube transcripts for ETHGlobal hackathon videos.
Requires: pip install youtube-transcript-api
"""

from youtube_transcript_api import YouTubeTranscriptApi
import json

# ETHGlobal finalist videos with YouTube URLs - expanded list
YOUTUBE_VIDEOS = [
    {"name": "Zubernetes", "event": "Bangkok 2024", "video_id": "BDjioH9vYmg"},
    {"name": "Hanseek", "event": "Singapore 2024", "video_id": "YXiSfdBZOxA"},
    {"name": "fheProxies", "event": "Singapore 2024", "video_id": "LSvUDMd_Be8"},
    {"name": "Privacy Avengers", "event": "Sydney 2024", "video_id": "OgbSf73Z2Iw"},
    # Add more ETHGlobal videos - search for common hackathon demo patterns
    {"name": "ETHGlobal Bangkok Finalist 1", "event": "Bangkok 2024", "video_id": "r5J0e3XF5YQ"},
    {"name": "ETHGlobal Singapore Demo", "event": "Singapore 2024", "video_id": "kqKMY_zxBA4"},
]

def get_transcript(video_id: str) -> str:
    """Fetch transcript for a YouTube video."""
    try:
        # Updated API: use fetch() method
        transcript_list = YouTubeTranscriptApi().fetch(video_id)
        # Combine all text segments
        full_text = " ".join([entry.text for entry in transcript_list])
        return full_text
    except Exception as e:
        return f"Error: {str(e)}"

def main():
    results = []

    for video in YOUTUBE_VIDEOS:
        print(f"Fetching transcript for {video['name']}...")
        transcript = get_transcript(video['video_id'])

        results.append({
            "name": video['name'],
            "event": video['event'],
            "video_id": video['video_id'],
            "youtube_url": f"https://youtube.com/watch?v={video['video_id']}",
            "transcript": transcript
        })

        print(f"  - Got {len(transcript)} characters")

    # Save to JSON
    output_file = "youtube-transcripts.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nSaved to {output_file}")

    # Also print transcripts
    print("\n" + "="*80)
    for r in results:
        print(f"\n## {r['name']} ({r['event']})")
        print(f"URL: {r['youtube_url']}")
        print(f"\nTranscript:\n{r['transcript']}")
        print("\n" + "-"*80)

if __name__ == "__main__":
    main()
