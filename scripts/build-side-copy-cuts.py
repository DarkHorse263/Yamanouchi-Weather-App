#!/usr/bin/env python3
"""Rebuild silent anthem cuts: phone to one side, copy points fading in.

Usage: python3 scripts/build-side-copy-cuts.py [market ...]
Markets: au us jp jp-english. Outputs *-silent-copy.mp4 into exports/video-ads.
"""
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

WS = "/home/runner/workspace"
SRC = f"{WS}/exports/video-ads/refresh-2026-09-reference-faithful"
OUT = SRC
TMP = "/tmp/sidecuts"
DIN = f"{WS}/attached_assets/DINPro-Bold_1777358240555.ttf"
CJK = "/nix/store/20yhhw5xdvaw9xrgb1xr0k75xfdvlypk-noto-fonts-cjk-2.001/share/fonts/opentype/noto-cjk/NotoSansCJK.ttc"
WHITE = (255, 255, 255, 255)


MARKETS = [  # (key, master, side, lines)
    ("au", "feelzlike-anthem-au-silent.mp4", "left", [
        "live snow · weather · roads",
        "australia · nz · japan · canada · usa",
        "powder alerts to your inbox",
        "plan your travel",
        "feelzlike.com"
    ]),
    ("us", "feelzlike-anthem-us-silent.mp4", "right", [
        "live snow · weather · roads",
        "usa · canada · japan · australia · nz",
        "powder alerts to your inbox",
        "plan your travel",
        "feelzlike.com"
    ]),
    ("jp", "feelzlike-anthem-jp-silent.mp4", "left", [
        "積雪・天気・道路をライブで",
        "日本・豪州・NZ・カナダ・米国",
        "パウダーアラートをメールで",
        "旅の計画も",
        "feelzlike.com"
    ]),
    ("jp-english", "feelzlike-anthem-jp-english-silent.mp4", "right", [
        "live snow · weather · roads",
        "japan · australia · nz · canada · usa",
        "powder alerts to your inbox",
        "plan your travel",
        "feelzlike.com"
    ]),
    ("au-japan-winter", "feelzlike-anthem-au-japan-winter-silent.mp4", "right", [
        "planning a japan winter?",
        "265 unique Japanese ski resorts,\nacross 37 regions",
        "mountain weather · routes · transport",
        "powder alerts before you fly",
        "feelzlike.com"
    ]),
]

FORMATS = {  # name: (W, H, phone_h)
    "landscape": (1920, 1080, 960),
    "square": (1000, 1000, 640),
    "vertical": (1080, 1920, 1150),
}

END_CARD_STARTS = {
    "au": 28.0,
    "us": 28.0,
    "jp": 35.0,
    "jp-english": 31.766667,
    "au-japan-winter": 28.0,
}

def font(path, size):
    return ImageFont.truetype(path, size)

def text_width(text, f, dr):
    return max(dr.textlength(line, font=f) for line in text.splitlines())

def fit_font(path, size, lines, maxw, dr):
    while size > 20:
        f = font(path, size)
        if all(text_width(t, f, dr) <= maxw for t in lines):
            return f, size
        size -= 2
    return font(path, size), size

def rounded_mask(w, h, r, path):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)
    m.save(path)

