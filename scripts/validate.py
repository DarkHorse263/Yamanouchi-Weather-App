import json, os, subprocess, sys
from pathlib import Path
from PIL import Image

OUT = Path("exports/video-ads/refresh-2026-09-reference-faithful")
ORIG = Path("exports/video-ads")
MARKETS = ["au", "us", "jp", "jp-english", "au-japan-winter"]

manifest = {"videos": []}

def ffprobe(file_path):
    cmd = ["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(file_path)]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(result.stdout)

files = list(OUT.glob("*.mp4"))

for f in files:
    info = ffprobe(f)
    streams = info.get("streams", [])
    v_stream = next((s for s in streams if s["codec_type"] == "video"), None)
    a_stream = next((s for s in streams if s["codec_type"] == "audio"), None)
    
    name = f.name
    market = next(m for m in MARKETS if f"-{m}" in name or f"-{m}-" in name)
    
    if "au-japan-winter" in name:
        market = "au-japan-winter"
    elif "jp-english" in name:
        market = "jp-english"
    elif "-jp-" in name or name.endswith("-jp.mp4"):
        market = "jp"
    elif "-us-" in name or name.endswith("-us.mp4"):
        market = "us"
    elif "-au-" in name or name.endswith("-au.mp4"):
        market = "au"
        
    format = "vertical"
    if "landscape" in name: format = "landscape"
    elif "square" in name: format = "square"
    
    audio_mode = "silent" if "silent" in name else "voiced"
    if "silent-copy" in name: audio_mode = "silent-copy"
    
    valid = True
    errors = []
    
    if not v_stream:
        valid, errors = False, ["No video stream"]
    else:
        if v_stream.get("codec_name") != "h264": valid, errors = False, errors + ["Not h264"]
        if v_stream.get("pix_fmt") != "yuv420p": valid, errors = False, errors + ["Not yuv420p"]
        
        # Check dimensions
        w, h = v_stream.get("width"), v_stream.get("height")
        if format == "vertical" and (w, h) != (1080, 1920): valid, errors = False, errors + [f"Bad dim: {w}x{h}"]
        if format == "landscape" and (w, h) != (1920, 1080): valid, errors = False, errors + [f"Bad dim: {w}x{h}"]
        if format == "square" and (w, h) != (1000, 1000): valid, errors = False, errors + [f"Bad dim: {w}x{h}"]
        
        # Check fps
        r_frame_rate = v_stream.get("r_frame_rate")
        if r_frame_rate != "30/1": valid, errors = False, errors + [f"Bad fps: {r_frame_rate}"]
        
    if audio_mode == "voiced" and not a_stream:
        valid, errors = False, errors + ["Missing audio"]
    if audio_mode != "voiced" and a_stream:
        valid, errors = False, errors + ["Has audio but shouldn't"]
        
    dur = float(info["format"].get("duration", 0))
    
    # Strict duration matching
    expected_dur = 0.0
    if market == "au-japan-winter":
        expected_dur = 34.300
    else:
        # Determine equivalent orig file
        orig_fmt_name = ""
        if format == "landscape": orig_fmt_name = "-landscape"
        elif format == "square": orig_fmt_name = "-square"
        
        orig_sfx = ""
        if audio_mode == "silent": orig_sfx = "-silent"
        elif audio_mode == "silent-copy": orig_sfx = "-silent-copy"
        
        # Original naming
        orig_file = ORIG / f"feelzlike-anthem-{market}{orig_fmt_name}{orig_sfx}.mp4"
        if not orig_file.exists():
            orig_file = ORIG / f"feelzlike-anthem-{market}{orig_sfx}.mp4"
        if orig_file.exists():
            orig_info = ffprobe(orig_file)
            expected_dur = float(orig_info["format"].get("duration", 0))
            
    if expected_dur > 0 and abs(dur - expected_dur) > 0.035:
        valid, errors = False, errors + [f"Duration mismatch: {dur} != {expected_dur}"]
    
    manifest["videos"].append({
        "filename": name,
        "market": market,
        "format": format,
        "audio_mode": audio_mode,
        "duration": dur,
        "dimensions": f"{w}x{h}" if v_stream else "None",
        "valid": valid,
        "errors": errors
    })

with open(OUT / "manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)

print("Validation complete. Check manifest.json.")
