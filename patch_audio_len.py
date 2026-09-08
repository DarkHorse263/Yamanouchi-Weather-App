import re

with open("scripts/build-faithful-ads.py", "r") as f:
    content = f.read()

new_logic = """
    if market_key == "au-japan-winter":
        au_jp_audio = Path("/tmp/au-japan-winter-audio.m4a")
        if au_jp_audio.exists():
            import subprocess
            au_jp_dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(au_jp_audio)], capture_output=True, text=True).stdout)
        else:
            au_jp_dur = 34.300
        for fmt in ["vertical", "landscape", "square"]:
            target_durs[f"silent_{fmt}"] = au_jp_dur
            target_durs[f"voiced_{fmt}"] = au_jp_dur
"""

content = re.sub(r'    if market_key == "au-japan-winter":\n        for fmt in \["vertical", "landscape", "square"\]:\n            target_durs\[f"silent_\{fmt\}"\] = 34\.300\n            target_durs\[f"voiced_\{fmt\}"\] = 34\.300', new_logic.strip('\n'), content)

with open("scripts/build-faithful-ads.py", "w") as f:
    f.write(content)

print("Patched audio len.")
