import subprocess
import json

def get_endcard_time(vid_path):
    # Detect the time when the end card is fully visible.
    # The end card is mostly blue with text. We can check for a frame that is very static at the end.
    # Or we can check scene changes.
    cmd = [
        "ffprobe", "-v", "quiet", "-show_frames", "-of", "json",
        "-f", "lavfi",
        f"movie={vid_path},select='gt(scene,0.1)'"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        data = json.loads(res.stdout)
        frames = data.get("frames", [])
        if not frames:
            return None
        # The last scene change should be the start of the end card dissolve
        # Actually it's better to look at the last scene change time
        return float(frames[-1].get("pkt_pts_time", 0))
    except Exception as e:
        return None

print("au:", get_endcard_time("/home/runner/workspace/exports/video-ads/feelzlike-anthem-au-silent.mp4"))
print("us:", get_endcard_time("/home/runner/workspace/exports/video-ads/feelzlike-anthem-us-silent.mp4"))
print("jp:", get_endcard_time("/home/runner/workspace/exports/video-ads/feelzlike-anthem-jp-silent.mp4"))
