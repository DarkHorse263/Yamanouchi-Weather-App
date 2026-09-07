#!/usr/bin/env bash
set -e

# Generate mask
python3 -c "
from PIL import Image, ImageDraw
w, h = 765, 1654
mask = Image.new('L', (w, h), 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle((0, 0, w-1, h-1), radius=45, fill=255)
mask.save('/tmp/mask_alpha.png')
"

# 1. Build 9:16 master
ffmpeg -y -i ../feelzlike-anthem-au.mp4 \
-framerate 12 -i /tmp/adrec_faithful/au-home/f%04d.png \
-framerate 12 -i /tmp/adrec_faithful/au-mtn/f%04d.png \
-framerate 12 -i /tmp/adrec_faithful/au-qtown/f%04d.png \
-framerate 12 -i /tmp/adrec_faithful/au-alerts/f%04d.png \
-loop 1 -i /tmp/mask_alpha.png \
-filter_complex "
[1:v]fps=30,scale=765:1654,format=yuva420p[v1];
[2:v]fps=30,scale=765:1654,format=yuva420p[v2];
[3:v]fps=30,scale=765:1654,format=yuva420p[v3];
[4:v]fps=30,scale=765:1654,format=yuva420p[v4];
[v1][v2]xfade=transition=fade:duration=1:offset=8[x12];
[x12][v3]xfade=transition=fade:duration=1:offset=18[x123];
[x123][v4]xfade=transition=fade:duration=1:offset=21[ui_full];
[5:v]format=gray[mask];
[ui_full][mask]alphamerge[ui_masked];
[0:v][ui_masked]overlay=x=158:y=133:enable='between(t,0,27)'[v_out]
" -map "[v_out]" -map 0:a -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -c:a copy -t 34.300 /tmp/master.mp4

# 2. Build Landscape (1920x1080)
ffmpeg -y -i /tmp/master.mp4 \
-filter_complex "
[0:v]scale=1920:-1,crop=1920:1080,boxblur=30,colorlevels=rimin=0.0:gimin=0.0:bimin=0.0:rimax=1.0:gimax=1.0:bimax=1.0:romin=0.0:gomin=0.0:bomin=0.0:romax=0.8:gomax=0.8:bomax=0.8[bg];
[0:v]scale=-1:1080[fg];
[bg][fg]overlay=(W-w)/2:(H-h)/2[out]
" -map "[out]" -map 0:a -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -c:a copy -t 34.300 feelzlike-anthem-au-landscape-current-ui.mp4

# 3. Build Square Silent (1000x1000)
ffmpeg -y -i /tmp/master.mp4 \
-filter_complex "
[0:v]scale=1000:-1,crop=1000:1000,boxblur=30,colorlevels=rimin=0.0:gimin=0.0:bimin=0.0:rimax=1.0:gimax=1.0:bimax=1.0:romin=0.0:gomin=0.0:bomin=0.0:romax=0.8:gomax=0.8:bomax=0.8[bg];
[0:v]scale=-1:1000[fg];
[bg][fg]overlay=(W-w)/2:(H-h)/2[out]
" -map "[out]" -an -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -t 34.300 feelzlike-anthem-au-square-silent-current-ui.mp4
