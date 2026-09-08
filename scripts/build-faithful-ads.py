#!/usr/bin/env python3
import os, subprocess, sys, shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path("/home/runner/workspace")
OUT = ROOT / "exports/video-ads/refresh-2026-09-reference-faithful"
TMP = Path("/tmp/ad_build")
SRC_FRAMES = Path("/tmp/adrec_faithful")

OUT.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)

AU_MASTER = ROOT / "exports/video-ads/feelzlike-anthem-au.mp4"
AU_JAPAN_AUDIO = ROOT / "attached_assets/generated_audio/au-japan-winter-audio-v2.m4a"
if not AU_MASTER.exists():
    print("Master not found!")
    sys.exit(1)

subprocess.run(["ffmpeg", "-y", "-i", str(AU_MASTER), "-vframes", "1", "-vf", "crop=10:1920:0:0,scale=1080:1920", str(TMP / "bg.png")], check=True)
subprocess.run(["ffmpeg", "-y", "-sseof", "-0.1", "-i", str(AU_MASTER), "-vframes", "1", str(TMP / "end_card.png")], check=True)

bg_img = Image.open(TMP / "bg.png").convert("RGB")
end_card_img = Image.open(TMP / "end_card.png").convert("RGB")

MARKETS = {
    "au": {
        "master": "feelzlike-anthem-au.mp4",
        "segs": ["au-home", "au-mtn", "au-qtown", "au-alerts"],
        "audio_offset": 0
    },
    "us": {
        "master": "feelzlike-anthem-us.mp4",
        "segs": ["us-home", "us-mtn", "us-town", "us-alerts"],
        "audio_offset": 0
    },
    "jp": {
        "master": "feelzlike-anthem-jp.mp4",
        "segs": ["jp-home", "jp-mtn", "jp-niseko", "jp-happo", "jp-town", "jp-alerts"],
        "audio_offset": 0
    },
    "jp-english": {
        "master": "feelzlike-anthem-jp-english.mp4",
        "segs": ["jpen-home", "jpen-mtn", "jpen-niseko", "jpen-happo", "jpen-town", "jpen-alerts"],
        "audio_offset": 0
    },
    "au-japan-winter": {
        "master": "feelzlike-anthem-au.mp4",
        "segs": ["jpen-home", "jpen-mtn", "jpen-town", "jpen-alerts"],
        "audio_offset": 0
    }
}

SELECTED_MARKETS = set(sys.argv[1:])

phone_w, phone_h = 780, 1688
px, py = 150, 116

mask = Image.new("L", (phone_w, phone_h), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, phone_w-1, phone_h-1], radius=65, fill=255)

