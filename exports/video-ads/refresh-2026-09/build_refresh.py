#!/usr/bin/env python3
"""Render the September 2026 feelzlike anthem refresh.

This is deliberately self-contained: the layouts are composed from the current
PWA's tokens rather than old campaign screenshots.  ffmpeg is used for a
five-beat motion treatment and for muxing the existing licensed campaign beds.
"""
from pathlib import Path
import csv, subprocess, textwrap, shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
ASSETS = ROOT / "artifacts/feelzlike/public"
AUDIO = ROOT / "attached_assets/generated_audio"
FONT = ROOT / "attached_assets/DINPro_1777358240556.ttf"
BOLD = ROOT / "attached_assets/DINPro-Bold_1777358240555.ttf"
JP_FONT = Path("/nix/store/wvgaash2a62b40rw3p37fi0kby8pq980-plemoljp-2.0.4/share/fonts/truetype/plemoljp/PlemolJP-Regular.ttf")
JP_BOLD = Path("/nix/store/wvgaash2a62b40rw3p37fi0kby8pq980-plemoljp-2.0.4/share/fonts/truetype/plemoljp/PlemolJP-Bold.ttf")
LOGO = ASSETS / "branding/wordmark-colour.png"
CURRENT_LANG = "en"

# Source-of-truth PWA tokens: --background 210 25% 98, --primary 220 100% 50,
# --accent 324 100% 46, --foreground 222 47% 11.
NAVY, BLUE, PINK, ICE, MUTED, SKY = "#0b1f33", "#0055ff", "#eb007d", "#f8fafc", "#465b73", "#72b9ef"
FORMATS = {"landscape": (1280, 720), "square": (900, 900), "vertical": (720, 1280)}

MARKETS = {
    "au": {
        "tag": "australia", "voice": "vo-anthem3-au.mp3",
        "head": "know before you go.", "sub": "weather · roads · rides · snow towns",
        "place": "australian mountains, on your terms", "lang": "en",
    },
    "us": {
        "tag": "usa", "voice": "vo-anthem3-us.mp3",
        "head": "the mountain starts\nbefore the lift.", "sub": "conditions that help you choose your window",
        "place": "make the most of the day you have", "lang": "en",
    },
    "jp": {
        "tag": "japan · 日本語", "voice": "vo-anthem3-jp.mp3",
        "head": "行く前に、\n今の山を知ろう。", "sub": "天気 · 道路 · 交通",
        "place": "今のコンディションから旅を考える", "lang": "jp",
    },
    "jp-english": {
        "tag": "japan · english", "voice": "vo-anthem3-jpen.mp3",
        "head": "your japan snow day,\nwith context.", "sub": "mountain weather · roads · transport",
        "place": "plan around the conditions, not the guesswork", "lang": "en",
    },
    "au-japan-winter": {
        "tag": "australia → japan", "voice": "vo-anthem3-au.mp3",
        "head": "plan japan snow\nbefore you fly.", "sub": "compare the regions feelzlike currently covers",
        "place": "check current weather, mountain detail and travel options", "lang": "en",
    },
}

def font(size, bold=False):
    selected = (JP_BOLD if bold else JP_FONT) if CURRENT_LANG == "jp" else (BOLD if bold else FONT)
    return ImageFont.truetype(str(selected), size)

def fit_text(draw, text, xy, max_width, size, fill, bold=False, spacing=7):
    f = font(size, bold)
    lines = []
    for line in text.split("\n"):
        lines += textwrap.wrap(line, width=max(8, int(max_width / (size * .54)))) or [""]
    y = xy[1]
    for line in lines:
        draw.text((xy[0], y), line, font=f, fill=fill, spacing=spacing)
        y += int(size * 1.05)

def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius, fill=fill, outline=outline, width=width)

