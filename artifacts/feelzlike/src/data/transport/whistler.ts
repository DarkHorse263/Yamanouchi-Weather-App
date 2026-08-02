import type { TransportProviderList } from "@/types/transport";

/**
 * Whistler (BC, Canada) transport providers.
 *
 * Empty in this pass · no operator has been curated to the same standard as
 * the AU/JP/NZ entries (verified operator, route summary, and a schedule or
 * website that survives the daily link smoke test). The Transport page
 * renders its empty state rather than shipping guessed timetables.
 */
export const WHISTLER_TRANSPORT: TransportProviderList = [];
