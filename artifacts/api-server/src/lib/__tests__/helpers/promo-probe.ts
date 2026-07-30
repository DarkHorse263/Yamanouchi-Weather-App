// Probe used by promo-gate.test.ts to exercise the PREMIUM_PROMO_* env
// overrides, which are read at module load and therefore need a fresh
// interpreter. Prints "active" or "inactive".
import { isPromoActive } from "../../promo.js";

console.log(isPromoActive() ? "active" : "inactive");
