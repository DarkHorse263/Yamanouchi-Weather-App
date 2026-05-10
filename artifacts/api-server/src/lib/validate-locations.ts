import {
  GetLocationWeatherParams,
  GetLocationWebcamsParams,
} from "@workspace/api-zod";
import { WEATHER_LOCATION_IDS } from "../routes/weather.js";
import { WEBCAM_LOCATION_IDS } from "../routes/webcams.js";

/**
 * Boot-time contract guard.
 *
 * The OpenAPI spec defines a `locationId` path-param schema (currently a
 * permissive `^[a-z0-9-]+$` regex) that the orval-generated zod schemas
 * mirror. This function asserts that every id we serve from the LOCATIONS
 * array (weather route) and the WEBCAM_DATA array (webcams route) actually
 * passes the generated schema. If a developer adds a new id that violates
 * the regex (uppercase, underscore, leading dash, etc.), the server fails
 * fast on boot rather than silently serving an id that the typed clients
 * can never request.
 *
 * Catches the same drift class that previously bit us in reverse: stale
 * enum vs. live LOCATIONS array (VHC mountains were missing from the
 * generated client types for months).
 */
export function validateLocationContracts(): void {
  const failures: string[] = [];

  for (const id of WEATHER_LOCATION_IDS) {
    const r = GetLocationWeatherParams.safeParse({ locationId: id });
    if (!r.success) {
      failures.push(`weather id "${id}" violates GetLocationWeatherParams: ${r.error.issues.map((i) => i.message).join(", ")}`);
    }
  }

  for (const id of WEBCAM_LOCATION_IDS) {
    const r = GetLocationWebcamsParams.safeParse({ locationId: id });
    if (!r.success) {
      failures.push(`webcam id "${id}" violates GetLocationWebcamsParams: ${r.error.issues.map((i) => i.message).join(", ")}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `[location-contract] ${failures.length} id(s) do not match the OpenAPI path schemas:\n  - ${failures.join("\n  - ")}\n\nFix: rename the id to match ^[a-z0-9-]+$ or widen the spec in lib/api-spec/openapi.yaml and rerun codegen.`,
    );
  }
}
