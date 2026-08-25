# Japan `verified_operating` source audit

Audit date: 2026-08-26  
Scope: all 236 records marked `verified_operating` in the eight JSON review batches. This audit does **not** change any review conclusion.

## Method

I inspected every in-scope record structurally: presence and syntax of both URLs, source host versus operator host, repeated URLs, quoted text, evidence date, and the English/Japanese names against the supplied official name fields. I also checked every repeated URL group rather than treating a repeated host as a duplicate.

“Prior-season citation” below means the quote expressly cites 2024-25 or 2025-26 information while `evidenceAsOf` is 2026-08-26. It is a freshness warning, not proof that a resort has closed: seasonal resorts can be perfectly viable between seasons. It does mean the record does not establish a current or forthcoming 2026-27 operating plan as of its stated evidence date.

Targeted web search/fetch spot checks were made for the highest-risk patterns: the Niigata master directory, the Shiga Kogen season-pass page, the Takasu/Dynaland shared promotion page, Hachi/Hachi Kita, Ringo Kyowakoku, and the Yuzawa Nakazato/Nakazato Snow Wood URL collision. Those checks confirmed the pattern-level concerns below (in particular, the Hachi page exposed dated 2020 status fields and a 2024 opening notice; the Ringo tourism listing describes limited/advance-contact operation and independent directories label recent status unknown). They were not a live re-verification of every resort.

## Batch results

| Batch | Verified records checked | Blank/malformed official URLs | Non-operator status source | Prior-season dated quote | Quote plainly does not establish operation | Audit outcome |
|---|---:|---:|---:|---:|---:|---|
| central-kansai | 38 | 0 | 12 | 11 | 12 | Source quality needs targeted repair |
| hokkaido | 16 | 0 | 4 | 8 | 2 | Niseko shared-source and freshness follow-up |
| kanto | 27 | 0 | 2 | 11 | 7 | Replace narrative/non-evidentiary quotes |
| nagano | 19 | 0 | 6 | 16 | 1 | Shiga Kogen shared season-pass evidence is insufficient |
| niigata-hokuriku | 51 | 0 | 42 | 37 | 2 | Largest concentration: reused prefectural directory and stale season dates |
| tohoku-north | 24 | 0 | 1 | 4 | 1 | Small targeted refresh |
| tohoku-south | 40 | 0 | 0 | 35 | 0 | URLs/quotes generally aligned, but almost all dated support is prior season |
| west-south | 21 | 0 | 8 | 9 | 4 | Ringo is critical; several directory-only records need replacement |
| **Total** | **236** | **0** | **75** | **131** | **29** | **No conclusion changes made** |

Counts overlap. For example, an old tourism-directory quote can count both as non-operator and prior-season. “Non-operator” includes a destination or government tourism page when it is the only status source; it does not imply the page is untrustworthy, only that it is not the resort’s current operations channel.

### What passed the all-record check

* No `verified_operating` record has a blank or syntactically malformed `officialUrl` or `statusEvidenceUrl`.
* I found no obvious English/Japanese identity mismatch in the supplied name fields. Variants such as Washitopia, Grand Snow Okuibuki, and the Hachi pair reconcile to their Japanese official names.
* The two repeated official URLs are not automatically errors: Hachimantai Panorama/Shimokura are areas of the same Hachimantai operation; Yuzawa Nakazato/Nakazato Snow Wood require the separate collision check below.
* Many same-URL cases are legitimate umbrella areas (Niseko United and Shiga Kogen), but their status evidence still needs to identify the relevant resort/area and season.

## Record-level correction list

Priority describes the evidence correction needed, **not** a change to operating status.

### Critical

1. **`west-south.json` — `workbook:374` (Ringo Kyowakoku).** The `officialUrl` and `statusEvidenceUrl` are both the same `dive-hiroshima.com` tourism directory page, so this record has no operator official URL at all. The supplied quote is a broad “eight sites plan to operate” statement, not Ringo-specific current operation. Search spot checks further show highly limited/conditional opening and no confirmed recent season in independent listings. Find and cite an operator/municipal current notice, or explicitly document that no official operating source is available.

