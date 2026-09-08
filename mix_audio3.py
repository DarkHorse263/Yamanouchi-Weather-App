import subprocess
import re

vo_path = "/home/runner/workspace/attached_assets/generated_audio/vo-anthem-au-japan-winter.mp3"
bed_path = "/home/runner/workspace/attached_assets/generated_audio/ad-dreamtrance-bed.mp3"
out_path = "/tmp/au-japan-winter-audio.m4a"

dur_master = 34.3

fc = (
    "[1:a]asplit=2[vo1][vo2];"
    "[0:a][vo1]sidechaincompress=threshold=0.08:ratio=4:attack=5:release=50[ducked];"
    "[ducked][vo2]amix=inputs=2:duration=longest:dropout_transition=2,"
    f"afade=t=out:st={dur_master-1.5}:d=1.5,"
    "loudnorm=I=-16:TP=-1.5[out]"
)

subprocess.run([
    "ffmpeg", "-y",
    "-i", bed_path,
    "-i", "/tmp/vo_combined.m4a",
    "-filter_complex", fc,
    "-map", "[out]",
    "-t", str(dur_master),
    "-c:a", "aac", out_path
], check=True)

print("Audio mixed cleanly.")
