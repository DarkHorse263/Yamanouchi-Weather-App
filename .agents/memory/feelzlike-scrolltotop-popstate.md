---
name: feelzlike scroll-to-top popstate trap
description: Why ScrollToTop must ignore synthetic popstate events, or the next forward nav skips scroll-to-top.
---

ScrollToTop (artifacts/feelzlike/src/App.tsx) must treat a popstate as "user back/forward" only when the event is a real `PopStateEvent`. It MUST ignore synthetic `new Event("popstate")`.

**Why:** urlState.ts and the Eat/Stay filter bars do `history.replaceState(...query...)` + `dispatchEvent(new Event("popstate"))` for query-only updates. wouter's `useLocation` tracks the PATHNAME only, so those query-only dispatches never re-run ScrollToTop's location effect, which means the "was a pop" flag set by the popstate listener is never consumed and leaks into the NEXT real forward navigation, which then wrongly preserves the old scroll position. Symptom the owner reported: a page (e.g. Transport) "opens half way down the page" after the user has touched a filter or triggered any urlState write. It does NOT reproduce on a clean Today -> Transport click, which is why an earlier Playwright run looked green; it only reproduces when a synthetic popstate fired since the last real navigation.

**How to apply:** Guard the popstate listener with `if (e instanceof PopStateEvent)`. Genuine browser back/forward and the in-app BackBar `history.back()` fire real PopStateEvents and stay honored (browser scroll restoration preserved). If you add more `dispatchEvent(new Event("popstate"))` callers, this guard keeps scroll-reset correct, so do not remove it.
