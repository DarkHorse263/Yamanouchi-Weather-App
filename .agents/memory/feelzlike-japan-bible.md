---
name: feelzlike Japan resort bible (558-resort xlsx)
description: User's master Japan resort spreadsheet — where it lives, truth-test verdict, and the specific rows known to be wrong. Check here before trusting a row.
---

# Japan bible — user's 558-resort spreadsheet

- File: `attached_assets/Japan_Ski_Resorts_558_1783900482697.xlsx` (user-designated reference "bible", July 2026, sourced from skiresort.info + Epic/Ikon 25-26 pass data). 5 sheets: All Resorts / Pass Reference / Region Summary / Town-Village / Prefecture. No sharedStrings — inline-string xlsx, parse cells manually.
- Counts: 563 data rows = 558 numbered resorts + lettered sub-areas (Niseko 1a-d, GALA group 19a-c). Title/summary claim "564" — off by one. 558 matches skiresort.info's range (553-558). Use 558 as the number.

## Truth-test verdict (July 2026): largely accurate, with known errors
Verified correct: Epic Japan = Hakuba Valley 10 + Rusutsu, 5 consecutive days each; Ikon 25-26 Japan expansion (Niseko United, Lotte Arai, + new: Shiga Kogen MR 18 areas, Mt.T/Tanigawadake Tenjindaira, Myoko Suginohara, Furano, Appi, Nekoma, Zao Onsen); region/prefecture row counts internally consistent; no duplicate names.

**Known WRONG rows (do not copy into the app):**
- Yunomaru (#70): NOT Shiga Kogen / NOT Yamanouchi / NOT Ikon — it's Yunomaru Kogen, Tomi City.
- Kitashiga Kogen Kumaruyama (#372) + Kitashiga Highlands (#483): tagged Ikon + "Shiga Kogen" — Kita Shiga is a separate ski area, NOT on Ikon (Ikon = the 18 official Shiga Kogen MR areas only).
- Ryuoo Ski Park (#102): town/muni "Shiojiri" — actually Yamanouchi (Kita-Shiga).
- Washigatake/White Pia (#27): town "Gero" — actually Gujo (Takasu), and it merges two separate resorts.
- Yokotsudake Kokusai (#502): town "Kutchan"/Niseko United — actually Nanae, near Hakodate (long-defunct).
- Niseko Weiss (#417): status "Open" — lifts gone, cat-skiing only (Hanazono-run Powder CATS).
- Moiwa (#83) valley "Niseko United" — Moiwa is independent, NOT on the United all-mountain pass.
- Rusutsu "Epic/Ikon": sources conflict on whether Rusutsu is still Ikon in 25-26 (Epic is certain) — re-verify before publishing pass info.
- Alts Bandai + Nekoma listed as two Ikon rows — they're one merged resort (Nekoma Mountain South/North).

**How to apply:** great for coverage planning (which valley/town clusters exist, rough ratings, pass flags) but every row that feeds user-facing app data (towns, passes, status) must be independently verified — the error pattern is same-name confusion (Yunomaru, Shiga pref vs Shiga Kogen) and stale status.
