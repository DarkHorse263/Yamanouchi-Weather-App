// Re-export the shared shell hook for app-local media surfaces. There is one
// implementation so document visibility and IntersectionObserver semantics do
// not drift between pages.
export { useMediaActivity } from "@workspace/feelzlike-shell";
export type { MediaActivityState } from "@workspace/feelzlike-shell";