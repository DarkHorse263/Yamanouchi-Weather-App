#!/usr/bin/env python3
"""Mix the AU-to-Japan narration over the original feelzlike anthem bed."""

from __future__ import annotations

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BED = ROOT / "attached_assets/generated_audio/ad-dreamtrance-bed.mp3"
VOICE = ROOT / "attached_assets/generated_audio/vo-anthem-au-japan-winter-v2.mp3"
OUTPUT = ROOT / "attached_assets/generated_audio/au-japan-winter-audio-v2.m4a"
VIDEO_DURATION = 34.3
VOICE_TARGET_DURATION = 34.0


def duration(path: Path) -> float:
    return float(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "csv=p=0",
                str(path),
            ],
            text=True,
        ).strip()
    )


def main() -> None:
    for path in (BED, VOICE):
        if not path.exists():
            raise FileNotFoundError(path)

    tempo = duration(VOICE) / VOICE_TARGET_DURATION
    voice_filter = (
        f"atempo={tempo:.8f},"
        "loudnorm=I=-18:TP=-2:LRA=7,"
        f"apad=whole_dur={VIDEO_DURATION}[vo];"
        "[vo]asplit=2[vo_sc][vo_mix];"
    )
    filter_complex = (
        f"[0:a]atrim=0:{VIDEO_DURATION},asetpts=N/SR/TB,volume=0.90[bed];"
        f"[1:a]{voice_filter}"
        "[bed][vo_sc]sidechaincompress="
        "threshold=0.035:ratio=8:attack=15:release=420[ducked];"
        "[ducked][vo_mix]amix=inputs=2:duration=longest:normalize=0,"
        f"loudnorm=I=-16:TP=-1.5:LRA=8,atrim=0:{VIDEO_DURATION}[mix]"
    )

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-stream_loop",
            "-1",
            "-i",
            str(BED),
            "-i",
            str(VOICE),
            "-filter_complex",
            filter_complex,
            "-map",
            "[mix]",
            "-c:a",
            "aac",
            "-b:a",
            "256k",
            "-ar",
            "96000",
            "-t",
            str(VIDEO_DURATION),
            str(OUTPUT),
        ],
        check=True,
    )
    print(f"Built {OUTPUT} ({duration(OUTPUT):.3f}s)")


if __name__ == "__main__":
    main()