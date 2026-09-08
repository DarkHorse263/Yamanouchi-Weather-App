#!/usr/bin/env python3
"""Strictly validate and package the September 2026 reference-faithful anthem ads."""

from __future__ import annotations

import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
ORIGINALS = ROOT / "exports" / "video-ads"
OUT = ORIGINALS / "refresh-2026-09-reference-faithful"
ZIP_PATH = ORIGINALS / "feelzlike-anthem-reference-faithful-2026-09.zip"
AU_JAPAN_AUDIO = ROOT / "attached_assets/generated_audio/au-japan-winter-audio-v2.m4a"
SPLIT_PACKAGES = (
    (
        ORIGINALS / "feelzlike-anthem-reference-faithful-2026-09-part-1.zip",
        ("au", "us", "au-japan-winter"),
    ),
    (
        ORIGINALS / "feelzlike-anthem-reference-faithful-2026-09-part-2.zip",
        ("jp", "jp-english"),
    ),
)

MARKETS = ("au", "us", "jp", "jp-english", "au-japan-winter")
FORMATS = ("vertical", "landscape", "square")
EXPECTED_DIMENSIONS = {
    "vertical": (1080, 1920),
    "landscape": (1920, 1080),
    "square": (1000, 1000),
}
CONTACT_SHEETS = (
    "contact-au-landscape-compare.jpg",
    "contact-au-square-compare.jpg",
    "contact-us-vertical.jpg",
    "contact-jp-landscape.jpg",
    "contact-jp-english-vertical.jpg",
    "contact-au-japan-winter-square.jpg",
)


def filename(market: str, fmt: str, audio_mode: str) -> str:
    suffix = "" if fmt == "vertical" else f"-{fmt}"
    if audio_mode == "voiced":
        return f"feelzlike-anthem-{market}{suffix}.mp4"
    if audio_mode == "silent":
        return f"feelzlike-anthem-{market}{suffix}-silent.mp4"
    return f"feelzlike-anthem-{market}-{fmt}-silent-copy.mp4"


EXPECTED_FILES = tuple(
    filename(market, fmt, audio_mode)
    for market in MARKETS
    for fmt in FORMATS
    for audio_mode in ("voiced", "silent", "silent-copy")
)


def probe(path: Path) -> dict:
    raw = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration:stream=codec_name,codec_type,width,height,r_frame_rate,pix_fmt",
            "-of",
            "json",
            str(path),
        ],
        text=True,
    )
    return json.loads(raw)


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


def decoded_audio_md5(path: Path) -> str:
    raw = subprocess.check_output(
        ["ffmpeg", "-v", "error", "-i", str(path), "-map", "0:a:0", "-f", "md5", "-"],
        text=True,
    ).strip()
    return raw.removeprefix("MD5=")


def has_faststart(path: Path) -> bool:
    with path.open("rb") as handle:
        head = handle.read(4 * 1024 * 1024)
    moov = head.find(b"moov")
    mdat = head.find(b"mdat")
    return moov >= 0 and mdat >= 0 and moov < mdat


def classify(name: str) -> tuple[str, str, str]:
    market = next(m for m in sorted(MARKETS, key=len, reverse=True) if name.startswith(f"feelzlike-anthem-{m}"))
    fmt = "landscape" if "-landscape" in name else ("square" if "-square" in name else "vertical")
    audio_mode = "silent-copy" if "-silent-copy" in name else ("silent" if "-silent" in name else "voiced")
    return market, fmt, audio_mode


def expected_duration(name: str, market: str) -> float:
    if market == "au-japan-winter":
        return 34.3
    return duration(ORIGINALS / name)


def write_readme() -> None:
    readme = """feelzlike anthem ads · reference-faithful refresh · September 2026

This archive contains 45 finalized MP4 exports across Australia, USA, Japanese,
Japan-English and Australia-to-Japan-winter cuts.

Preservation approach
· The supplied August campaign remains the creative reference.
· Original market timing, phone geometry, blurred edge treatment, rounded mask,
  legacy voiceovers/music and navy wordmark end cards are preserved.
· Only the pixels inside the app-screen area were replaced with recordings of
  the current feelzlike interface.
· Existing market audio is copied unchanged from the corresponding original.
· Silent files contain no audio.
· The Australia-to-Japan-winter cut uses a new continuous Australian-English
  voiceover over the same original dream-trance anthem source as the AU cut.
  Its claim-safe copy covers destinations, mountain weather, transport context
  and powder alerts.
· No App Store availability or nationwide-complete Japan claim is made.

The earlier refresh-2026-09 directory is rejected and superseded by this
reference-faithful release.

See manifest.json for strict per-file validation results and the contact sheets
for representative visual checks.
"""
    (OUT / "README.txt").write_text(readme, encoding="utf-8")


