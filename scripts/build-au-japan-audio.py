#!/usr/bin/env python3
"""Mix AU-to-Japan narration to match the JP-English anthem audio."""

from __future__ import annotations

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BED = ROOT / "attached_assets/generated_audio/ad-music-bed.mp3"
VOICE = ROOT / "attached_assets/generated_audio/vo-anthem-au-japan-winter-v5.mp3"
OUTPUT = ROOT / "attached_assets/generated_audio/au-japan-winter-audio-v5.m4a"
VIDEO_DURATION = 34.3
VOICE_DELAY_MS = 800
VOICE_LEVEL_MATCH = 0.314


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

    filter_complex = (
        f"[0:a]atrim=0:{VIDEO_DURATION},asetpts=N/SR/TB,volume=0.70[bed];"
        f"[1:a]volume={VOICE_LEVEL_MATCH},adelay={VOICE_DELAY_MS}|{VOICE_DELAY_MS},"
        f"apad=whole_dur={VIDEO_DURATION}[voice];"
        "[voice]asplit=2[vo_sc][vo_mix_base];"
        "[vo_mix_base]volume=2.80[vo_mix];"
        "[bed][vo_sc]sidechaincompress="
        "threshold=0.005:ratio=4:attack=20:release=400[ducked];"
        "[ducked][vo_mix]amix=inputs=2:duration=longest:normalize=0,"
        f"loudnorm=I=-16.18:TP=-4.35:LRA=2.3,"
        f"atrim=0:{VIDEO_DURATION}[mix]"
    )

    subprocess.run(
        [
            "ffmpeg",
            "-y",
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