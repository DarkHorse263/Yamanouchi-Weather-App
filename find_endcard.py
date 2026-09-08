import subprocess
import sys

def get_endcard_time(vid):
    # Extract frame timestamps and mean colors for the last 6 seconds
    cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", vid
    ]
    dur = float(subprocess.run(cmd, capture_output=True, text=True).stdout)
    
    start_t = max(0, dur - 6.0)
    
    cmd = [
        "ffmpeg", "-ss", str(start_t), "-i", vid,
        "-vf", "signalstats",
        "-f", "null", "-"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    # the signalstats output is in stderr
    # we want to find the moment the scene stabilizes.
    
    # We can also just use ffmpeg scene detection
    cmd = [
        "ffmpeg", "-ss", str(start_t), "-i", vid,
        "-filter:v", "select='gt(scene,0.2)',showinfo",
        "-f", "null", "-"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    
    times = []
    for line in res.stderr.splitlines():
        if "pts_time:" in line:
            import re
            m = re.search(r'pts_time:\s*([0-9\.]+)', line)
            if m:
                times.append(float(m.group(1)) + start_t)
                
    if times:
        return times[-1]
    return dur - 3.0

for k in ["au", "us", "jp", "jp-english"]:
    vid = f"/home/runner/workspace/exports/video-ads/feelzlike-anthem-{k}-silent.mp4"
    if k == "jp-english":
        # It's an output of faithful script? No, it's original or rebuilt?
        vid = f"/tmp/ad_build/feelzlike-anthem-{k}-silent.mp4"
        import os
        if not os.path.exists(vid):
            vid = f"/home/runner/workspace/exports/video-ads/feelzlike-anthem-{k}-silent.mp4"
            if not os.path.exists(vid):
                vid = f"/home/runner/workspace/exports/video-ads/refresh-2026-09-reference-faithful/feelzlike-anthem-{k}-silent.mp4"
    print(k, get_endcard_time(vid))