def scene_image(market, fmt, beat):
    global CURRENT_LANG
    CURRENT_LANG = market["lang"]
    w, h = FORMATS[fmt]
    im = Image.new("RGB", (w, h), ICE)
    d = ImageDraw.Draw(im)
    # ambient bluebird sweep
    for r, a in [(int(w*.62), 25), (int(w*.45), 40), (int(w*.30), 65)]:
        layer = Image.new("RGBA", (w,h), (0,0,0,0)); ld = ImageDraw.Draw(layer)
        ld.ellipse((w-r*.25, -r*.65, w+r*.75, r*.35), fill=(0,85,255,a))
        im = Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")
    d = ImageDraw.Draw(im)
    pad = int(min(w,h)*.07); compact = fmt != "landscape"
    # brand rail
    d.rectangle((0, 0, w, int(h*.026)), fill=BLUE)
    if LOGO.exists():
        logo = Image.open(LOGO).convert("RGBA"); logo.thumbnail((int(w*.22), int(h*.09)))
        im.paste(logo, (pad, pad), logo)
    d = ImageDraw.Draw(im)
    d.text((w-pad-int(w*.24), pad+8), market["tag"], font=font(max(16,int(min(w,h)*.025)), True), fill=NAVY, anchor="ra")
    if beat == 0:
        fit_text(d, market["head"], (pad, int(h*(.27 if compact else .25))), int(w*(.72 if compact else .48)), int(min(w,h)*(.075 if compact else .09)), NAVY, True)
        d.text((pad, int(h*.62)), market["sub"], font=font(int(min(w,h)*.033), True), fill=PINK)
        # Radial, map-like location marks
        cx, cy = (int(w*.70), int(h*.61)) if not compact else (int(w*.67), int(h*.77))
        for rr, col in [(int(min(w,h)*.18), SKY), (int(min(w,h)*.11), BLUE), (int(min(w,h)*.037), PINK)]:
            d.ellipse((cx-rr,cy-rr,cx+rr,cy+rr), fill=col)
        d.line((cx-int(w*.17),cy, cx+int(w*.17),cy), fill=ICE, width=2)
        d.line((cx,cy-int(h*.14), cx,cy+int(h*.14)), fill=ICE, width=2)
        d.text((cx,cy), "now", font=font(int(min(w,h)*.03), True), fill=ICE, anchor="mm")
    elif beat == 1:
        d.text((pad, int(h*.20)), "this is the current feelzlike.", font=font(int(min(w,h)*.055), True), fill=NAVY)
        phone_w, phone_h = (int(w*.39), int(h*.63)) if not compact else (int(w*.65), int(h*.46))
        px, py = (int(w*.53), int(h*.22)) if not compact else (pad, int(h*.39))
        rounded(d, (px,py,px+phone_w,py+phone_h), 35, NAVY)
        rounded(d, (px+10,py+12,px+phone_w-10,py+phone_h-12), 27, ICE)
        d.rectangle((px+10,py+12,px+phone_w-10,py+int(phone_h*.24)), fill=BLUE)
        d.text((px+28,py+int(phone_h*.12)), "today · mountain", font=font(int(phone_w*.055), True), fill=ICE, anchor="lm")
        rounded(d,(px+28,py+int(phone_h*.30),px+phone_w-28,py+int(phone_h*.53)),20,"#ffffff")
        d.text((px+50,py+int(phone_h*.37)),"feels like",font=font(int(phone_w*.05)),fill=MUTED)
        d.text((px+50,py+int(phone_h*.47)),"−8°",font=font(int(phone_w*.16),True),fill=NAVY)
        d.text((px+int(phone_w*.65),py+int(phone_h*.47)),"gusts 44",font=font(int(phone_w*.05),True),fill=PINK)
        for i, lab in enumerate(["hourly", "snow", "wind"]):
            rounded(d,(px+28+i*int(phone_w*.285),py+int(phone_h*.60),px+int(phone_w*.28)+i*int(phone_w*.285),py+int(phone_h*.77)),16,"#dbe9ff")
            d.text((px+int(phone_w*(.15+i*.285)),py+int(phone_h*.69)),lab,font=font(int(phone_w*.045),True),fill=BLUE,anchor="mm")
        fit_text(d, "weather with mountain context.\nnot a generic city forecast.", (pad, int(h*.37 if not compact else .22)), int(w*.40 if not compact else .80), int(min(w,h)*.05), NAVY, True)
    elif beat == 2:
        d.text((pad, int(h*.20)), "choose your route.", font=font(int(min(w,h)*.06), True), fill=NAVY)
        # Route panel references map/transport styling in the current app
        x,y,ww,hh = pad,int(h*.32),w-pad*2,int(h*.42)
        rounded(d,(x,y,x+ww,y+hh),28,"#ffffff")
        d.line((x+int(ww*.12),y+int(hh*.75),x+int(ww*.86),y+int(hh*.21)),fill=BLUE,width=max(6,int(min(w,h)*.014)))
        for lx,ly,label in [(0.14,.74,"base town"),(.48,.48,"pass"),(.86,.21,"mountain")]:
            xx,yy=x+int(ww*lx),y+int(hh*ly)
            d.ellipse((xx-14,yy-14,xx+14,yy+14),fill=PINK)
            d.text((xx,yy+25),label,font=font(int(min(w,h)*.022),True),fill=NAVY,anchor="ma")
        d.text((pad, int(h*.82)), "roads · shuttles · driving context where available", font=font(int(min(w,h)*.028), True), fill=MUTED)
    elif beat == 3:
        d.text((pad, int(h*.18)), "make the call with more than snow.", font=font(int(min(w,h)*.054), True), fill=NAVY)
        cards = [("summit", "wind + feels like", BLUE),("mountain", "snow + lifts", PINK),("town", "stay + eat", NAVY)]
        cw = int((w-pad*2-(2*pad*.35))/3) if not compact else w-pad*2
        for i,(a,b,c) in enumerate(cards):
            x=pad+i*int(cw+pad*.35) if not compact else pad
            y=int(h*.36) if not compact else int(h*(.31+i*.18))
            rounded(d,(x,y,x+cw,y+int(h*.27 if not compact else h*.14)),24,c)
            d.text((x+int(cw*.10),y+int(h*.10 if not compact else h*.05)),a,font=font(int(min(w,h)*.035),True),fill=ICE)
            d.text((x+int(cw*.10),y+int(h*.18 if not compact else h*.10)),b,font=font(int(min(w,h)*.022),True),fill=ICE)
    else:
        fit_text(d, market["place"], (pad, int(h*.25)), int(w*.70), int(min(w,h)*.075), NAVY, True)
        d.text((pad, int(h*.59)), "feelzlike.com", font=font(int(min(w,h)*.05), True), fill=BLUE)
        d.text((pad, int(h*.68)), "know before you go.", font=font(int(min(w,h)*.034), True), fill=PINK)
        d.line((pad, int(h*.77), int(w*.78), int(h*.77)), fill=BLUE, width=3)
        d.text((pad, int(h*.81)), "add it to your home screen · free", font=font(int(min(w,h)*.025)), fill=MUTED)
    return im

