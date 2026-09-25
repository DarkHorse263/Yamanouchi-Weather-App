/**
 * Publication boundary for authored region notes and imported catalogue copy.
 * Research/provenance remains in the source records; it is not suitable for
 * visitor-facing mountain descriptions. Never turn an unverified assertion
 * into a positive claim just by removing its caveat.
 */
const RESEARCH_NOTE = /⚠️|unverified|in research|treat as|per resort|2025[-–/]26|2025–26|tracker|not confirmed|unconfirmed|conflicting|source reporting|sources disagree|research|verify-status|first-party|independently|at time of writing|season dates uncertain|source reviewed|data gap/i;
const DATE_NOTE = /\b(?:Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct)\s+\d{1,2}(?:[,\s-]+\d{4})?\b/i;

export function visitorCopy(copy: string | undefined, language: "en" | "ja" = "en"): string | undefined {
  if (copy == null || !RESEARCH_NOTE.test(copy)) return copy;
  // Each dot-separated clause is a claim. Reject the whole uncertain clause:
  // deleting only "unverified" would misrepresent an unconfirmed webcam/pass.
  const safe = copy.split(/\s*·\s*/u)
    .filter((part) => !RESEARCH_NOTE.test(part) && !DATE_NOTE.test(part))
    .map((part) => part.trim())
    .filter(Boolean);
  const notice = language === "ja"
    ? "最新の営業状況・利用条件はスキー場の公式サイトでご確認ください。"
    : /avalanche/i.test(copy)
      ? "Check local avalanche advisories and resort guidance before entering exposed terrain."
      : /ski.only|snowboard/i.test(copy)
        ? "Check the resort's current snowboard access rules before travelling."
        : "Check the resort's official site for current operating status and pass terms before travelling.";
  // Avoid displaying an anonymous research caveat or implying that missing
  // operational information is verified. Retain independently stated facts.
  return safe.length ? `${safe.join(" · ")}. ${notice}` : notice;
}

export function visitorLabel(label: string): string {
  if (!RESEARCH_NOTE.test(label)) return label;
  // A link's name is not an operational-status claim; remove only the
  // dated research note in parentheses, leaving the destination name intact.
  const name = label.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return RESEARCH_NOTE.test(name) ? visitorCopy(name) ?? name : name;
}