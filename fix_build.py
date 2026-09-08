import re

with open("scripts/build-faithful-ads.py", "r") as f:
    content = f.read()

# Fix the au-japan-winter duration back to 34.300 exactly.
old_logic = """    if market_key == "au-japan-winter":
        au_jp_audio = Path("/tmp/au-japan-winter-audio.m4a")
            import subprocess
            au_jp_dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(au_jp_audio)], capture_output=True, text=True).stdout)
        else:
            au_jp_dur = 34.300
        for fmt in ["vertical", "landscape", "square"]:
            target_durs[f"silent_{fmt}"] = au_jp_dur
            target_durs[f"voiced_{fmt}"] = au_jp_dur"""

new_logic = """    if market_key == "au-japan-winter":
        for fmt in ["vertical", "landscape", "square"]:
            target_durs[f"silent_{fmt}"] = 34.300
            target_durs[f"voiced_{fmt}"] = 34.300"""

content = content.replace(old_logic, new_logic)

with open("scripts/build-faithful-ads.py", "w") as f:
    f.write(content)
