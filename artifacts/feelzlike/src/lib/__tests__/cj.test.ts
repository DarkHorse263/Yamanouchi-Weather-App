import { test } from "node:test";
import assert from "node:assert/strict";

import { buildCjDeepLink, cjLinkFor, cjConfigured, isValidCjAid, CJ_DEFAULT_DOMAIN } from "../cj";

// NOTE: run in a plain node env (tsx --test), so import.meta.env is undefined
// and VITE_CJ_PUBLISHER_ID is therefore null. That lets us assert the
// "unconfigured" safety behaviour without touching real config.

test("buildCjDeepLink builds the canonical CJ click URL with default domain", () => {
  const url = buildCjDeepLink(
    "https://www.booking.com/searchresults.html?ss=Wanaka&lang=en-us",
    { pid: "1234567", aid: "12345678" },
  );
  assert.equal(
    url,
    `https://${CJ_DEFAULT_DOMAIN}/click-1234567-12345678?url=` +
      encodeURIComponent("https://www.booking.com/searchresults.html?ss=Wanaka&lang=en-us"),
  );
});

test("buildCjDeepLink url-encodes the destination (no raw ? & = leak)", () => {
  const url = buildCjDeepLink("https://www.agoda.com/search?q=Niseko&x=1", {
    pid: "1234567",
    aid: "87654321",
  });
  // The only ? in the final URL must be CJ's own; the destination's ? & = are encoded.
  const afterClick = url.slice(url.indexOf("click-"));
  assert.equal((afterClick.match(/\?/g) ?? []).length, 1);
  assert.ok(url.includes("url=https%3A%2F%2Fwww.agoda.com%2Fsearch%3Fq%3DNiseko%26x%3D1"));
});

test("buildCjDeepLink appends sid when provided", () => {
  const url = buildCjDeepLink("https://www.expedia.com/Hotel-Search?destination=Wanaka", {
    pid: "1234567",
    aid: "12345678",
    sid: "wanaka_wanaka",
  });
  assert.ok(url.endsWith("&sid=wanaka_wanaka"));
});

test("buildCjDeepLink honours a per-advertiser domain override", () => {
  const url = buildCjDeepLink("https://www.hotels.com/Hotel-Search?destination=Hakuba", {
    pid: "1234567",
    aid: "12345678",
    domain: "www.dpbolvw.net",
  });
  assert.ok(url.startsWith("https://www.dpbolvw.net/click-1234567-12345678?url="));
});

test("isValidCjAid accepts only 8-digit ids (trimmed)", () => {
  assert.equal(isValidCjAid("12345678"), true);
  assert.equal(isValidCjAid("  12345678  "), true);
  assert.equal(isValidCjAid("1234567"), false); // 7 digits
  assert.equal(isValidCjAid("123456789"), false); // 9 digits
  assert.equal(isValidCjAid("1234567a"), false); // non-numeric
  assert.equal(isValidCjAid(""), false);
});

test("cjLinkFor returns null when CJ is unconfigured (no publisher id)", () => {
  assert.equal(cjConfigured(), false);
  assert.equal(
    cjLinkFor("booking", "https://www.booking.com/searchresults.html?ss=Wanaka"),
    null,
  );
});
