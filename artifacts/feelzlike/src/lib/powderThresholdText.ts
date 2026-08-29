import {
  POWDER_THRESHOLDS_DEFAULT,
  type PowderThresholds,
} from "@/types/weather";
import {
  snowValue,
  tempRounded,
  windRounded,
  type UnitsPref,
} from "@/lib/unitsFormat";

export function powderThresholdText(
  thresholds: PowderThresholds | undefined,
  units: UnitsPref,
): { en: string; ja: string } {
  const effective = { ...POWDER_THRESHOLDS_DEFAULT, ...thresholds };
  const snowfall =
    units === "imperial"
      ? snowValue(effective.minSnowfall, units)
      : String(effective.minSnowfall);
  const wind = windRounded(effective.maxWind, units);
  const temperature = tempRounded(effective.maxTemp, units);

  if (units === "imperial") {
    return {
      en: `Thresholds: snowfall ≥${snowfall}in/hr, wind <${wind}mph, ≥${effective.minDuration} consecutive hours, ≤${temperature}°F.`,
      ja: `基準: 降雪${snowfall}in/時以上、風速${wind}mph未満、${effective.minDuration}時間以上連続、${temperature}°F以下。`,
    };
  }

  const signedTemperature =
    effective.maxTemp > 0 ? `+${temperature}` : String(temperature);
  return {
    en: `Thresholds: snowfall ≥${snowfall}cm/hr, wind <${wind}km/h, ≥${effective.minDuration} consecutive hours, ≤${signedTemperature}°C.`,
    ja: `基準: 降雪${snowfall}cm/時以上、風速${wind}km/時未満、${effective.minDuration}時間以上連続、${signedTemperature}℃以下。`,
  };
}