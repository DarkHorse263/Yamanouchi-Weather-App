import re

with open("scripts/build-faithful-ads.py", "r") as f:
    content = f.read()

# We need to change the segment loop to apply setpts
# Let's write the new logic

new_logic = """
    segs = data["segs"]
    
    # Calculate natural segment durations
    seg_durs = []
    for s in segs:
        seg_mp4 = TMP / f"{s}.mp4"
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(seg_mp4)], capture_output=True, text=True).stdout)
        seg_durs.append(dur)
        
    # We want the end card to start such that it fully dissolves and holds.
    # Let's target the end card starting 3.5 seconds before dur_master.
    # (0.5s dissolve + 3.0s hold = 3.5s total at the end)
    target_segs_dur = dur_master - 3.0 + len(segs) * 0.5
    
    F = target_segs_dur / sum(seg_durs)
    
    # Dynamically build filter_complex
    filter_complex = ""
    inputs = []
    
    for i, s in enumerate(segs):
        seg_mp4 = TMP / f"{s}.mp4"
        inputs.extend(["-i", str(seg_mp4)])
        filter_complex += f"[{i}:v]setpts={F:.5f}*PTS[v_scaled{i}];"
        
    current_time = 0.0
    for i in range(len(segs)):
        scaled_dur = seg_durs[i] * F
        if i == 0:
            current_time = scaled_dur
        else:
            offset = current_time - 0.5
            filter_complex += f"[{'v_scaled0' if i==1 else f'v_mix{i-1}'}][v_scaled{i}]xfade=transition=fade:duration=0.5:offset={offset:.3f}[v_mix{i}];"
            current_time = offset + scaled_dur
            
    # Add end card
    inputs.extend(["-i", str(TMP / "end_card.mp4")])
    offset = current_time - 0.5
    filter_complex += f"[{f'v_mix{len(segs)-1}' if len(segs)>1 else 'v_scaled0'}][{len(segs)}:v]xfade=transition=fade:duration=0.5:offset={offset:.3f}[v]"
"""

# Replace the old logic
old_pattern = r'    segs = data\["segs"\].*?filter_complex \+= f"\[\{f\'v\{len\(segs\)-1\}\'\}\]\[\{len\(segs\)\}:v\]xfade=transition=fade:duration=0\.5:offset=\{offset:\.2f\}\[v\]"'

content = re.sub(old_pattern, new_logic.strip(), content, flags=re.DOTALL)

with open("scripts/build-faithful-ads.py", "w") as f:
    f.write(content)

print("Patched.")
