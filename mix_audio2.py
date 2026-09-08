import subprocess
import re
from pathlib import Path

# Paths
vo_path = "/home/runner/workspace/attached_assets/generated_audio/vo-anthem-au-japan-winter.mp3"
bed_path = "/home/runner/workspace/attached_assets/generated_audio/ad-dreamtrance-bed.mp3"
out_path = "/tmp/au-japan-winter-audio.m4a"

# Get silences
out = subprocess.run(["ffmpeg", "-i", vo_path, "-af", "silencedetect=noise=-30dB:d=0.5", "-f", "null", "-"], capture_output=True, text=True).stderr
silences = []
for line in out.splitlines():
    if "silence_end:" in line:
        m = re.search(r"silence_end: ([\d\.]+)", line)
        if m:
            silences.append(float(m.group(1)))

# The last silence end is where the closing line starts
last_silence = silences[-1] if silences else 19.4483

# Split the VO into main and tail
subprocess.run(["ffmpeg", "-y", "-i", vo_path, "-t", str(last_silence), "-c:a", "aac", "/tmp/vo_main.m4a"], check=True)
subprocess.run(["ffmpeg", "-y", "-i", vo_path, "-ss", str(last_silence), "-c:a", "aac", "/tmp/vo_tail.m4a"], check=True)

# The video dur_master is going to be 34.3 seconds.
dur_master = 34.3

# The tail should end exactly at 34.3s or start around 34.3 - length of tail
tail_dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", "/tmp/vo_tail.m4a"], capture_output=True, text=True).stdout)

# Place the tail such that it ends at dur_master - 0.5
tail_delay = dur_master - 0.5 - tail_dur
if tail_delay < last_silence:
    tail_delay = last_silence + 1.0 # fallback

delay_ms = int(tail_delay * 1000)

subprocess.run([
    "ffmpeg", "-y",
    "-i", "/tmp/vo_main.m4a",
    "-i", "/tmp/vo_tail.m4a",
    "-filter_complex", f"[1:a]adelay={delay_ms}|{delay_ms}[tail];[0:a][tail]amix=inputs=2[vo]",
    "-map", "[vo]", "-c:a", "aac", "/tmp/vo_combined.m4a"
], check=True)

# Mix with music bed
# Ducking
fc = (
    "[1:a]asplit=2[vo1][vo2];"
    "[0:a][vo1]sidechaincompress=threshold=0.08:ratio=4:attack=5:release=50[ducked];"
    "[ducked][vo2]amix=inputs=2:duration=first:dropout_transition=2,"
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

print("Audio mixed.")
