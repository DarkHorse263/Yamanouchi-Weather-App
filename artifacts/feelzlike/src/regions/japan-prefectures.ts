import {
  publishedCatalogueRecords,
  travelRegions,
} from "@workspace/japan-ski-catalogue/public-runtime";

export interface JapanPrefecture {
  id: string;
  name: string;
  nameJa: string;
}

const PREFECTURE_NAMES: Record<string, string> = {
  北海道: "Hokkaido",
  青森県: "Aomori",
  岩手県: "Iwate",
  宮城県: "Miyagi",
  秋田県: "Akita",
  山形県: "Yamagata",
  福島県: "Fukushima",
  茨城県: "Ibaraki",
  栃木県: "Tochigi",
  群馬県: "Gunma",
  埼玉県: "Saitama",
  千葉県: "Chiba",
  東京都: "Tokyo",
  神奈川県: "Kanagawa",
  新潟県: "Niigata",
  富山県: "Toyama",
  石川県: "Ishikawa",
  福井県: "Fukui",
  山梨県: "Yamanashi",
  長野県: "Nagano",
  岐阜県: "Gifu",
  静岡県: "Shizuoka",
  愛知県: "Aichi",
  三重県: "Mie",
  滋賀県: "Shiga",
  京都府: "Kyoto",
  大阪府: "Osaka",
  兵庫県: "Hyogo",
  奈良県: "Nara",
  和歌山県: "Wakayama",
  鳥取県: "Tottori",
  島根県: "Shimane",
  岡山県: "Okayama",
  広島県: "Hiroshima",
  山口県: "Yamaguchi",
  徳島県: "Tokushima",
  香川県: "Kagawa",
  愛媛県: "Ehime",
  高知県: "Kochi",
  福岡県: "Fukuoka",
  佐賀県: "Saga",
  長崎県: "Nagasaki",
  熊本県: "Kumamoto",
  大分県: "Oita",
  宮崎県: "Miyazaki",
  鹿児島県: "Kagoshima",
  沖縄県: "Okinawa",
};

// Daisen predates the catalogue projection. Keep its reviewed administrative
// assignment explicit rather than deriving it from display copy.
const AUTHORED_PREFECTURES: Record<string, string[]> = {
  daisen: ["鳥取県"],
};

const JAPAN_REGION_PREFECTURES = new Map(
  travelRegions.map((region) => [region.travelRegionId, region.prefectures]),
);

function prefectureFromValue(value: string): JapanPrefecture {
  const japaneseEntry = PREFECTURE_NAMES[value]
    ? [value, PREFECTURE_NAMES[value]] as const
    : Object.entries(PREFECTURE_NAMES).find(([, english]) => english === value);
  if (!japaneseEntry) throw new Error(`Unknown Japanese prefecture: ${value}`);
  const [nameJa, name] = japaneseEntry;
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    nameJa,
  };
}

/** All reviewed prefectures for search aliases and cross-prefecture regions. */
export function prefecturesForJapanRegion(regionId: string): JapanPrefecture[] {
  const names = JAPAN_REGION_PREFECTURES.get(regionId) ?? AUTHORED_PREFECTURES[regionId];
  if (!names?.length) {
    throw new Error(`Missing reviewed prefecture assignment for Japan region: ${regionId}`);
  }
  return names.map(prefectureFromValue);
}

/**
 * Presentation-only browse assignment. Cross-prefecture practical regions use
 * the catalogue's reviewed lead prefecture so every travel region appears once.
 */
export function primaryPrefectureForJapanRegion(regionId: string): JapanPrefecture {
  return prefecturesForJapanRegion(regionId)[0]!;
}

/** Deduplicated bilingual filter options across the supplied Japan regions. */
export function japanPrefectureOptions(regionIds: string[]): JapanPrefecture[] {
  return [...new Map(
    regionIds
      .flatMap(prefecturesForJapanRegion)
      .map((prefecture) => [prefecture.id, prefecture] as const),
  ).values()].sort((a, b) => a.name.localeCompare(b.name));
}

const CATALOGUE_MOUNTAIN_PREFECTURE = new Map(
  publishedCatalogueRecords.map((record) => [
    `${record.travelRegionId}/${record.publicId}`,
    record.prefecture,
  ]),
);

/**
 * Map pins use the mountain's precise catalogue prefecture where available.
 * Authored town/mountain pins retain every reviewed region prefecture so a
 * cross-prefecture travel region is discoverable from each relevant filter.
 */
export function prefectureIdsForJapanPin(regionId: string, pinId: string): string[] {
  const precisePrefecture = CATALOGUE_MOUNTAIN_PREFECTURE.get(`${regionId}/${pinId}`);
  if (precisePrefecture) return [prefectureFromValue(precisePrefecture).id];
  return prefecturesForJapanRegion(regionId).map(({ id }) => id);
}
