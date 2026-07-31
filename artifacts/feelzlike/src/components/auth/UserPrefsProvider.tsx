import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useGetAccount } from "@workspace/api-client-react";
import { useAuthAccount } from "./SignUpProvider";
import {
  tempRounded,
  formatSnow,
  snowValue,
  tempUnitLabel,
  snowUnitLabel,
  windUnitLabel,
  elevationUnitLabel,
  windRounded,
  elevationRounded,
  type UnitsPref,
} from "@/lib/unitsFormat";

/**
 * App-wide access to the signed-in member's saved preferences
 * (users.homeRegionId + users.units, edited on /account).
 *
 * - Anonymous visitors: the account query never fires (enabled gate) and
 *   everyone sees the metric defaults — personalisation is strictly additive.
 * - Query key is shared with the /account page ("account"), so a profile
 *   save there invalidates/refreshes here and the whole app flips at once.
 * - Components may call useUserPrefs()/useUnits() WITHOUT a provider (e.g.
 *   render tests): the context default keeps them metric + no home region.
 */

export interface UserPrefs {
  units: UnitsPref;
  homeRegionId: string | null;
}

const DEFAULT_PREFS: UserPrefs = { units: "metric", homeRegionId: null };

const UserPrefsContext = createContext<UserPrefs>(DEFAULT_PREFS);

export function useUserPrefs(): UserPrefs {
  return useContext(UserPrefsContext);
}

/** Display-edge unit formatters bound to the member's saved preference. */
export function useUnits() {
  const { units } = useUserPrefs();
  return useMemo(
    () => ({
      units,
      tempUnit: tempUnitLabel(units),
      snowUnit: snowUnitLabel(units),
      /** rounded converted temperature · null-safe */
      temp: (c: number | null | undefined) => tempRounded(c, units),
      /** "12 cm" / "4.7 in" · null-safe → "-" */
      snow: (cm: number | null | undefined, metricDecimals = 0) =>
        formatSnow(cm, units, metricDecimals),
      /** converted snow value only, no unit · null-safe → "-" */
      snowVal: (cm: number | null | undefined, metricDecimals = 0) =>
        snowValue(cm, units, metricDecimals),
      windUnit: windUnitLabel(units),
      elevUnit: elevationUnitLabel(units),
      /** rounded converted wind speed (km/h canonical) · null-safe */
      wind: (kmh: number | null | undefined) => windRounded(kmh, units),
      /** rounded converted elevation/height (m canonical) · null-safe */
      elev: (m: number | null | undefined) => elevationRounded(m, units),
    }),
    [units],
  );
}

export function UserPrefsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthAccount();
  const query = useGetAccount({
    query: {
      queryKey: ["account"],
      enabled: isAuthenticated,
      staleTime: 5 * 60_000,
      retry: 1,
    },
  });
  const profile = isAuthenticated ? (query.data?.profile ?? null) : null;

  const value = useMemo<UserPrefs>(
    () => ({
      units: profile?.units === "imperial" ? "imperial" : "metric",
      homeRegionId: profile?.homeRegionId ?? null,
    }),
    [profile?.units, profile?.homeRegionId],
  );

  return <UserPrefsContext.Provider value={value}>{children}</UserPrefsContext.Provider>;
}
