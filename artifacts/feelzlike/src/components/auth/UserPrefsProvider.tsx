import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useGetAccount } from "@workspace/api-client-react";
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
  type UnitsPref,
} from "@/lib/unitsFormat";
import { LOCAL_UNITS_KEY, readLocalUnits } from "./userPrefsStorage";

/**
 * App-wide access to the signed-in member's saved preferences
 * (users.homeRegionId + users.units, edited on /account).
 *
 * - Anonymous visitors: the account query never fires (enabled gate) and
 *   units follow a lightweight LOCAL preference (localStorage) editable via
 *   the footer toggle · no account needed. Once signed in, the saved account
 *   preference always wins over the local toggle.
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
  /** true when the value comes from the signed-in account preference */
  fromAccount: boolean;
  /** set the LOCAL (anonymous) preference · no-op display-wise while signed in */
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

  // Local (anonymous) preference · persisted so the choice survives reloads.
  const [localUnits, setLocalUnitsState] = useState<UnitsPref>(readLocalUnits);
  const setLocalUnits = useCallback((u: UnitsPref) => {
    setLocalUnitsState(u);
    try {
      localStorage.setItem(LOCAL_UNITS_KEY, u);
    } catch {
      // private mode — in-memory only for this session
    }
  }, []);

  // Account preference wins once signed in; local toggle drives anonymous.
  const accountUnits: UnitsPref | null = profile
    ? profile.units === "imperial"
      ? "imperial"
      : "metric"
    : null;
  const units: UnitsPref = accountUnits ?? localUnits;

  const value = useMemo<UserPrefs>(
    () => ({
      units,
      homeRegionId: profile?.homeRegionId ?? null,
    }),
    [units, profile?.homeRegionId],
  );

  const control = useMemo<UnitsControl>(
    () => ({ units, fromAccount: accountUnits !== null, setLocalUnits }),
    [units, accountUnits, setLocalUnits],
  );

  return (
    <UnitsControlContext.Provider value={control}>
      <UserPrefsContext.Provider value={value}>{children}</UserPrefsContext.Provider>
    </UnitsControlContext.Provider>
  );
}
