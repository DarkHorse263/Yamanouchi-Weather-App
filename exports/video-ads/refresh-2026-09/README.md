# feelzlike social anthem · refresh 2026-09

**Design source:** current `artifacts/feelzlike` PWA, not the August 2026 creative.
The refresh uses its Bluebird palette: deep navy `#0b1f33`, primary blue
`#0055ff`, accent pink `#eb007d`, ice `#f8fafc`, rounded 2rem cards, and the
official DIN Pro / colour wordmark assets. The editorial direction is **Bluebird
field notes**: a moving mountain-conditions dashboard that turns current
weather, route context and town planning into a concise travel decision.

## Coverage

The export matrix retains Australia, USA, Japanese-language Japan and
English-language Japan, and adds **Australia → Japan winter**. Every market has
three recomposed fixed canvases: `landscape` (`16:9`), `square` (`1:1`) and
`vertical` (`9:16`), each with `voiced`, `silent` and `silent-copy` files.

The Australia → Japan cut is intentionally scoped to Japanese regions currently
covered by feelzlike. It does not claim nationwide road, webcam or resort
coverage. Its claim is limited to current mountain weather, mountain details
and route/transport context where available.

## Audio

`voiced` variants mix the existing campaign-language voice asset with the
existing licensed anthem bed. `silent` and `silent-copy` contain no audio
stream. `silent-copy` retains all on-screen copy for accessibility-led
placements. `manifest.csv` is the concise output manifest.

## Rebuild

```sh
python3 exports/video-ads/refresh-2026-09/build_refresh.py
```

The script outputs 20-second, H.264/AAC social masters with fast-start enabled,
then rebuilds `feelzlike-anthem-refresh-2026-09-all-formats.zip`.