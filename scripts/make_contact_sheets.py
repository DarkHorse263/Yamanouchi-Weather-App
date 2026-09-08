import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

WS = Path("/home/runner/workspace")
OUT = WS / "exports/video-ads/refresh-2026-09-reference-faithful"
orig_dir = WS / "exports/video-ads"

def get_frame(vid, t, out_path):
    subprocess.run(["ffmpeg", "-y", "-ss", str(t), "-i", str(vid), "-vframes", "1", "-v", "error", str(out_path)], check=True)

def build_comparison(orig_vid, new_vid, times, out_img, title="Comparison"):
    frames_orig = []
    frames_new = []
    for t in times:
        o = f"/tmp/c_orig_{t}.jpg"
        n = f"/tmp/c_new_{t}.jpg"
        get_frame(orig_vid, t, o)
        get_frame(new_vid, t, n)
        frames_orig.append(Image.open(o))
        frames_new.append(Image.open(n))
        
    if not frames_orig: return
    
    w, h = frames_orig[0].size
    scale = 0.25 if w > 1000 else 0.35
    w, h = int(w*scale), int(h*scale)
    
    # 2 rows, len(times) cols
    cols = len(times)
    margin = 40
    cw = cols * w + (cols + 1) * margin
    ch = 2 * h + 3 * margin + 80
    
    img = Image.new("RGB", (cw, ch), (30,30,30))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)
    except:
        font = ImageFont.load_default()
        
    draw.text((margin, 20), title, fill=(255,255,255), font=font)
    draw.text((margin, 60), "Top: ORIGINAL | Bottom: REBUILT", fill=(200,200,200), font=font)
    
    for i, t in enumerate(times):
        fo = frames_orig[i].resize((w,h), Image.Resampling.LANCZOS)
        fn = frames_new[i].resize((w,h), Image.Resampling.LANCZOS)
        
        x = margin + i*(w+margin)
        y1 = 120
        y2 = 120 + h + margin
        
        img.paste(fo, (x, y1))
        img.paste(fn, (x, y2))
        
        draw.text((x, y1-30), f"{t}s", fill=(255,255,255), font=font)
        
    img.save(out_img)

def build_compact(vid, times, out_img, title):
    frames = []
    for t in times:
        p = f"/tmp/cc_{t}.jpg"
        get_frame(vid, t, p)
        frames.append(Image.open(p))
    w, h = frames[0].size
    scale = 0.25 if w > 1000 else 0.35
    w, h = int(w*scale), int(h*scale)
    
    cols = len(times)
    margin = 20
    cw = cols * w + (cols + 1) * margin
    ch = h + 2 * margin + 60
    img = Image.new("RGB", (cw, ch), (30,30,30))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
    except:
        font = ImageFont.load_default()
    draw.text((margin, 20), title, fill=(255,255,255), font=font)
    
    for i, t in enumerate(times):
        f = frames[i].resize((w,h), Image.Resampling.LANCZOS)
        x = margin + i*(w+margin)
        y = 60 + margin
        img.paste(f, (x, y))
        draw.text((x, y-25), f"{t}s", fill=(255,255,255), font=font)
        
    img.save(out_img)


# Original AU vs Rebuilt AU
# For landscape and square
times = [0, 4, 8, 12, 16, 20, 24, 28, 32, 33.5]

orig_au_land = orig_dir / "feelzlike-anthem-au-landscape.mp4"
new_au_land = OUT / "feelzlike-anthem-au-landscape.mp4"
build_comparison(orig_au_land, new_au_land, times, OUT / "contact-au-landscape-compare.jpg", "AU Landscape Comparison")

orig_au_sq = orig_dir / "feelzlike-anthem-au-square.mp4"
new_au_sq = OUT / "feelzlike-anthem-au-square.mp4"
build_comparison(orig_au_sq, new_au_sq, times, OUT / "contact-au-square-compare.jpg", "AU Square Comparison")

# Silent-copy checks show country ordering and the feelzlike.com/end-card sync.
build_compact(
    OUT / "feelzlike-anthem-us-vertical-silent-copy.mp4",
    [1.5, 8, 14.8, 21.5, 28.4, 32.3],
    OUT / "contact-us-vertical.jpg",
    "US silent copy · USA first · feelzlike.com with end card",
)
build_compact(
    OUT / "feelzlike-anthem-jp-landscape-silent-copy.mp4",
    [1.5, 10, 18, 27, 35.4, 43.2],
    OUT / "contact-jp-landscape.jpg",
    "JP silent copy · Japan first · feelzlike.com with end card",
)

# Dense final-frame checks confirm the JP-English dissolve resolves and holds.
build_compact(
    OUT / "feelzlike-anthem-jp-english.mp4",
    [30.8, 31.8, 32.1, 32.4, 33.5, 34.9, 35.2],
    OUT / "contact-jp-english-vertical.jpg",
    "JP-English · resolved navy end-card hold",
)
build_compact(
    OUT / "feelzlike-anthem-au-japan-winter-square-silent-copy.mp4",
    [1.5, 8, 14.8, 21.5, 28.3, 32, 34],
    OUT / "contact-au-japan-winter-square.jpg",
    "AU to Japan · Japan first · copy held through finish",
)

print("Contact sheets generated.")