print("Processing segment frames...")
processed_segs = set()
for m, data in MARKETS.items():
    if SELECTED_MARKETS and m not in SELECTED_MARKETS:
        continue
    for seg in data["segs"]:
        if seg in processed_segs: continue
        processed_segs.add(seg)
        seg_dir = SRC_FRAMES / seg
        out_dir = TMP / "segs_processed" / seg
        out_dir.mkdir(parents=True, exist_ok=True)
        
        frames = sorted(list(seg_dir.glob("*.png")))
        if not frames:
            print(f"WARNING: No frames found for {seg}")
            continue
            
        for f in frames:
            img = Image.open(f).convert("RGB")
            img = img.resize((phone_w, phone_h), Image.Resampling.LANCZOS)
            comp = bg_img.copy()
            comp.paste(img, (px, py), mask)
            comp.save(out_dir / f.name)
            
        # Compile to intermediate video
        subprocess.run(["ffmpeg", "-y", "-framerate", "12", "-pattern_type", "glob", "-i", f"{out_dir}/*.png", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", str(TMP / f"{seg}.mp4")], check=True)
        print(f"Processed {seg}")

# End card video
subprocess.run(["ffmpeg", "-y", "-loop", "1", "-i", str(TMP / "end_card.png"), "-c:v", "libx264", "-t", "15", "-pix_fmt", "yuv420p", "-r", "30", str(TMP / "end_card.mp4")], check=True)

# Generate masters
for market_key, data in MARKETS.items():
    if SELECTED_MARKETS and market_key not in SELECTED_MARKETS:
        continue
    print(f"Building {market_key}...")
    
    # check if finished
    final_test = OUT / f"feelzlike-anthem-{market_key}-square.mp4"
    if not SELECTED_MARKETS and final_test.exists():
        print(f"Skipping {market_key}, already exists.")
        continue

    target_durs = {}
    if market_key == "au-japan-winter":
        for fmt in ["vertical", "landscape", "square"]:
            target_durs[f"silent_{fmt}"] = 34.300
            target_durs[f"voiced_{fmt}"] = 34.300
    else:
        for fmt, orig_fmt_name in [("vertical", ""), ("landscape", "-landscape"), ("square", "-square")]:
            orig_silent = ROOT / f"exports/video-ads/feelzlike-anthem-{market_key}{orig_fmt_name}-silent.mp4"
            orig_voiced = ROOT / f"exports/video-ads/feelzlike-anthem-{market_key}{orig_fmt_name}.mp4"
            dur_silent = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(orig_silent)], capture_output=True, text=True).stdout)
            dur_voiced = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(orig_voiced)], capture_output=True, text=True).stdout)
            target_durs[f"silent_{fmt}"] = dur_silent
            target_durs[f"voiced_{fmt}"] = dur_voiced
            
    # Use vertical silent duration for the master generation
    dur_master = target_durs["silent_vertical"]

    segs = data["segs"]
    
    # Calculate natural segment durations.
    seg_durs = []
    for s in segs:
        seg_mp4 = TMP / f"{s}.mp4"
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(seg_mp4)], capture_output=True, text=True).stdout)
        seg_durs.append(dur)
        
    filter_complex = ""
    inputs = []
    for i, s in enumerate(segs):
        seg_mp4 = TMP / f"{s}.mp4"
        inputs.extend(["-i", str(seg_mp4)])

    # AU proof, US and JP keep their approved natural segment cadence.
    # JP-English and AU-to-Japan are fitted so the final dissolve completes
    # and the navy end card holds fully opaque for the last three seconds.
    fit_end_card = market_key in {"jp-english", "au-japan-winter"}
    if fit_end_card:
        target_segs_dur = dur_master - 3.0 + (len(segs) - 1) * 0.5
        scale = target_segs_dur / sum(seg_durs)
        for i in range(len(segs)):
            filter_complex += f"[{i}:v]setpts={scale:.8f}*PTS[v_scaled{i}];"

        current_time = 0.0
        for i, seg_dur in enumerate(seg_durs):
            scaled_dur = seg_dur * scale
            if i == 0:
                current_time = scaled_dur
            else:
                offset = current_time - 0.5
                previous = "v_scaled0" if i == 1 else f"v_mix{i-1}"
                filter_complex += (
                    f"[{previous}][v_scaled{i}]"
                    f"xfade=transition=fade:duration=0.5:offset={offset:.6f}[v_mix{i}];"
                )
                current_time = offset + scaled_dur
        final_video = f"v_mix{len(segs)-1}" if len(segs) > 1 else "v_scaled0"
    else:
        current_time = 0.0
        for i, seg_dur in enumerate(seg_durs):
            if i == 0:
                current_time = seg_dur
            else:
                offset = current_time - 0.5
                previous = "0:v" if i == 1 else f"v{i-1}"
                filter_complex += (
                    f"[{previous}][{i}:v]"
                    f"xfade=transition=fade:duration=0.5:offset={offset:.6f}[v{i}];"
                )
                current_time = offset + seg_dur
        final_video = f"v{len(segs)-1}" if len(segs) > 1 else "0:v"

    # Add end card
    inputs.extend(["-i", str(TMP / "end_card.mp4")])
    offset = current_time - 0.5
    filter_complex += (
        f"[{final_video}][{len(segs)}:v]"
        f"xfade=transition=fade:duration=0.5:offset={offset:.6f}[v]"
    )
    
    master_vert = OUT / f"feelzlike-anthem-{market_key}-silent.mp4"
    
    subprocess.run(["ffmpeg", "-y"] + inputs + ["-filter_complex", filter_complex, "-map", "[v]", "-t", str(dur_master), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", str(master_vert)], check=True)
    
    # Mix audio
    master_vert_voiced = OUT / f"feelzlike-anthem-{market_key}.mp4"
    dur_voiced = target_durs["voiced_vertical"]
    if market_key == "au-japan-winter":
        if not AU_JAPAN_AUDIO.exists():
            raise FileNotFoundError(f"Build the AU-to-Japan audio first: {AU_JAPAN_AUDIO}")
        subprocess.run(["ffmpeg", "-y", "-i", str(master_vert), "-i", str(AU_JAPAN_AUDIO), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-t", str(dur_voiced), "-movflags", "+faststart", str(master_vert_voiced)], check=True)
    else:
        orig_master = ROOT / "exports/video-ads" / data["master"]
        subprocess.run(["ffmpeg", "-y", "-i", str(master_vert), "-i", str(orig_master), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-t", str(dur_voiced), "-movflags", "+faststart", str(master_vert_voiced)], check=True)
    
    # Generate derived aspect ratios: landscape (1920x1080) and square (1000x1000)
    # Background: scaled-to-fill + boxblur 30 + slight darken
    # Foreground: 9:16 scaled to canvas height centered
    for fmt, (fw, fh) in [("landscape", (1920, 1080)), ("square", (1000, 1000))]:
        silent = OUT / f"feelzlike-anthem-{market_key}-{fmt}-silent.mp4"
        voiced = OUT / f"feelzlike-anthem-{market_key}-{fmt}.mp4"
        dur_s = target_durs[f"silent_{fmt}"]
        dur_v = target_durs[f"voiced_{fmt}"]
        
        fc = (
            f"[0:v]scale={fw}:{fh}:force_original_aspect_ratio=increase,crop={fw}:{fh},boxblur=30,colorlevels=rimin=0.0:gimin=0.0:bimin=0.0:rimax=1.0:gimax=1.0:bimax=1.0:romin=0.0:gomin=0.0:bomin=0.0:romax=0.8:gomax=0.8:bomax=0.8[bg];"
            f"[0:v]scale=-1:{fh}[fg];"
            f"[bg][fg]overlay=(W-w)/2:(H-h)/2[v]"
        )
        subprocess.run(["ffmpeg", "-y", "-i", str(master_vert), "-filter_complex", fc, "-map", "[v]", "-t", str(dur_s), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", str(silent)], check=True)
        if market_key == "au-japan-winter":
            subprocess.run(["ffmpeg", "-y", "-i", str(silent), "-i", str(AU_JAPAN_AUDIO), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-t", str(dur_v), "-movflags", "+faststart", str(voiced)], check=True)
        else:
            orig_voiced_fmt = ROOT / f"exports/video-ads/feelzlike-anthem-{market_key}-{fmt}.mp4"
            subprocess.run(["ffmpeg", "-y", "-i", str(silent), "-i", str(orig_voiced_fmt), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-t", str(dur_v), "-movflags", "+faststart", str(voiced)], check=True)

        
print("All master formats and variants rebuilt faithfully.")
