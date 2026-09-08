import re

with open("scripts/build-faithful-ads.py", "r") as f:
    content = f.read()

# Replace the first audio mix logic
content = re.sub(
    r'    if market_key == "au-japan-winter":\n        subprocess\.run\(\["ffmpeg", "-y", "-i", str\(master_vert\), "-i", "/tmp/au-japan-winter-audio\.m4a", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-t", str\(dur_voiced\), "-movflags", "\+faststart", str\(master_vert_voiced\)\], check=True\)',
    r'    if market_key == "au-japan-winter":\n        orig_master = ROOT / "exports/video-ads" / data["master"]\n        subprocess.run(["ffmpeg", "-y", "-i", str(master_vert), "-i", str(orig_master), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-t", str(dur_voiced), "-movflags", "+faststart", str(master_vert_voiced)], check=True)',
    content
)

# Replace the second audio mix logic
content = re.sub(
    r'        if market_key == "au-japan-winter":\n            subprocess\.run\(\["ffmpeg", "-y", "-i", str\(silent\), "-i", "/tmp/au-japan-winter-audio\.m4a", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-t", str\(dur_v\), "-movflags", "\+faststart", str\(voiced\)\], check=True\)',
    r'        if market_key == "au-japan-winter":\n            # fallback to au master since au-japan-winter formats do not exist in original exports\n            orig_master_fmt = ROOT / f"exports/video-ads/feelzlike-anthem-au-{fmt}.mp4"\n            subprocess.run(["ffmpeg", "-y", "-i", str(silent), "-i", str(orig_master_fmt), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-t", str(dur_v), "-movflags", "+faststart", str(voiced)], check=True)',
    content
)

with open("scripts/build-faithful-ads.py", "w") as f:
    f.write(content)
