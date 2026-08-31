export interface LinkContentCheck {
  expectedAny?: string[];
}

export type ContentIntegrityVerdict =
  | { ok: true }
  | { ok: false; detail: string };

const PARKING_SIGNALS = [
  /\bthis domain (?:is|may be) for sale\b/i,
  /\bbuy this domain\b/i,
  /\bdomain (?:parking|parked)\b/i,
  /\b(?:sedo|afternic) domain parking\b/i,
];

const SPAM_COMMERCE_SIGNALS = [
  /\breplica(?:s|[a-z]{3,20}|\s+(?:watch|handbag|bag|shoe))?\b/i,
  /\b(?:cheap|discount)\s+(?:rolex|vapes?|handbags?|luxury watches)\b/i,
  /\b(?:casino|payday loan|online pharmacy)\b/i,
];

const HIDDEN_OFFSCREEN_STYLE =
  /(?:position\s*:\s*absolute[^>]{0,160}(?:left|top)\s*:\s*-\d{3,}px|(?:left|top)\s*:\s*-\d{3,}px[^>]{0,160}position\s*:\s*absolute)/i;

/**
 * Conservative content checks for curated transport pages.
 *
 * Parking phrases are strong enough to fail alone. Commerce spam only fails
 * when it appears inside an off-screen element, avoiding false alarms from
 * legitimate prose, adverts, or operator names. Identity assertions are
 * opt-in per stable operator in the generated link manifest.
 */
export function checkExternalLinkContent(
  html: string,
  check: LinkContentCheck = {},
): ContentIntegrityVerdict {
  const normalised = html.replace(/\s+/g, " ");

  if (PARKING_SIGNALS.some((signal) => signal.test(normalised))) {
    return { ok: false, detail: "page looks domain-parked or offered for sale" };
  }

  const hiddenTags =
    normalised.match(
      /<(span|div|p)\b[^>]*style\s*=\s*["'][^"']+["'][^>]*>[\s\S]{0,20000}?<\/\1>/gi,
    ) ?? [];
  if (
    hiddenTags.some(
      (fragment) =>
        HIDDEN_OFFSCREEN_STYLE.test(fragment) &&
        SPAM_COMMERCE_SIGNALS.some((signal) => signal.test(fragment)),
    )
  ) {
    return { ok: false, detail: "page contains off-screen commerce spam consistent with a content hijack" };
  }

  const expected = check.expectedAny?.map((value) => value.trim()).filter(Boolean) ?? [];
  if (expected.length > 0) {
    const lower = normalised.toLowerCase();
    if (!expected.some((value) => lower.includes(value.toLowerCase()))) {
      return {
        ok: false,
        detail: `page is missing expected operator identity (${expected.join(" or ")})`,
      };
    }
  }

  return { ok: true };
}