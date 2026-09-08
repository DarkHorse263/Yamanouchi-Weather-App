import re

with open("scripts/build-faithful-ads.py", "r") as f:
    content = f.read()

# Fix the target_segs_dur math
content = content.replace("target_segs_dur = dur_master - 3.0 + len(segs) * 0.5",
                          "target_segs_dur = dur_master - 3.0 + (len(segs) - 1) * 0.5")

with open("scripts/build-faithful-ads.py", "w") as f:
    f.write(content)
