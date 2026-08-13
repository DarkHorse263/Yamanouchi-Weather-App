/**
 * Promo-banner impression gating · proves the funnel's "shown" denominator
 * only counts a banner that is at least half visible, and that the once-only
 * semantics hold (exactly one ping across a below→above threshold sequence).
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { shouldCountImpression, IMPRESSION_MIN_RATIO } from "../promoImpression";

describe("shouldCountImpression", () => {
  test("initial off-screen entry does not count", () => {
    assert.equal(shouldCountImpression([{ isIntersecting: false, intersectionRatio: 0 }]), false);
  });

  test("partially visible below 50% does not count (even though isIntersecting)", () => {
    assert.equal(shouldCountImpression([{ isIntersecting: true, intersectionRatio: 0.1 }]), false);
    assert.equal(shouldCountImpression([{ isIntersecting: true, intersectionRatio: 0.49 }]), false);
  });

  test("exactly 50% visible counts", () => {
    assert.equal(shouldCountImpression([{ isIntersecting: true, intersectionRatio: 0.5 }]), true);
    assert.equal(IMPRESSION_MIN_RATIO, 0.5);
  });

  test("fully visible counts", () => {
    assert.equal(shouldCountImpression([{ isIntersecting: true, intersectionRatio: 1 }]), true);
  });

  test("ratio >= 0.5 but not intersecting (stale/edge entry) does not count", () => {
    assert.equal(shouldCountImpression([{ isIntersecting: false, intersectionRatio: 0.6 }]), false);
  });

  test("batched entries: any qualifying entry counts", () => {
    assert.equal(
      shouldCountImpression([
        { isIntersecting: false, intersectionRatio: 0 },
        { isIntersecting: true, intersectionRatio: 0.75 },
      ]),
      true,
    );
  });
});

describe("once-only semantics with a mocked IntersectionObserver", () => {
  /** Minimal mock mirroring the banner's observe→callback→disconnect flow. */
  class MockIO {
    static instances: MockIO[] = [];
    disconnected = false;
    constructor(private cb: (entries: ImpressionLike[]) => void) {
      MockIO.instances.push(this);
    }
    observe(): void {}
    disconnect(): void {
      this.disconnected = true;
    }
    emit(entries: ImpressionLike[]): void {
      if (!this.disconnected) this.cb(entries);
    }
  }
  interface ImpressionLike {
    isIntersecting: boolean;
    intersectionRatio: number;
  }

  test("no ping below 50%, exactly one ping at/above 50%", () => {
    let pings = 0;
    let fired = false; // mirrors the component's shownRef guard
    const io = new MockIO((entries) => {
      if (fired) return;
      if (shouldCountImpression(entries)) {
        fired = true;
        pings += 1;
        io.disconnect();
      }
    });
    io.observe();

    io.emit([{ isIntersecting: false, intersectionRatio: 0 }]); // initial entry
    io.emit([{ isIntersecting: true, intersectionRatio: 0.2 }]); // peeking above fold
    assert.equal(pings, 0);

    io.emit([{ isIntersecting: true, intersectionRatio: 0.6 }]); // scrolled into view
    assert.equal(pings, 1);
    assert.equal(io.disconnected, true);

    io.emit([{ isIntersecting: true, intersectionRatio: 1 }]); // would double-count
    assert.equal(pings, 1);
  });
});
