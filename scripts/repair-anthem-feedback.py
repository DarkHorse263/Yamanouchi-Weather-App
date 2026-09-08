#!/usr/bin/env python3
"""Apply the approved audio, end-card, and derivative fixes without rerecording UI."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ORIGINALS = ROOT / "exports/video-ads"
OUT = ORIGINALS / "refresh-2026-09-reference-faithful"
AU_ORIGINAL = ORIGINALS / "feelzlike-anthem-au.mp4"
AU_JAPAN_AUDIO = ROOT / "attached_assets/generated_audio/au-japan-winter-audio-v2.m4a"
TMP = OUT / ".anthem-feedback-repair"


def run(args: list[str]) -> None:
    subprocess.run(args, check=True)


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


def remux(video: Path, audio: Path, output: Path, target_duration: float) -> None:
    temp = TMP / output.name
    run(
        [
            "ffmpeg",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(video),
            "-i",
            str(audio),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "copy",
            "-t",
            f"{target_duration:.6f}",
            "-movflags",
            "+faststart",
            str(temp),
        ]
    )
    os.replace(temp, output)


def repair_jp_english_end_card() -> None:
    end_card = TMP / "end-card.png"
    run(
        [
            "ffmpeg",
            "-loglevel",
            "error",
            "-y",
            "-sseof",
            "-0.1",
            "-i",
            str(AU_ORIGINAL),
            "-frames:v",
            "1",
            str(end_card),
        ]
    )

    vertical_silent = OUT / "feelzlike-anthem-jp-english-silent.mp4"
    target_vertical = duration(ORIGINALS / vertical_silent.name)
    dissolve_start = target_vertical - 3.5
    repaired_vertical = TMP / vertical_silent.name
    run(
        [
            "ffmpeg",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(vertical_silent),
            "-loop",
            "1",
            "-framerate",
            "30",
            "-i",
            str(end_card),
            "-filter_complex",
            (
                "[0:v]fps=30,format=yuv420p[base];"
                "[1:v]fps=30,format=yuv420p[end];"
                f"[base][end]xfade=transition=fade:duration=0.5:"
                f"offset={dissolve_start:.6f}[v]"
            ),
            "-map",
            "[v]",
            "-t",
            f"{target_vertical:.6f}",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-r",
            "30",
            "-movflags",
            "+faststart",
            str(repaired_vertical),
        ]
    )
    os.replace(repaired_vertical, vertical_silent)

    original_vertical = ORIGINALS / "feelzlike-anthem-jp-english.mp4"
    remux(
        vertical_silent,
        original_vertical,
        OUT / "feelzlike-anthem-jp-english.mp4",
        duration(original_vertical),
    )

    for fmt, width, height in (("landscape", 1920, 1080), ("square", 1000, 1000)):
        silent_name = f"feelzlike-anthem-jp-english-{fmt}-silent.mp4"
        silent = OUT / silent_name
        target_silent = duration(ORIGINALS / silent_name)
        temp_silent = TMP / silent_name
        filter_complex = (
            f"[0:v]scale={width}:{height}:force_original_aspect_ratio=increase,"
            f"crop={width}:{height},boxblur=30,"
            "colorlevels=rimin=0.0:gimin=0.0:bimin=0.0:"
            "rimax=1.0:gimax=1.0:bimax=1.0:"
            "romin=0.0:gomin=0.0:bomin=0.0:"
            "romax=0.8:gomax=0.8:bomax=0.8[bg];"
            f"[0:v]scale=-1:{height}[fg];"
            "[bg][fg]overlay=(W-w)/2:(H-h)/2[v]"
        )
        run(
            [
                "ffmpeg",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(vertical_silent),
                "-filter_complex",
                filter_complex,
                "-map",
                "[v]",
                "-t",
                f"{target_silent:.6f}",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-r",
                "30",
                "-movflags",
                "+faststart",
                str(temp_silent),
            ]
        )
        os.replace(temp_silent, silent)

        original_voiced = ORIGINALS / f"feelzlike-anthem-jp-english-{fmt}.mp4"
        remux(
            silent,
            original_voiced,
            OUT / original_voiced.name,
            duration(original_voiced),
        )


def remux_au_japan_audio() -> None:
    if not AU_JAPAN_AUDIO.exists():
        raise FileNotFoundError(AU_JAPAN_AUDIO)
    for suffix in ("", "-landscape", "-square"):
        silent = OUT / f"feelzlike-anthem-au-japan-winter{suffix}-silent.mp4"
        voiced = OUT / f"feelzlike-anthem-au-japan-winter{suffix}.mp4"
        remux(silent, AU_JAPAN_AUDIO, voiced, 34.3)


def main() -> None:
    TMP.mkdir(parents=True, exist_ok=True)
    repair_jp_english_end_card()
    remux_au_japan_audio()
    print("Repaired JP-English end cards and AU-to-Japan audio.")


if __name__ == "__main__":
    main()