with open("scripts/build-faithful-ads.py", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith("segs = data[\"segs\"]"):
        new_lines.append("    " + line)
    elif line.startswith("        if au_jp_audio.exists():"):
        pass
    else:
        new_lines.append(line)

with open("scripts/build-faithful-ads.py", "w") as f:
    f.writelines(new_lines)
