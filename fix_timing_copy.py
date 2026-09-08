import re

with open("scripts/build-side-copy-cuts.py", "r") as f:
    content = f.read()

# Fix the t_end
content = content.replace("t_end = dur - 3.0", "t_end = dur - 3.5")

with open("scripts/build-side-copy-cuts.py", "w") as f:
    f.write(content)
