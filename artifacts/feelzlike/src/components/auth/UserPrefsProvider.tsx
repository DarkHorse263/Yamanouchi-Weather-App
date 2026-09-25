import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useGetAccount } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useAuthAccount } from "./AuthAccountContext";
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
  formatRain,
  formatDistanceKm,
  type UnitsPref,
} from "@/lib/unitsFormat";
import { LOCAL_UNITS_KEY, readStoredLocalUnits, localeDefaultUnits, effectiveUnits } from "./userPrefsStorage";

/**
 * App-wide access to the signed-in member's saved preferences
 * (users.homeRegionId + users.units, edited on /account).
 *
 * - An explicitly saved account choice wins. Legacy implicit metric defaults
 *   do not overwrite an explicit local choice or the viewed region's default.
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

interface UnitsControl {
  /** effective units currently in force (account wins over local) */
  units: UnitsPref;
  /** true when a known explicit account preference wins */
  fromAccount: boolean;
  /** set the LOCAL preference · no-op display-wise with an explicit account choice */
  setLocalUnits: (u: UnitsPref) => void;
}

const UnitsControlContext = createContext<UnitsControl>({
  units: "metric",
  fromAccount: false,
  setLocalUnits: () => {},
});

/** Toggle-facing control: read/set the local units preference. */
export function useUnitsControl(): UnitsControl {
  return useContext(UnitsControlContext);
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
      rain: (mm: number | null | undefined) => formatRain(mm, units),
      distanceKm: (km: number | null | undefined) => formatDistanceKm(km, units),
    }),
    [units],
  );
}

export function UserPrefsProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const path = location.split("/").filter(Boolean)[0];
  const [regionCountry, setRegionCountry] = useState<{ path: string; country: string | undefined }>();
  useEffect(() => {
    if (!path) return;
    let active = true;
    // Avoid importing the image-heavy region catalogue from the units hook:
    // weather components also render server-side in isolation for tests.
    void import("@/regions").then(({ REGION_COUNTRY }) => {
      if (active) setRegionCountry({ path, country: REGION_COUNTRY[path] });
    });
    return () => { active = false; };
  }, [path]);
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

  // Local (anonymous) preference · persisted so the choice survives reloads.
  const [localUnits, setLocalUnitsState] = useState<UnitsPref | null>(readStoredLocalUnits);
  const setLocalUnits = useCallback((u: UnitsPref) => {
    setLocalUnitsState(u);
    try {
      localStorage.setItem(LOCAL_UNITS_KEY, u);
    } catch {
      // private mode — in-memory only for this session
    }
  }, []);

  const accountUnits = profile
    ? { units: profile.units === "imperial" ? "imperial" as const : "metric" as const, unitsExplicit: profile.unitsExplicit }
    : null;
  // A region changes the INITIAL default only. An explicit choice follows
  // the visitor from one ski region to the next (and survives reloads).
  const routeCountry = ({ us: "US", au: "AU", nz: "NZ", jp: "JP", at: "AT" } as Record<string, string>)[path] ?? (regionCountry?.path === path ? regionCountry.country : undefined);
  const units: UnitsPref = effectiveUnits(accountUnits, localUnits, routeCountry, localeDefaultUnits());
  const fromAccount = accountUnits != null && (accountUnits.unitsExplicit || accountUnits.units === "imperial");

  const value = useMemo<UserPrefs>(
    () => ({
      units,
      homeRegionId: profile?.homeRegionId ?? null,
    }),
    [units, profile?.homeRegionId],
  );

  const control = useMemo<UnitsControl>(
    () => ({ units, fromAccount: !!fromAccount, setLocalUnits }),
    [units, fromAccount, setLocalUnits],
  );

  return (
    <UnitsControlContext.Provider value={control}>
      <UserPrefsContext.Provider value={value}>{children}</UserPrefsContext.Provider>
    </UnitsControlContext.Provider>
  );
}
