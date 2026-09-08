import subprocess
import json

def get_transition_start(vid):
    cmd = [
        "ffprobe", "-v", "quiet", "-show_frames", "-of", "json",
        "-f", "lavfi",
        f"movie={vid},select='gt(scene,0.1)'"
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

vids = [
    "/home/runner/workspace/exports/video-ads/refresh-2026-09-reference-faithful/feelzlike-anthem-jp-english-silent.mp4",
    "/home/runner/workspace/exports/video-ads/refresh-2026-09-reference-faithful/feelzlike-anthem-jp-english-landscape-silent.mp4",
    "/home/runner/workspace/exports/video-ads/refresh-2026-09-reference-faithful/feelzlike-anthem-jp-english-square-silent.mp4"
]

for vid in vids:
    print(vid.split("/")[-1], get_transition_start(vid))

