import re

with open("scripts/build-side-copy-cuts.py", "r") as f:
    content = f.read()

content = content.replace("ja = lines is JA", 'ja = any("積雪" in l for l in lines)')

with open("scripts/build-side-copy-cuts.py", "w") as f:
    f.write(content)

print("Patched ja.")