def render_video(market_key, fmt, variant):
    m = MARKETS[market_key]; size = FORMATS[fmt]; slug = f"feelzlike-anthem-refresh-2026-09-{market_key}-{fmt}-{variant}"
    frames = OUT / "_frames" / f"{market_key}-{fmt}"; frames.mkdir(parents=True, exist_ok=True)
    for beat in range(5):
        scene_image(m, fmt, beat).save(frames / f"{beat}.png")
    listfile = frames / "inputs.txt"
    listfile.write_text("".join(f"file '{frames / f'{b}.png'}'\nduration 4\n" for b in range(5)) + f"file '{frames / '4.png'}'\n")
    silent = OUT / f"{slug}.mp4"
    raw = OUT / f"{slug}.raw.mp4"
    cmd = ["ffmpeg","-y","-f","concat","-safe","0","-i",str(listfile),"-vf",f"fps=30,format=yuv420p","-frames:v","600","-c:v","libx264","-preset","veryfast","-crf","21","-movflags","+faststart",str(raw)]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # Resolve the final half-second into the opening frame. This is the only
    # transition introduced here: it fixes the delivery loop boundary without
    # changing any beat, layout, copy, or the fixed 20-second runtime.
    subprocess.run(["ffmpeg","-y","-i",str(raw),"-loop","1","-framerate","30","-t","0.5","-i",str(frames/"0.png"),"-filter_complex","[0:v]settb=AVTB,fps=30[a];[1:v]settb=AVTB,fps=30[b];[a][b]xfade=transition=fade:duration=0.5:offset=19.5,format=yuv420p[v]","-map","[v]","-frames:v","600","-c:v","libx264","-preset","veryfast","-crf","21","-movflags","+faststart",str(silent)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    raw.unlink()
    if variant == "voiced":
        voiced = OUT / f"{slug}.tmp.mp4"
        subprocess.run(["ffmpeg","-y","-i",str(silent),"-stream_loop","-1","-i",str(AUDIO/m["voice"]),"-stream_loop","-1","-i",str(AUDIO/"ad-anthem-bed.mp3"),"-filter_complex","[1:a]volume=1.0[v];[2:a]volume=0.14[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[a]","-map","0:v","-map","[a]","-t","20","-c:v","copy","-c:a","aac","-b:a","160k","-movflags","+faststart",str(voiced)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        silent.unlink(); voiced.rename(silent)
    return silent

def main():
    rows=[]
    for market in MARKETS:
        for fmt, (w,h) in FORMATS.items():
            for variant in ("voiced","silent","silent-copy"):
                p=render_video(market,fmt,variant)
                rows.append([p.name,MARKETS[market]["tag"],f"{w}x{h}","20","yes" if variant=="voiced" else "no", "current PWA-token redraw"])
    with (OUT/"manifest.csv").open("w",newline="") as f:
        writer=csv.writer(f); writer.writerow(["file","market","frame","duration_seconds","audio","visual_source"]); writer.writerows(rows)
    # The delivery ZIP contains masters + the concise manifest only, never
    # temporary still frames or the renderer.
    delivery = OUT / "_delivery"
    if delivery.exists(): shutil.rmtree(delivery)
    delivery.mkdir()
    for row in rows: shutil.copy2(OUT / row[0], delivery / row[0])
    shutil.copy2(OUT / "manifest.csv", delivery / "manifest.csv")
    shutil.make_archive(str(OUT/"feelzlike-anthem-refresh-2026-09-all-formats"),"zip",delivery)

if __name__ == "__main__":
    main()