def write_zip(zip_path: Path, package_files: list[Path]) -> int:
    if zip_path.exists():
        zip_path.unlink()
    with ZipFile(zip_path, "w", compression=ZIP_DEFLATED, compresslevel=6) as archive:
        for path in package_files:
            archive.write(path, path.relative_to(ORIGINALS))

    with ZipFile(zip_path) as archive:
        bad = archive.testzip()
        if bad:
            raise SystemExit(f"ZIP integrity failed at {bad}")
        if len(archive.infolist()) != len(package_files):
            raise SystemExit("ZIP entry count mismatch")
    return zip_path.stat().st_size


def main() -> None:
    actual = {path.name for path in OUT.glob("*.mp4")}
    expected = set(EXPECTED_FILES)
    missing = sorted(expected - actual)
    unexpected = sorted(actual - expected)
    if missing or unexpected:
        raise SystemExit(f"MP4 matrix mismatch: missing={missing}, unexpected={unexpected}")

    records = []
    all_errors: list[str] = []

    for name in sorted(EXPECTED_FILES):
        path = OUT / name
        market, fmt, audio_mode = classify(name)
        expected_dur = expected_duration(name, market)
        metadata = probe(path)
        video = next(stream for stream in metadata["streams"] if stream.get("codec_type") == "video")
        has_audio = any(stream.get("codec_type") == "audio" for stream in metadata["streams"])
        got_dur = float(metadata["format"]["duration"])
        expected_dims = EXPECTED_DIMENSIONS[fmt]
        errors = []

        if abs(got_dur - expected_dur) > (1 / 30 + 0.002):
            errors.append(f"duration {got_dur:.6f} != {expected_dur:.6f}")
        if (video.get("width"), video.get("height")) != expected_dims:
            errors.append(f"dimensions {(video.get('width'), video.get('height'))} != {expected_dims}")
        if video.get("codec_name") != "h264":
            errors.append(f"codec {video.get('codec_name')} != h264")
        if video.get("r_frame_rate") != "30/1":
            errors.append(f"fps {video.get('r_frame_rate')} != 30/1")
        if video.get("pix_fmt") != "yuv420p":
            errors.append(f"pixel format {video.get('pix_fmt')} != yuv420p")
        if has_audio != (audio_mode == "voiced"):
            errors.append(f"audio presence {has_audio} invalid for {audio_mode}")
        faststart = has_faststart(path)
        if not faststart:
            errors.append("moov atom does not precede mdat")

        audio_reference_match = None
        if audio_mode == "voiced":
            audio_reference = AU_JAPAN_AUDIO if market == "au-japan-winter" else ORIGINALS / name
            audio_reference_match = decoded_audio_md5(path) == decoded_audio_md5(audio_reference)
            if not audio_reference_match:
                errors.append("decoded audio differs from approved reference")

        sha256 = hashlib.sha256(path.read_bytes()).hexdigest()
        records.append(
            {
                "filename": name,
                "market": market,
                "format": fmt,
                "audioMode": audio_mode,
                "durationSeconds": got_dur,
                "referenceDurationSeconds": expected_dur,
                "dimensions": f"{video['width']}x{video['height']}",
                "videoCodec": video["codec_name"],
                "pixelFormat": video["pix_fmt"],
                "frameRate": video["r_frame_rate"],
                "fastStart": faststart,
                "audioReferenceMatch": audio_reference_match,
                "sha256": sha256,
                "valid": not errors,
                "errors": errors,
            }
        )
        all_errors.extend(f"{name}: {error}" for error in errors)

    missing_contacts = [name for name in CONTACT_SHEETS if not (OUT / name).exists()]
    if missing_contacts:
        all_errors.append(f"missing contact sheets: {missing_contacts}")

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "videoCount": len(records),
        "allValid": not all_errors,
        "errors": all_errors,
        "videos": records,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_readme()

    if all_errors:
        raise SystemExit("\n".join(all_errors))

    package_files = [OUT / name for name in sorted(EXPECTED_FILES)]
    package_files.extend(OUT / name for name in CONTACT_SHEETS)
    package_files.extend((OUT / "manifest.json", OUT / "README.txt"))

    master_zip_bytes = write_zip(ZIP_PATH, package_files)
    support_files = [OUT / name for name in CONTACT_SHEETS] + [OUT / "manifest.json", OUT / "README.txt"]
    split_zip_bytes = {}
    for split_path, split_markets in SPLIT_PACKAGES:
        split_videos = [
            OUT / name
            for name in sorted(EXPECTED_FILES)
            if classify(name)[0] in split_markets
        ]
        split_zip_bytes[split_path.name] = write_zip(split_path, split_videos + support_files)

    print(
        json.dumps(
            {
                "videos": len(records),
                "valid": True,
                "contactSheets": len(CONTACT_SHEETS),
                "zipEntries": len(package_files),
                "zipBytes": master_zip_bytes,
                "splitZipBytes": split_zip_bytes,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()