import subprocess
MARKETS = {
    "au": ["au-home", "au-mtn", "au-qtown", "au-alerts"],
    "us": ["us-home", "us-mtn", "us-town", "us-alerts"],
    "jp": ["jp-home", "jp-mtn", "jp-niseko", "jp-happo", "jp-town", "jp-alerts"],
    "jp-english": ["jpen-home", "jpen-mtn", "jpen-niseko", "jpen-happo", "jpen-town", "jpen-alerts"],
    "au-japan-winter": ["jpen-home", "jpen-mtn", "jpen-town", "jpen-alerts"]
}
import pathlib
p = pathlib.Path("/tmp/adrec_faithful")
for m, segs in MARKETS.items():
    total_frames = 0
    for s in segs:
        d = p / s
        if d.exists():
            total_frames += len(list(d.glob("*.png")))
    print(f"{m}: {total_frames} frames")