def line_pngs(key, fmt, W, H, lines, ja, zone):
    x0, y0, x1, y1 = zone
    zw = x1 - x0
    paths = []
    probe = Image.new("RGBA", (10, 10)); dr = ImageDraw.Draw(probe)
    base = 84 if W >= 1900 else (46 if W <= 1000 and H <= 1000 else 64)
    fpath = CJK if ja else DIN
    body_font, size = fit_font(fpath, base, lines[:-1], zw, dr)
    url_font = font(DIN, int(size * 0.9))
    n = len(lines)
    gap = int(size * 1.9)
    total = gap * (n - 1)
    ystart = (y0 + y1 - total) // 2
    for i, text in enumerate(lines):
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        y = ystart + i * gap
        if i == n - 1:  # url as white pill with blue text
            f = url_font
            tw = d.textlength(text, font=f)
            padx, pady = int(size * 0.7), int(size * 0.45)
            pw, ph = int(tw + 2 * padx), int(size + 2 * pady)
            px = x0 + (zw - pw) // 2
            d.rounded_rectangle([px, y - pady, px + pw, y - pady + ph], radius=ph // 2, fill=WHITE)
            d.text((px + padx, y - pady + (ph - size) // 2 - int(size * 0.08)), text, font=f, fill=(0, 85, 255, 255))
        else:
            f = body_font
            text_lines = text.splitlines()
            line_height = int(size * 1.1)
            text_y = y - ((len(text_lines) - 1) * line_height) // 2
            for line_number, line in enumerate(text_lines):
                tw = d.textlength(line, font=f)
                d.text(
                    (x0 + (zw - tw) // 2, text_y + line_number * line_height),
                    line,
                    font=f,
                    fill=WHITE,
                )
        p = f"{TMP}/{key}-{fmt}-line{i}.png"
        img.save(p)
        paths.append(p)
    return paths

def dur_of(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", path], capture_output=True, text=True)
    return float(r.stdout.strip())

def build(key, master, side, lines, force=False):
    src = f"{SRC}/{master}"
    dur = dur_of(src)
    if key == "jp":
        dur = 43.633333
    ja = any("積雪" in l for l in lines)
    for fmt, (W, H, ph) in FORMATS.items():
        pw = round(ph * 9 / 16 / 2) * 2
        ph = round(ph / 2) * 2
        if fmt == "vertical":
            px = (W - pw) // 2
            py = H - ph - 70
            zone = (60, 90, W - 60, py - 60)
        else:
            mx = 100 if fmt == "landscape" else 30
            py = (H - ph) // 2
            if side == "left":
                px = mx
                zone = (px + pw + mx // 2, 60, W - 40, H - 60)
            else:
                px = W - pw - mx
                zone = (40, 60, px - mx // 2, H - 60)
        maskp = f"{TMP}/mask-{fmt}.png"
        rounded_mask(pw, ph, int(pw * 0.08), maskp)
        pngs = line_pngs(key, fmt, W, H, lines, ja, zone)
        t0 = 1.2
        t_end = END_CARD_STARTS.get(key, dur - 3.5)
        span = t_end - t0
        starts = [t0 + i * span / (len(pngs) - 1) for i in range(len(pngs))]
        inputs = ["-i", src, "-loop", "1", "-i", maskp]
        for p in pngs:
            inputs += ["-loop", "1", "-i", p]
        fc = [f"color=c=0x0055FF:s={W}x{H}:d={dur}[bg]",
              f"[0:v]scale={pw}:{ph}[pv]",
              f"[1:v]format=gray,scale={pw}:{ph}[mk]",
              "[pv][mk]alphamerge[ph]",
              f"[bg][ph]overlay={px}:{py}:shortest=1[v0]"]
        cur = "v0"
        for i, st in enumerate(starts):
            fc.append(f"[{i+2}:v]format=rgba,fade=t=in:st={st:.2f}:d=0.6:alpha=1[l{i}]")
            fc.append(f"[{cur}][l{i}]overlay=0:0:shortest=1[v{i+1}]")
            cur = f"v{i+1}"
        out = f"{OUT}/feelzlike-anthem-{key}-{fmt}-silent-copy.mp4"
        if os.path.exists(out) and not force:
            print(f"Skipping {out}")
            continue
        cmd = ["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(fc),
               "-map", f"[{cur}]", "-t", f"{dur}", "-r", "30", "-c:v", "libx264",
               "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            print(f"FAIL {key} {fmt}\n{r.stderr[-1500:]}"); sys.exit(1)
        print(f"ok {out} ({os.path.getsize(out)//1048576}MB)", flush=True)

if __name__ == "__main__":
    os.makedirs(TMP, exist_ok=True)
    which = sys.argv[1:] or [m[0] for m in MARKETS]
    force = bool(sys.argv[1:])
    for key, master, side, lines in MARKETS:
        if key in which:
            build(key, master, side, lines, force=force)
    print("done")