### High

1. **`niigata-hokuriku.json` — 42 records:** `workbook:6`, `:13`, `:14`, `:19a`, `:19b`, `:19c`, `:21`, `:22`, `:23`, `:32`, `:43`, `:44`, `:45`, `:49`, `:59`, `:76`, `:91`, `:92`, `:95`, `:96`, `:105`, `:118`, `:127`, `:167`, `:178`, `:180`, `:194`, `:219`, `:245`, `:273`, `:281`, `:301`, `:304`, `:315`, `:324`, `:332`, `:373`, `:400`, `:401`, `:415`, `:436`, `:542`.**  
   Thirty-five of these reuse `https://niigata-kankou.or.jp/ski`; the remainder use regional/travel directories or another-area operator site. The quoted 2025-26 opening/closing dates can support a past season, but not status at the August 2026 as-of date. The Niigata directory was spot-checked as a master listing, not an individual operator-status feed. Replace with each resort’s 2026-27 official notice, season pass/on-sale page, lift-operation page, or dated closure/opening announcement. `:281` also has only the generic “SAM Hakusan Ichirino and Seymour Ski Areas” quote.

2. **`nagano.json` — Shiga Kogen cluster:** `workbook:5`, `:39`, `:55`, `:75`, `:78`, `:112`, `:168`, `:176`, `:184`, `:189`, `:212`, `:276`, `:294`.**  
   All thirteen cite one `shigakogen-ski.or.jp/winter/season-pass/` URL. A season-pass page is not current lift/slope operation evidence for each named area, and the cluster’s quoted seasonal material is predominantly 2025-26. The page was spot-checked. Preserve the valid shared-area relationship if appropriate, but cite a current 2026-27 Shiga Kogen/area-specific operations notice for each record (or an explicitly scoped umbrella status source that names the covered areas).

3. **`central-kansai.json` — `workbook:18` (Takasu Snow Park) and `workbook:28` (Dynaland).** Both point at `https://takasudyna.com/` and quote only “25-26 Takasu Dyna promotion video.” That neither says either resort is operating nor distinguishes them. Replace with each resort’s own current operations/season notice.

4. **`central-kansai.json` — directory-only evidence:** `workbook:25` (Hachikogen/Hachi Kita), `:94` (Ojiro), `:97` (Sky Valley), `:156` (Hyounosen Kokusai), `:179` (Wakasugi Kogen Oya).**  
   All rely on the single Hyogo tourism ski directory. The Hachi spot check found obsolete-looking current-condition fields and a 2024 opening notice on the operator site, reinforcing that the directory’s 2025-26 dates should not be carried forward. Replace with operator status notices; do not infer current operation from the directory.

5. **`central-kansai.json` — `workbook:114` (Hyper Bowl Tohachi), `:170` (Mont Deus Hidakuraiyama), `:209` (Mineyama Kogen), `:258` (Motai), `:300` (Gujo Kogen).**  
   These use a rail guide, school subdomain, or tourism directory rather than current operator evidence; four also show prior-season material. Locate current operator-issued pages.

6. **`west-south.json` — directory-only evidence:** `workbook:173` (Osa), `:246` (Solfa Oda), `:277` (Hiruzen Bear Valley), `:290` (Gokase Highlands), `:320` (Daisen–Masumizu Kogen), `:343` (Dogoyama Kogen), `:363` (Wakasa Hyonosen), `:419` (Daisen White Resort).**  
   These depend on destination directories. The repeated Hiroshima and Tottori URLs cover multiple unrelated resorts; the Tottori page’s “2025-2026” guide is especially stale at the record’s as-of date. Replace with each operator’s current notice. `:246`’s quote is a useful operation claim but remains third-party; `:290`, `:320`, `:363`, and `:419` also cite 2025-26 season material.

