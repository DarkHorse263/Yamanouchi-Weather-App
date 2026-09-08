import subprocess
import json
def get_transition_start(vid):
    # Detect the scene change frame
    cmd = [
        "ffprobe", "-v", "quiet", "-show_frames", "-of", "json",
        "-f", "lavfi",
        f"movie={vid},select='gt(scene,0.2)'"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        data = json.loads(res.stdout)
        frames = data.get("frames", [])
        if not frames:
            return None
        return float(frames[-1].get("pkt_pts_time", 0))
    except:
        return None

for k in ["au", "us", "jp", "jp-english"]:
    vid = f"/home/runner/workspace/exports/video-ads/feelzlike-anthem-{k}-silent.mp4"
    import os
    if not os.path.exists(vid):
        vid = f"/home/runner/workspace/exports/video-ads/refresh-2026-09-reference-faithful/feelzlike-anthem-{k}-silent.mp4"
    t = get_transition_start(vid)
    print(f"{k}: {t}")
