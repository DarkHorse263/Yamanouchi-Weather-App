import re

with open("scripts/build-side-copy-cuts.py", "r") as f:
    content = f.read()

new_timing = """
        t0 = 1.2
        t_end = dur - 3.0
        span = t_end - t0
        starts = [t0 + i * span / (len(pngs) - 1) for i in range(len(pngs))]
"""

content = re.sub(r'        t0, span = 1\.2, dur \* 0\.55\n        starts = \[.*?\]', new_timing.strip('\n'), content)

with open("scripts/build-side-copy-cuts.py", "w") as f:
    f.write(content)

print("Patched timing.")