7. **`niigata-hokuriku.json` — `workbook:167` (Yuzawa Nakazato) and `workbook:324` (Nakazato Snow Wood).** Both have exactly `https://www.yuzawa-nakazato.com/winter/` as their official URL although they are separate intake rows. Search results treat Nakazato Snow Wood separately from Yuzawa Nakazato. Confirm whether the former has merged, been renamed, or has a distinct official URL; correct the misassigned URL if not an intentional successor relationship.

### Medium

1. **`kanto.json` — `workbook:109` (Minakami Kogen), `:140` (Kawaba), `:183` (Kazawa), `:200` (Kamui Misaka), `:203` (Norn Minakami), `:334` (Manza Onsen), `:339` (Shizuokashi Riverwell Ikawa).**  
   Each quote is a reviewer-style assertion (“the official site maintains…”) rather than text attributable to the linked page. Even where the official URL is plausible, replace it with a dated, verbatim operation/season statement and a deep link. The majority of Kanto records also cite 2025-26 material, so refresh at the same time.

2. **`central-kansai.json` — unsupported generic-homepage quotes:** `workbook:42` (Meiho), `:48` (Winghills Shirotori), `:113` (Hida Nagareha), `:115` (Okuibuki), `:165` (Hakodateyama), `:220` (Hirayu Onsen), `:250` (Kutsuki), `:314` (Hidatakayama), `:359` (Tajima Bokujo Koen).**  
   The quote is a name, tagline, or “latest information” label, not evidence of operation. Link to a dated season/conditions notice. `:42`, `:48`, `:113`, `:115`, `:250`, and `:314` use a homepage as the evidence URL.

3. **`hokkaido.json` — `workbook:1a` (Niseko Grand Hirafu), `:1b` (Niseko Village), `:1c` (Niseko Annupuri), `:1d` (Niseko Hanazono).**  
   A shared Niseko United news item can be appropriate umbrella evidence, but the record set should cite a current 2026-27 item and make coverage of all four areas explicit. `:1a`’s new-lift quote alone is not an operational statement; the other three contain old-season material.

4. **`nagano.json` — `workbook:348` (Kisofukushima).** “25-26 season-pass application form” establishes neither opening nor current operation. Replace with a dated operator status page.

5. **`tohoku-north.json` — `workbook:139` (Owani Onsen).** The quote says visitors increased on a specific day but does not actually say lifts/slopes were operating. Use the linked official conditions/operations entry with the operating statement. Also refresh the four 2025-26 dated records in this batch (`:129`, `:204`, `:329` plus the already-listed `:139`) when 2026-27 notices appear.

6. **`west-south.json` — `workbook:268` (Ishizuchi), `:397` (Osorakan), `:406` (Onbara Kogen).** Name/tagline snippets and a condition-page label are not operating facts. Replace with dated conditions or opening/closure notices.

## Reused-source and freshness follow-up

The following repeats were reviewed but are not separate defects solely because they repeat:

* **Hachimantai Panorama/Shimokura** share an operator winter URL and are related areas; retain only if the linked page explicitly covers both.
* **Niseko United** is a related four-resort umbrella source, but needs current, named coverage as noted above.
* **Hyogo tourism (five), Hiroshima tourism (three), Tottori guide (three), and Niigata tourism (35)** are reused across unrelated resorts. These are the strongest directory-only risks; do not use one directory URL as a substitute for each operator’s current status.
* The Shiga Kogen season-pass URL is reused by thirteen related areas. Relationship alone does not turn a pass page into operating evidence.

Finally, 131 records explicitly quote prior-season dates. The batch table states exactly how many were found; the high/medium list prioritizes the cases where staleness combines with a directory, generic page, or weak quote. The remaining dated records were checked for this condition but are not individually escalated here because their operator-linked source and quotation otherwise identify the resort and a real past operating season. Refresh them before representing the evidence as current 2026-27 verification.