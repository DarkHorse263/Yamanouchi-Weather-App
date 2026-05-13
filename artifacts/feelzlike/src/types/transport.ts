/**
 * Transport providers - region-isolated data layer.
 *
 * Each provider declares which `regions` it serves. The `regionGuard.ts`
 * helper enforces that no provider leaks into a region it doesn't belong to
 * (e.g. AU bus operators rendering on a JP page).
 */
import type { RegionId } from "@workspace/api-client-react";

export type TransportType =
  | "bus"
  | "train"
  | "shuttle"
  | "taxi"
  | "rental_car";

export interface TransportProvider {
  /** Stable id, region-prefixed: "au-cooma-coaches", "jp-nagaden". */
  id: string;
  /** Display name (English / Romaji). */
  name: string;
  /** Optional local-language name (kanji / kana). */
  name_local?: string;
  type: TransportType;
  /** Operating company / brand if different from `name`. */
  operator: string;
  /** Verified phone number, or `null` when unknown - never guess. */
  phone: string | null;
  /** Verified website URL, or `null` when unknown. */
  website: string | null;
  /** One-line plain-English route or coverage summary. */
  route_summary: string;
  /** Optional local-language route summary. */
  route_summary_local?: string;
  /** Direct deep-link to a published timetable page, if available. */
  schedule_url?: string | null;
  /**
   * Regions this provider serves. The regionGuard rejects any record where
   * this array does not include the active region - the core anti-leak
   * mechanism.
   */
  regions: RegionId[];
  /**
   * Optional season filter for AU operators.
   * - "year_round" (or omitted) renders in both winter and green seasons.
   * - "winter_only" hides the provider in the AU green season (Dec-May)
   *   so visitors aren't told to book a coach that isn't running.
   */
  seasonality?: "year_round" | "winter_only";
  /**
   * Mountain IDs (within the provider's region) this operator actually
   * serves. Used by town-level Transport pages to filter the grid: a town
   * only shows ops whose `mountains_served` overlaps that town's
   * `nearbyMountainIds`. Omit/undefined means region-wide (e.g. V/Line is
   * the universal rail spine - no per-mountain restriction).
   */
  mountains_served?: string[];
}

export type TransportProviderList = readonly TransportProvider[];
