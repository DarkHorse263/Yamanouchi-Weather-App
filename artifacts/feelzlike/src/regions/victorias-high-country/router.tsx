import { VictoriasHighCountryTransport } from "./pages/Transport";
import type { RegionRouter } from "@/layouts/RegionLayout";

/**
 * VHC keeps the generic mountain detail / alerts pages for now - only
 * Transport ships a custom layout because the seven base towns each map
 * to a different primary coach operator (MMBL for Mansfield, FCC for Mt
 * Beauty, Snowball for Bright/Harrietville/Dinner Plain, etc.).
 */
export const victoriasHighCountryRouter: RegionRouter = {
  Transport: VictoriasHighCountryTransport,
};
