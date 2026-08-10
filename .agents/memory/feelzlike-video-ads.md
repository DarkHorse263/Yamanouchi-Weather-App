---
name: feelzlike AI video ads
description: How the 15s/30s vertical video ads are produced (AI clips + real app screenshots + TTS) and the traps hit.
---

# feelzlike AI video ads (Aug 2026)

Output: `exports/video-ads/feelzlike-ad-{15s,30s}.mp4` (1080x1920 9:16). Owner assets, exports only — never public/downloads.

**Recipe** (no build script; assembled ad hoc with ffmpeg):
- People footage = `generateVideo` clips (8s max, 9:16, highQuality, allow_adult). Prompt phones "screen facing away, never visible" — the model would otherwise hallucinate a fake app UI, which breaks the owner's honesty rule.
- **generateVideo output is SILENT — no speech/audio track.** "People speaking" = ElevenLabs TTS layered over the footage. Voices used: Jess `ys3XeJJA4ArWMhRpcX1D` (casual AU female, dialogue) + Daryl `PA1XYeK584cPbgobwKAc` (AU male radio, closer/CTA).
- App segments = REAL live prod phone screenshots (puppeteer 390x800 dpr2, consent pre-seeded — same tricks as build-social-ads) padded on #0055FF with a slow zoompan. Headless chromium has **no emoji font — country flag emojis render as boxes**; avoid frames showing the home country cards, use weather/transport pages.
- Puppeteer scripts must run FROM an artifact dir (pnpm isolation; /tmp scripts can't resolve puppeteer) and need `executablePath` pointed at the nix chromium (`which chromium`).
- End card = HTML rendered via chromium: dark-bg full logo asset + "real conditions for mountain travel" + white pill "free until 31 december · feelzlike.com".
- Mix: music bed via `generateMusic`, VO placed with `adelay`, music ducked under VO with `sidechaincompress` (needs `asplit` — a filter label can't be consumed twice), `loudnorm=I=-16:TP=-1.5`.
- Owner feedback baked in (v3): people DRIVE to snow from town (no snow at the door/window), nobody talks on camera (generated lips can't sync to TTS — narration only), no "free until" line in video ads. App-on-screen shots are HONEST: generate a locked-off clip of a phone with a plain WHITE screen, then corner-pin the real screenshot onto it — and it must be tracked PER FRAME (a static pin over a hand-held phone reads as fake; owner rejected it). Recipe: flood-fill the white region from a centre seed each frame (extreme-point corner picking gets poisoned by lamp glow; clips are 720x1280 native), temporal-smooth the quad, PIL PERSPECTIVE warp with rounded-corner feathered mask + slight brighten, re-encode frames.
- Cars in AU/NZ footage must be RIGHT-HAND DRIVE, driving on the LEFT — prompt it explicitly or the model produces LHD.
- App-screen ads (no people): record live prod pages via puppeteer as 12fps frame sequences (390x844 dpr2, consent + `feelzlike:installDismissedAt` pre-seeded), round-corner overlay on brand gradient, xfade concat. Promo chips ("until 31 dec") must be hidden with a MutationObserver installed via evaluateOnNewDocument — one-shot hides get undone by React re-renders — and the selector must include `button` (the chip is a BUTTON, not span/div).
- TTS voices come back at wildly different levels (one read was ~24dB quieter than another) — always loudnorm each VO before mixing, or the music bed buries it. To make the closer land on the end card, split the VO at the last silence (silencedetect; threshold varies per voice) and delay the tail separately.
- /tmp gets wiped between sessions/restarts — keep the silent master video in exports/ (anthem-master-silent.mp4) so audio remixes don't force a full re-record.
- Anthem voice set: AU Charlotte gEdKKVxVhNCulBgRQ9GW, US Misha DXX4Q5Bh1vqK8CciYVPf, JP Bilingual Sakura HBr48ROZd1B2dv74C8bN; long reads may need atempo to fit the cut. "Robert Miles Children" ask = prompt "mid-90s dream trance, piano-led, four-on-the-floor" (never name the track).
- Copy honesty rails same as the fb pack: no live-lifts claim, no app-store wording, promo line "free until 31 december".
