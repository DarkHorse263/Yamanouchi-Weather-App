import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";

// ─── types ─────────────────────────────────────────
type RegionStatus = "live" | "soon";

interface HeadlineReading {
  locationName: string;
  tempC: number;
  feelsLikeC: number;
  windKph: number;
  windDirection: string;
  windDirectionDeg: number | null;
  description: string;
  weatherCode: number | null;
  snowfallMmNext24h: number;
  observedAt: string;
  source: string;
  forecast: Array<{
    date: string;
    maxC: number;
    minC: number;
    weatherCode: number | null;
    description: string;
    precipMm: number;
    snowfallMm: number;
  }>;
}

interface Region {
  id: string;
  name: string;
  country: string;
  countryCode: "AU" | "JP" | "NZ" | "CA" | "US";
  region: string;
  status: RegionStatus;
  href: string;
  baseTowns: string[];
  mountains: string[];
  headlineLabel: string;
  elevation?: number;
  sourceLabel?: string;
  headline: HeadlineReading | null;
}

interface RegionsResponse {
  regions: Region[];
  generatedAt: string;
  sourceCount: number;
  refreshIntervalMin: number;
}

// ─── fallback (matches landing) ────────────────────
const FALLBACK_REGIONS: Region[] = [
  { id: "snowy-mountains",        name: "Snowy Mountains",                country: "Australia", countryCode: "AU", region: "New South Wales", status: "live", href: "/snowy-mountains/",        baseTowns: ["Jindabyne", "Berridale", "Cooma"],                            mountains: ["Perisher", "Thredbo", "Selwyn", "Charlotte's Pass"],          headlineLabel: "Jindabyne",     headline: null },
  { id: "victorias-high-country", name: "Victoria\u2019s High Country",   country: "Australia", countryCode: "AU", region: "Victoria",        status: "live", href: "/victorias-high-country/", baseTowns: ["Mount Beauty", "Bright", "Mansfield", "Harrietville", "Dinner Plain"], mountains: ["Mt Buller", "Mt Stirling", "Falls Creek", "Mt Hotham"], headlineLabel: "Mount Beauty", headline: null },
  { id: "tasmania",               name: "Tasmania",                       country: "Australia", countryCode: "AU", region: "Tasmania",        status: "live", href: "/tasmania/",              baseTowns: ["Ben Lomond Base", "Launceston", "Hobart"],                    mountains: ["Ben Lomond"],                                                headlineLabel: "Launceston",   headline: null },
  { id: "yamanouchi",             name: "Yamanouchi Town",                country: "Japan",     countryCode: "JP", region: "Nagano",          status: "live", href: "/yamanouchi/",             baseTowns: ["Yudanaka", "Shibu Onsen", "Yomase"],                          mountains: ["Shiga Kogen", "Ryuoo", "X-Jam", "Yomase"],                   headlineLabel: "Yudanaka",     headline: null },
  { id: "nozawa-onsen",           name: "Nozawa Onsen",                   country: "Japan",     countryCode: "JP", region: "Nagano",          status: "live", href: "/nozawa-onsen/",           baseTowns: ["Nozawa Onsen"],                                              mountains: ["Nozawa Onsen"],                                              headlineLabel: "Nozawa Onsen", headline: null },
  { id: "iiyama",                 name: "Iiyama",                         country: "Japan",     countryCode: "JP", region: "Nagano",          status: "live", href: "/iiyama/",                 baseTowns: ["Iiyama", "Madarao Kogen", "Togari Onsen", "Kijimadaira"],     mountains: ["Madarao", "Tangram", "Togari Onsen", "Kijima Snow Park"],     headlineLabel: "Iiyama",       headline: null },
  { id: "hakuba-valley",          name: "Hakuba Valley",                  country: "Japan",     countryCode: "JP", region: "Nagano",          status: "live", href: "/hakuba-valley/",          baseTowns: ["Hakuba", "Otari", "Omachi"],                                 mountains: ["Happo-One", "Hakuba 47", "Goryu", "Tsugaike", "Cortina"],     headlineLabel: "Hakuba",       headline: null },
  { id: "myoko",                  name: "Myoko",                          country: "Japan",     countryCode: "JP", region: "Niigata",         status: "live", href: "/myoko/",                  baseTowns: ["Akakura Onsen", "Ikenotaira Onsen", "Suginosawa", "Arai"],   mountains: ["Akakura Onsen", "Akakura Kanko", "Suginohara", "Lotte Arai"], headlineLabel: "Akakura Onsen", headline: null },
  { id: "niseko",                 name: "Niseko",                         country: "Japan",     countryCode: "JP", region: "Hokkaido",        status: "live", href: "/niseko/",                 baseTowns: ["Hirafu", "Kutchan", "Niseko Town"],                          mountains: ["Grand Hirafu", "Hanazono", "Niseko Village", "Annupuri", "Moiwa"], headlineLabel: "Hirafu", headline: null },
  { id: "furano",                 name: "Furano",                         country: "Japan",     countryCode: "JP", region: "Hokkaido",        status: "live", href: "/furano/",                 baseTowns: ["Furano", "Kitanomine"],                                      mountains: ["Furano Ski Resort", "Kamui Ski Links", "Tomamu"],            headlineLabel: "Furano",       headline: null },
  { id: "sapporo",                name: "Sapporo",                        country: "Japan",     countryCode: "JP", region: "Hokkaido",        status: "live", href: "/sapporo/",                baseTowns: ["Sapporo", "Jozankei"],                                       mountains: ["Sapporo Teine", "Sapporo Kokusai", "Sapporo Bankei"],        headlineLabel: "Sapporo",      headline: null },
  { id: "tomamu-sahoro",          name: "Tomamu & Sahoro",                country: "Japan",     countryCode: "JP", region: "Hokkaido",        status: "live", href: "/tomamu-sahoro/",          baseTowns: ["Tomamu", "Shimukappu"],                                      mountains: ["Hoshino Resorts Tomamu", "Sahoro Resort"],                   headlineLabel: "Tomamu",       headline: null },
  { id: "asahikawa",              name: "Asahikawa",                      country: "Japan",     countryCode: "JP", region: "Hokkaido",        status: "live", href: "/asahikawa/",              baseTowns: ["Asahikawa", "Higashikawa"],                                  mountains: ["Kamui Ski Links", "Asahidake"],                              headlineLabel: "Asahikawa",    headline: null },
  { id: "rusutsu-kiroro",         name: "Rusutsu & Kiroro",               country: "Japan",     countryCode: "JP", region: "Hokkaido",        status: "live", href: "/rusutsu-kiroro/",         baseTowns: ["Rusutsu", "Kiroro"],                                         mountains: ["Rusutsu Resort", "Kiroro"],                                  headlineLabel: "Rusutsu",      headline: null },
  { id: "zao-onsen",              name: "Zao Onsen",                      country: "Japan",     countryCode: "JP", region: "Yamagata",        status: "live", href: "/zao-onsen/",              baseTowns: ["Zao Onsen"],                                                 mountains: ["Zao Onsen Ski Resort"],                                      headlineLabel: "Zao Onsen",    headline: null },
  { id: "bandai",                 name: "Bandai",                         country: "Japan",     countryCode: "JP", region: "Fukushima",       status: "live", href: "/bandai/",                 baseTowns: ["Inawashiro", "Urabandai"],                                   mountains: ["Nekoma Mountain", "Grandeco"],                               headlineLabel: "Urabandai",    headline: null },
  { id: "daisen",                 name: "Daisen",                         country: "Japan",     countryCode: "JP", region: "Tottori",         status: "live", href: "/daisen/",                 baseTowns: ["Daisenji", "Yonago"],                                        mountains: ["Daisen White Resort"],                                       headlineLabel: "Daisenji",     headline: null },
  { id: "hakkoda-aomori-spring",  name: "Hakkoda & Aomori Spring",        country: "Japan",     countryCode: "JP", region: "Aomori",          status: "live", href: "/hakkoda-aomori-spring/",  baseTowns: ["Aomori", "Sukayu Onsen", "Ajigasawa"],                       mountains: ["Hakkoda", "Aomori Spring"],                                  headlineLabel: "Sukayu Onsen", headline: null },
  { id: "appi-shizukuishi",       name: "Appi & Shizukuishi",             country: "Japan",     countryCode: "JP", region: "Iwate",           status: "live", href: "/appi-shizukuishi/",       baseTowns: ["Appi Kogen", "Shizukuishi", "Morioka"],                      mountains: ["Appi Kogen", "Shizukuishi"],                                 headlineLabel: "Appi Kogen",   headline: null },
  { id: "minakami",               name: "Minakami",                       country: "Japan",     countryCode: "JP", region: "Gunma",           status: "live", href: "/minakami/",               baseTowns: ["Minakami"],                                                  mountains: ["Tanigawadake Tenjindaira", "Minakami Kogen", "Norn Minakami"], headlineLabel: "Minakami",   headline: null },
  { id: "kusatsu-manza",          name: "Kusatsu & Manza",                country: "Japan",     countryCode: "JP", region: "Gunma",           status: "live", href: "/kusatsu-manza/",          baseTowns: ["Kusatsu Onsen", "Manza Onsen"],                              mountains: ["Kusatsu Onsen", "Manza Onsen"],                              headlineLabel: "Kusatsu Onsen", headline: null },
  { id: "hachimantai",            name: "Hachimantai",                    country: "Japan",     countryCode: "JP", region: "Iwate",           status: "live", href: "/hachimantai/",            baseTowns: ["Hachimantai"],                                               mountains: ["Hachimantai Panorama", "Hachimantai Shimokura"],             headlineLabel: "Hachimantai",  headline: null },
  { id: "yuzawa",                 name: "Yuzawa",                         country: "Japan",     countryCode: "JP", region: "Niigata",         status: "live", href: "/yuzawa/",                 baseTowns: ["Echigo-Yuzawa", "Ishiuchi", "Mitsumata"],                    mountains: ["GALA Yuzawa", "Yuzawa Kogen", "Iwappara", "Ishiuchi Maruyama", "Kagura", "Naeba"], headlineLabel: "Echigo-Yuzawa", headline: null },
  { id: "queenstown",             name: "Queenstown",                     country: "New Zealand", countryCode: "NZ", region: "Otago",          status: "live", href: "/queenstown/",            baseTowns: ["Queenstown"],                                                mountains: ["Coronet Peak", "The Remarkables"],                          headlineLabel: "Queenstown",   headline: null },
  { id: "wanaka",                 name: "Wanaka",                         country: "New Zealand", countryCode: "NZ", region: "Otago",          status: "live", href: "/wanaka/",                baseTowns: ["Wanaka"],                                                    mountains: ["Cardrona", "Treble Cone"],                                  headlineLabel: "Wanaka",       headline: null },
  { id: "mt-hutt",                name: "Mt Hutt",                        country: "New Zealand", countryCode: "NZ", region: "Canterbury",     status: "live", href: "/mt-hutt/",               baseTowns: ["Methven"],                                                   mountains: ["Mt Hutt"],                                                  headlineLabel: "Methven",      headline: null },
  { id: "ruapehu",                name: "Ruapehu",                        country: "New Zealand", countryCode: "NZ", region: "Central Plateau", status: "live", href: "/ruapehu/",               baseTowns: ["Ohakune"],                                                   mountains: ["Whakapapa", "Turoa"],                                       headlineLabel: "Ohakune",      headline: null },
  { id: "whistler",               name: "Whistler",                       country: "Canada",      countryCode: "CA", region: "British Columbia", status: "live", href: "/whistler/",             baseTowns: ["Whistler"],                                                  mountains: ["Whistler Mountain", "Blackcomb Mountain"],                  headlineLabel: "Whistler",     headline: null },
  { id: "powder-highway",         name: "Powder Highway",                 country: "Canada",      countryCode: "CA", region: "BC Interior",      status: "live", href: "/powder-highway/",       baseTowns: ["Revelstoke", "Golden", "Fernie", "Nelson", "Kimberley", "Invermere", "Sun Peaks"], mountains: ["Revelstoke Mountain Resort", "Kicking Horse", "Fernie Alpine Resort", "Whitewater", "Kimberley Alpine Resort", "Panorama", "Sun Peaks Resort"], headlineLabel: "Revelstoke", headline: null },
  { id: "banff-lake-louise",      name: "Banff & Lake Louise",            country: "Canada",      countryCode: "CA", region: "Alberta",          status: "live", href: "/banff-lake-louise/",    baseTowns: ["Banff", "Lake Louise"],                                      mountains: ["Banff Sunshine Village", "Mt. Norquay", "Lake Louise Ski Resort"], headlineLabel: "Banff",  headline: null },
  { id: "canmore",                name: "Canmore",                        country: "Canada",      countryCode: "CA", region: "Alberta",          status: "live", href: "/canmore/",              baseTowns: ["Canmore"],                                                   mountains: ["Nakiska"],                                                  headlineLabel: "Canmore",      headline: null },
  { id: "jasper",                 name: "Jasper",                         country: "Canada",      countryCode: "CA", region: "Alberta",          status: "live", href: "/jasper/",               baseTowns: ["Jasper"],                                                    mountains: ["Marmot Basin"],                                             headlineLabel: "Jasper",       headline: null },
  { id: "quebec-laurentians",     name: "Laurentians",                    country: "Canada",      countryCode: "CA", region: "Québec",           status: "live", href: "/quebec-laurentians/",   baseTowns: ["Mont-Tremblant"],                                            mountains: ["Tremblant"],                                                headlineLabel: "Mont-Tremblant", headline: null },
  { id: "quebec-charlevoix",      name: "Charlevoix",                     country: "Canada",      countryCode: "CA", region: "Québec",           status: "live", href: "/quebec-charlevoix/",    baseTowns: ["Beaupré", "Petite-Rivière-Saint-François"],                   mountains: ["Mont-Sainte-Anne", "Le Massif de Charlevoix"],              headlineLabel: "Beaupré",      headline: null },
  { id: "quebec-eastern-townships", name: "Eastern Townships",            country: "Canada",      countryCode: "CA", region: "Québec",           status: "live", href: "/quebec-eastern-townships/", baseTowns: ["Bromont", "Sutton"],                                     mountains: ["Ski Bromont", "Mont Sutton"],                               headlineLabel: "Bromont",      headline: null },
  { id: "summit-county",          name: "Summit County",                  country: "United States", countryCode: "US", region: "Colorado",        status: "live", href: "/summit-county/",         baseTowns: ["Breckenridge", "Keystone", "Copper Mountain", "Georgetown"], mountains: ["Breckenridge", "Keystone", "Copper Mountain", "Arapahoe Basin", "Loveland"], headlineLabel: "Breckenridge", headline: null },
  { id: "vail-valley",            name: "Vail Valley",                    country: "United States", countryCode: "US", region: "Colorado",        status: "live", href: "/vail-valley/",           baseTowns: ["Vail", "Avon"],                                              mountains: ["Vail Mountain", "Beaver Creek"],                            headlineLabel: "Vail",         headline: null },
  { id: "aspen-snowmass",         name: "Aspen Snowmass",                 country: "United States", countryCode: "US", region: "Colorado",        status: "live", href: "/aspen-snowmass/",        baseTowns: ["Aspen", "Snowmass Village"],                                 mountains: ["Snowmass", "Aspen Mountain", "Aspen Highlands", "Buttermilk"], headlineLabel: "Aspen",       headline: null },
  { id: "steamboat",              name: "Steamboat",                      country: "United States", countryCode: "US", region: "Colorado",        status: "live", href: "/steamboat/",             baseTowns: ["Steamboat Springs"],                                         mountains: ["Steamboat Resort"],                                          headlineLabel: "Steamboat Springs", headline: null },
  { id: "winter-park",            name: "Winter Park",                    country: "United States", countryCode: "US", region: "Colorado",        status: "live", href: "/winter-park/",           baseTowns: ["Winter Park"],                                               mountains: ["Winter Park Resort"],                                        headlineLabel: "Winter Park",  headline: null },
  { id: "crested-butte",          name: "Crested Butte",                  country: "United States", countryCode: "US", region: "Colorado",        status: "live", href: "/crested-butte/",         baseTowns: ["Crested Butte"],                                             mountains: ["Crested Butte Mountain Resort"],                             headlineLabel: "Crested Butte", headline: null },
  { id: "telluride",              name: "Telluride",                      country: "United States", countryCode: "US", region: "Colorado",        status: "live", href: "/telluride/",             baseTowns: ["Telluride"],                                                 mountains: ["Telluride Ski Resort"],                                      headlineLabel: "Telluride",    headline: null },
  { id: "durango",                name: "Durango",                        country: "United States", countryCode: "US", region: "Colorado",        status: "live", href: "/durango/",               baseTowns: ["Durango"],                                                   mountains: ["Purgatory Resort"],                                          headlineLabel: "Durango",      headline: null },
  { id: "boulder-front-range",    name: "Boulder / Front Range",          country: "United States", countryCode: "US", region: "Colorado",        status: "live", href: "/boulder-front-range/",   baseTowns: ["Nederland"],                                                 mountains: ["Eldora Mountain Resort"],                                    headlineLabel: "Nederland",    headline: null },
  { id: "cottonwood-canyons",     name: "Cottonwood Canyons",             country: "United States", countryCode: "US", region: "Utah",            status: "live", href: "/cottonwood-canyons/",    baseTowns: ["Salt Lake City", "Sandy"],                                   mountains: ["Alta", "Snowbird", "Brighton", "Solitude"],                 headlineLabel: "Salt Lake City", headline: null },
  { id: "park-city",              name: "Park City",                      country: "United States", countryCode: "US", region: "Utah",            status: "live", href: "/park-city/",             baseTowns: ["Park City"],                                                 mountains: ["Park City Mountain", "Deer Valley"],                        headlineLabel: "Park City",    headline: null },
  { id: "ogden-valley",           name: "Ogden Valley",                   country: "United States", countryCode: "US", region: "Utah",            status: "live", href: "/ogden-valley/",          baseTowns: ["Ogden", "Eden"],                                             mountains: ["Snowbasin", "Powder Mountain", "Nordic Valley"],            headlineLabel: "Ogden",        headline: null },
  { id: "provo",                  name: "Provo",                          country: "United States", countryCode: "US", region: "Utah",            status: "live", href: "/provo/",                 baseTowns: ["Provo", "Sundance"],                                         mountains: ["Sundance Mountain Resort"],                                 headlineLabel: "Provo",        headline: null },
  { id: "cache-valley",           name: "Cache Valley",                   country: "United States", countryCode: "US", region: "Utah",            status: "live", href: "/cache-valley/",          baseTowns: ["Logan"],                                                     mountains: ["Beaver Mountain", "Cherry Peak"],                           headlineLabel: "Logan",        headline: null },
  { id: "north-lake-tahoe",       name: "North Lake Tahoe",               country: "United States", countryCode: "US", region: "California",      status: "live", href: "/north-lake-tahoe/",      baseTowns: ["Truckee"],                                                   mountains: ["Palisades Tahoe", "Northstar California", "Sugar Bowl"],   headlineLabel: "Truckee",      headline: null },
  { id: "south-lake-tahoe",       name: "South Lake Tahoe",               country: "United States", countryCode: "US", region: "California",      status: "live", href: "/south-lake-tahoe/",      baseTowns: ["South Lake Tahoe"],                                         mountains: ["Heavenly", "Kirkwood", "Sierra-at-Tahoe", "Homewood Mountain Resort"], headlineLabel: "South Lake Tahoe", headline: null },
  { id: "mammoth-lakes",          name: "Mammoth Lakes",                  country: "United States", countryCode: "US", region: "California",      status: "live", href: "/mammoth-lakes/",         baseTowns: ["Mammoth Lakes"],                                            mountains: ["Mammoth Mountain", "June Mountain"],                       headlineLabel: "Mammoth Lakes", headline: null },
  { id: "big-bear",               name: "Big Bear",                       country: "United States", countryCode: "US", region: "California",      status: "live", href: "/big-bear/",              baseTowns: ["Big Bear Lake"],                                            mountains: ["Bear Mountain", "Snow Summit"],                            headlineLabel: "Big Bear Lake", headline: null },
  { id: "bear-valley",            name: "Bear Valley",                    country: "United States", countryCode: "US", region: "California",      status: "live", href: "/bear-valley/",           baseTowns: ["Arnold"],                                                   mountains: ["Bear Valley Mountain Resort"],                             headlineLabel: "Arnold",       headline: null },
  { id: "mt-shasta",              name: "Mt. Shasta",                     country: "United States", countryCode: "US", region: "California",      status: "live", href: "/mt-shasta/",             baseTowns: ["Mount Shasta"],                                             mountains: ["Mt. Shasta Ski Park"],                                     headlineLabel: "Mount Shasta", headline: null },
  { id: "killington-pico",        name: "Killington/Pico",                 country: "United States", countryCode: "US", region: "Vermont",         status: "live", href: "/killington-pico/",       baseTowns: ["Killington"],                                               mountains: ["Killington", "Pico Mountain"],                             headlineLabel: "Killington",   headline: null },
  { id: "stowe-smugglers-notch",  name: "Stowe/Smugglers' Notch",          country: "United States", countryCode: "US", region: "Vermont",         status: "live", href: "/stowe-smugglers-notch/", baseTowns: ["Stowe", "Jeffersonville"],                                  mountains: ["Stowe Mountain Resort", "Smugglers' Notch"],               headlineLabel: "Stowe",        headline: null },
  { id: "mad-river-valley",       name: "Mad River Valley",                country: "United States", countryCode: "US", region: "Vermont",         status: "live", href: "/mad-river-valley/",      baseTowns: ["Warren", "Waitsfield"],                                     mountains: ["Sugarbush", "Mad River Glen"],                             headlineLabel: "Waitsfield",   headline: null },
  { id: "southern-vermont",       name: "Southern Vermont",                country: "United States", countryCode: "US", region: "Vermont",         status: "live", href: "/southern-vermont/",      baseTowns: ["Stratton", "West Dover", "Peru", "Manchester"],            mountains: ["Stratton", "Mount Snow", "Bromley Mountain", "Magic Mountain"], headlineLabel: "Manchester",   headline: null },
  { id: "okemo",                  name: "Okemo",                           country: "United States", countryCode: "US", region: "Vermont",         status: "live", href: "/okemo/",                 baseTowns: ["Ludlow"],                                                   mountains: ["Okemo Mountain Resort"],                                   headlineLabel: "Ludlow",       headline: null },
  { id: "jay-peak-nek",           name: "Jay Peak/Northeast Kingdom",      country: "United States", countryCode: "US", region: "Vermont",         status: "live", href: "/jay-peak-nek/",          baseTowns: ["Jay", "East Burke"],                                        mountains: ["Jay Peak", "Burke Mountain"],                              headlineLabel: "Jay",          headline: null },
  { id: "jackson-hole",           name: "Jackson Hole",                    country: "United States", countryCode: "US", region: "Wyoming",         status: "live", href: "/jackson-hole/",          baseTowns: ["Jackson", "Teton Village"],                                 mountains: ["Jackson Hole Mountain Resort", "Snow King Mountain"],       headlineLabel: "Jackson",      headline: null },
  { id: "grand-targhee",          name: "Grand Targhee",                   country: "United States", countryCode: "US", region: "Wyoming",         status: "live", href: "/grand-targhee/",         baseTowns: ["Alta"],                                                      mountains: ["Grand Targhee Resort"],                                    headlineLabel: "Alta",         headline: null },
  { id: "big-sky",                name: "Big Sky",                         country: "United States", countryCode: "US", region: "Montana",         status: "live", href: "/big-sky/",               baseTowns: ["Big Sky"],                                                   mountains: ["Big Sky Resort"],                                          headlineLabel: "Big Sky",      headline: null },
  { id: "bozeman-bridger-bowl",   name: "Bozeman",                         country: "United States", countryCode: "US", region: "Montana",         status: "live", href: "/bozeman-bridger-bowl/",   baseTowns: ["Bozeman"],                                                   mountains: ["Bridger Bowl"],                                            headlineLabel: "Bozeman",      headline: null },
  { id: "whitefish",              name: "Whitefish",                       country: "United States", countryCode: "US", region: "Montana",         status: "live", href: "/whitefish/",             baseTowns: ["Whitefish"],                                                 mountains: ["Whitefish Mountain Resort"],                               headlineLabel: "Whitefish",    headline: null },
  { id: "red-lodge",              name: "Red Lodge",                       country: "United States", countryCode: "US", region: "Montana",         status: "live", href: "/red-lodge/",             baseTowns: ["Red Lodge"],                                                 mountains: ["Red Lodge Mountain"],                                      headlineLabel: "Red Lodge",    headline: null },
  { id: "taos",                   name: "Taos",                            country: "United States", countryCode: "US", region: "New Mexico",      status: "live", href: "/taos/",                  baseTowns: ["Taos Ski Valley"],                                           mountains: ["Taos Ski Valley"],                                         headlineLabel: "Taos",         headline: null },
  { id: "angel-fire",             name: "Angel Fire",                      country: "United States", countryCode: "US", region: "New Mexico",      status: "live", href: "/angel-fire/",            baseTowns: ["Angel Fire"],                                                mountains: ["Angel Fire Resort"],                                       headlineLabel: "Angel Fire",   headline: null },
  { id: "santa-fe",               name: "Santa Fe",                        country: "United States", countryCode: "US", region: "New Mexico",      status: "live", href: "/santa-fe/",              baseTowns: ["Santa Fe"],                                                  mountains: ["Ski Santa Fe"],                                            headlineLabel: "Santa Fe",     headline: null },
  { id: "albuquerque-sandia",     name: "Albuquerque",                     country: "United States", countryCode: "US", region: "New Mexico",      status: "live", href: "/albuquerque-sandia/",     baseTowns: ["Albuquerque"],                                               mountains: ["Sandia Peak Ski Area"],                                    headlineLabel: "Albuquerque",  headline: null },
  { id: "harbor-springs",         name: "Harbor Springs",                  country: "United States", countryCode: "US", region: "Michigan",        status: "live", href: "/harbor-springs/",         baseTowns: ["Harbor Springs"],                                            mountains: ["Boyne Mountain", "The Highlands", "Nub's Nob"],          headlineLabel: "Harbor Springs", headline: null },
  { id: "keweenaw-peninsula",     name: "Keweenaw Peninsula",              country: "United States", countryCode: "US", region: "Michigan",        status: "live", href: "/keweenaw-peninsula/",     baseTowns: ["Mohawk"],                                                    mountains: ["Mt. Bohemia"],                                              headlineLabel: "Mohawk", headline: null },
  { id:"poconos",name:"Poconos",country:"United States",countryCode:"US",region:"Pennsylvania",status:"live",href:"/poconos/",baseTowns:["Tannersville","Pocono Manor"],mountains:["Camelback Mountain Resort","Blue Mountain Resort","Shawnee Mountain Ski Area"],headlineLabel:"Tannersville",headline:null },
  { id:"laurel-highlands",name:"Laurel Highlands",country:"United States",countryCode:"US",region:"Pennsylvania",status:"live",href:"/laurel-highlands/",baseTowns:["Seven Springs"],mountains:["Seven Springs Mountain Resort","Blue Knob All Seasons Resort"],headlineLabel:"Seven Springs",headline:null },
  {id:"berkshires",name:"Berkshires",country:"United States",countryCode:"US",region:"Massachusetts",status:"live",href:"/berkshires/",baseTowns:["Hancock","Great Barrington"],mountains:["Jiminy Peak","Ski Butternut","Berkshire East"],headlineLabel:"Hancock",headline:null},
  {id:"central-massachusetts",name:"Central Massachusetts",country:"United States",countryCode:"US",region:"Massachusetts",status:"live",href:"/central-massachusetts/",baseTowns:["Princeton"],mountains:["Wachusett Mountain"],headlineLabel:"Princeton",headline:null},
  {id:"lutsen-north-shore",name:"Lutsen / North Shore",country:"United States",countryCode:"US",region:"Minnesota",status:"live",href:"/lutsen-north-shore/",baseTowns:["Lutsen"],mountains:["Lutsen Mountains"],headlineLabel:"Lutsen",headline:null},
  { id: "mt-hood",                name: "Mt. Hood",                        country: "United States", countryCode: "US", region: "Oregon",          status: "live", href: "/mt-hood/",               baseTowns: ["Government Camp"],                                           mountains: ["Mt. Hood Meadows", "Timberline Lodge", "Mt. Hood Skibowl"], headlineLabel: "Mt. Hood",     headline: null },
  { id: "bend",                   name: "Bend",                            country: "United States", countryCode: "US", region: "Oregon",          status: "live", href: "/bend/",                  baseTowns: ["Bend"],                                                      mountains: ["Mt. Bachelor"],                                            headlineLabel: "Bend",         headline: null },
  { id: "crystal-mountain",       name: "Crystal Mountain",                country: "United States", countryCode: "US", region: "Washington",      status: "live", href: "/crystal-mountain/",       baseTowns: ["Enumclaw"],                                                  mountains: ["Crystal Mountain Resort"],                                headlineLabel: "Crystal Mountain", headline: null },
  { id: "snoqualmie-pass",        name: "Snoqualmie Pass",                 country: "United States", countryCode: "US", region: "Washington",      status: "live", href: "/snoqualmie-pass/",        baseTowns: ["Snoqualmie Pass"],                                           mountains: ["The Summit at Snoqualmie"],                               headlineLabel: "Snoqualmie Pass", headline: null },
  { id: "stevens-pass",           name: "Stevens Pass",                    country: "United States", countryCode: "US", region: "Washington",      status: "live", href: "/stevens-pass/",           baseTowns: ["Skykomish"],                                                 mountains: ["Stevens Pass Ski Area"],                                   headlineLabel: "Stevens Pass", headline: null },
  { id: "mt-baker",               name: "Mt. Baker",                       country: "United States", countryCode: "US", region: "Washington",      status: "live", href: "/mt-baker/",               baseTowns: ["Glacier"],                                                   mountains: ["Mt. Baker Ski Area"],                                      headlineLabel: "Mt. Baker",    headline: null },
  { id: "sun-valley",             name: "Sun Valley",                      country: "United States", countryCode: "US", region: "Idaho",          status: "live", href: "/sun-valley/",             baseTowns: ["Ketchum"],                                                   mountains: ["Bald Mountain", "Dollar Mountain"],                       headlineLabel: "Sun Valley",   headline: null },
  { id: "sandpoint",              name: "Sandpoint",                       country: "United States", countryCode: "US", region: "Idaho",          status: "live", href: "/sandpoint/",              baseTowns: ["Sandpoint"],                                                 mountains: ["Schweitzer Mountain Resort"],                             headlineLabel: "Sandpoint",    headline: null },
  { id: "boise",                  name: "Boise",                           country: "United States", countryCode: "US", region: "Idaho",          status: "live", href: "/boise/",                 baseTowns: ["Boise"],                                                     mountains: ["Bogus Basin"],                                             headlineLabel: "Boise",        headline: null },
  { id: "donnelly-mccall",        name: "Donnelly / McCall",               country: "United States", countryCode: "US", region: "Idaho",          status: "live", href: "/donnelly-mccall/",        baseTowns: ["Donnelly"],                                                  mountains: ["Tamarack Resort", "Brundage Mountain"],                   headlineLabel: "Donnelly / McCall", headline: null },
  { id: "white-mountains",       name: "White Mountains",                country: "United States", countryCode: "US", region: "New Hampshire",   status: "live", href: "/white-mountains/",       baseTowns: ["North Conway"], mountains: ["Cranmore Mountain", "Wildcat Mountain", "Attitash Mountain Resort"], headlineLabel: "North Conway", headline: null },
  { id: "franconia-notch",       name: "Franconia Notch",                country: "United States", countryCode: "US", region: "New Hampshire",   status: "live", href: "/franconia-notch/",       baseTowns: ["Franconia", "Bretton Woods"], mountains: ["Cannon Mountain", "Bretton Woods", "Loon Mountain"], headlineLabel: "Franconia", headline: null },
  { id: "waterville-valley",     name: "Waterville Valley",              country: "United States", countryCode: "US", region: "New Hampshire",   status: "live", href: "/waterville-valley/",     baseTowns: ["Waterville Valley"], mountains: ["Waterville Valley Resort"], headlineLabel: "Waterville Valley", headline: null },
  { id: "lakes-region",          name: "Lakes Region",                   country: "United States", countryCode: "US", region: "New Hampshire",   status: "live", href: "/lakes-region/",          baseTowns: ["Gilford"], mountains: ["Gunstock Mountain Resort"], headlineLabel: "Gilford", headline: null },
  { id: "carrabassett-valley", name: "Carrabassett Valley", country: "United States", countryCode: "US", region: "Maine", status: "live", href: "/carrabassett-valley/", baseTowns: ["Carrabassett Valley"], mountains: ["Sugarloaf"], headlineLabel: "Carrabassett Valley", headline: null },
  { id: "newry-bethel", name: "Newry / Bethel", country: "United States", countryCode: "US", region: "Maine", status: "live", href: "/newry-bethel/", baseTowns: ["Newry"], mountains: ["Sunday River"], headlineLabel: "Newry / Bethel", headline: null },
  { id: "rangeley", name: "Rangeley", country: "United States", countryCode: "US", region: "Maine", status: "live", href: "/rangeley/", baseTowns: ["Rangeley"], mountains: ["Saddleback Mountain"], headlineLabel: "Rangeley", headline: null },
  { id: "lake-placid", name: "Lake Placid", country: "United States", countryCode: "US", region: "New York", status: "live", href: "/lake-placid/", baseTowns: ["Lake Placid", "Wilmington"], mountains: ["Whiteface Mountain"], headlineLabel: "Lake Placid", headline: null },
  { id: "north-creek", name: "North Creek", country: "United States", countryCode: "US", region: "New York", status: "live", href: "/north-creek/", baseTowns: ["North Creek"], mountains: ["Gore Mountain"], headlineLabel: "North Creek", headline: null },
  { id: "hunter", name: "Hunter", country: "United States", countryCode: "US", region: "New York", status: "live", href: "/hunter/", baseTowns: ["Hunter"], mountains: ["Hunter Mountain"], headlineLabel: "Hunter", headline: null },
  { id: "windham", name: "Windham", country: "United States", countryCode: "US", region: "New York", status: "live", href: "/windham/", baseTowns: ["Windham"], mountains: ["Windham Mountain Club"], headlineLabel: "Windham", headline: null },
  { id: "highmount", name: "Highmount", country: "United States", countryCode: "US", region: "New York", status: "live", href: "/highmount/", baseTowns: ["Highmount"], mountains: ["Belleayre Mountain"], headlineLabel: "Highmount", headline: null },
];

// Map a region to the base town we surface in the country card. This is
// the town a visitor most likely stays in for that region.
const PRIMARY_TOWN: Record<string, string> = {
  "snowy-mountains":         "Jindabyne",
  "victorias-high-country":  "Mount Beauty",
  "yamanouchi":              "Yudanaka",
  "nozawa-onsen":            "Nozawa Onsen",
  "iiyama":                  "Iiyama",
  "hakuba-valley":           "Hakuba",
  "myoko":                   "Akakura Onsen",
  "niseko":                  "Hirafu",
  "furano":                  "Furano",
  "sapporo":                 "Sapporo",
  "bandai":                  "Urabandai",
  "daisen":                  "Daisenji",
  "tomamu-sahoro":           "Tomamu",
  "asahikawa":               "Asahikawa",
  "rusutsu-kiroro":          "Rusutsu",
  "yuzawa":                  "Echigo-Yuzawa",
  "zao-onsen":               "Zao Onsen",
  "hakkoda-aomori-spring":   "Sukayu Onsen",
  "appi-shizukuishi":        "Appi Kogen",
  "minakami":                "Minakami",
  "kusatsu-manza":           "Kusatsu Onsen",
  "hachimantai":             "Hachimantai",
  "queenstown":              "Queenstown",
  "wanaka":                  "Wanaka",
  "mt-hutt":                 "Methven",
  "ruapehu":                 "Ohakune",
  "whistler":                "Whistler",
  "powder-highway":          "Revelstoke",
  "banff-lake-louise":       "Banff",
  "canmore":                 "Canmore",
  "jasper":                  "Jasper",
  "quebec-laurentians":      "Mont-Tremblant",
  "quebec-charlevoix":       "Beaupré",
  "quebec-eastern-townships": "Bromont",
  "summit-county":            "Breckenridge",
  "vail-valley":              "Vail",
  "aspen-snowmass":           "Aspen",
  "steamboat":                "Steamboat Springs",
  "winter-park":              "Winter Park",
  "crested-butte":            "Crested Butte",
  "telluride":                "Telluride",
  "durango":                  "Durango",
  "boulder-front-range":      "Nederland",
  "cottonwood-canyons":       "Salt Lake City",
  "park-city":                "Park City",
  "ogden-valley":             "Ogden",
  "provo":                    "Provo",
  "cache-valley":             "Logan",
  "north-lake-tahoe":         "Truckee",
  "south-lake-tahoe":         "South Lake Tahoe",
  "mammoth-lakes":            "Mammoth Lakes",
  "big-bear":                 "Big Bear Lake",
  "bear-valley":              "Arnold",
  "mt-shasta":                "Mount Shasta",
  "killington-pico":          "Killington",
  "stowe-smugglers-notch":    "Stowe",
  "mad-river-valley":         "Waitsfield",
  "southern-vermont":         "Manchester",
  "okemo":                    "Ludlow",
  "jay-peak-nek":             "Jay",
  "jackson-hole":             "Jackson",
  "grand-targhee":            "Alta",
  "big-sky":                  "Big Sky",
  "bozeman-bridger-bowl":     "Bozeman",
  "whitefish":                "Whitefish",
  "red-lodge":                "Red Lodge",
  "taos":                     "Taos Ski Valley",
  "angel-fire":               "Angel Fire",
  "santa-fe":                 "Santa Fe",
  "albuquerque-sandia":       "Albuquerque",
  "harbor-springs":           "Harbor Springs",
  "keweenaw-peninsula":       "Mohawk",
  "poconos":                  "Tannersville",
  "laurel-highlands":         "Seven Springs",
  "berkshires":               "Hancock",
  "central-massachusetts":    "Princeton",
  "lutsen-north-shore":      "Lutsen",
  "mt-hood":                  "Government Camp",
  "bend":                     "Bend",
  "crystal-mountain":         "Enumclaw",
  "snoqualmie-pass":          "Snoqualmie Pass",
  "stevens-pass":             "Skykomish",
  "mt-baker":                 "Glacier",
  "sun-valley":               "Ketchum",
  "sandpoint":                "Sandpoint",
  "boise":                    "Boise",
  "donnelly-mccall":          "Donnelly",
  "white-mountains":           "North Conway",
  "franconia-notch":           "Franconia",
  "waterville-valley":         "Waterville Valley",
  "lakes-region":              "Gilford",
  "carrabassett-valley":       "Carrabassett Valley",
  "newry-bethel":              "Newry",
  "rangeley":                  "Rangeley",
  "lake-placid":               "Lake Placid",
  "north-creek":               "North Creek",
  "hunter":                    "Hunter",
  "windham":                   "Windham",
  "highmount":                 "Highmount",
};

// AU + NZ = southern hemisphere (snow Jun-Sep); JP + CA + US = northern (snow Dec-Mar).
function seasonForCountry(code: "AU" | "JP" | "NZ" | "CA" | "US"): "winter" | "green" {
  const month = new Date().getMonth() + 1;
  if (code === "AU" || code === "NZ") return month >= 6 && month <= 9 ? "winter" : "green";
  return month >= 12 || month <= 3 ? "winter" : "green";
}

const balance: CSSProperties = { textWrap: "balance" as CSSProperties["textWrap"] };

/**
 * Country / region picker body · the AU + JP + NZ country cards (each listing
 * its live regions with current temps) plus the trust line. Shared between the
 * standalone /countries page and the location-first landing, so the "choose a
 * region" step reads identically whether it opens on its own or continues
 * directly below the visitor's local conditions. Reads the same ["regions"]
 * query cache the landing already warms, so it never costs an extra request.
 */
export function CountryPicker() {
  const [now, setNow] = useState(() => Date.now());
  void now;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { data } = useQuery<RegionsResponse>({
    queryKey: ["regions"],
    queryFn: async () => {
      const res = await fetch("/api/regions");
      if (!res.ok) throw new Error("Failed to load regions");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const regions = data?.regions ?? FALLBACK_REGIONS;
  const liveCount = regions.filter((r) => r.status === "live").length;

  type Country = { code: "AU" | "JP" | "NZ" | "CA" | "US"; name: string; flag: string; regions: Region[] };
  const COUNTRIES: Country[] = ([
    // Season-first ordering: Australia + New Zealand (jun-oct season) before
    // Japan, Canada and the United States (dec-mar).
    { code: "AU" as const, name: "Australia",   flag: "\u{1F1E6}\u{1F1FA}", regions: regions.filter((r) => r.countryCode === "AU") },
    { code: "NZ" as const, name: "New Zealand", flag: "\u{1F1F3}\u{1F1FF}", regions: regions.filter((r) => r.countryCode === "NZ") },
    { code: "JP" as const, name: "Japan",       flag: "\u{1F1EF}\u{1F1F5}", regions: regions.filter((r) => r.countryCode === "JP") },
    { code: "CA" as const, name: "Canada",      flag: "\u{1F1E8}\u{1F1E6}", regions: regions.filter((r) => r.countryCode === "CA") },
    { code: "US" as const, name: "United States", flag: "\u{1F1FA}\u{1F1F8}", regions: regions.filter((r) => r.countryCode === "US") },
  ] satisfies Country[]).filter((c) => c.regions.length > 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {COUNTRIES.map((country, idx) => {
          const season = seasonForCountry(country.code);
          const isWinter = season === "winter";
          const ring = isWinter ? "ring-sky-400/70" : "ring-emerald-400/70";
          const pillText = isWinter ? "text-sky-700" : "text-emerald-700";
          const dot = isWinter ? "bg-sky-500" : "bg-emerald-500";
          const seasonLabel = isWinter ? "snow season" : "green season";
          const liveInCountry = country.regions.filter((r) => r.status === "live").length;

          return (
            <motion.a
              key={country.code}
              href={`/${country.code.toLowerCase()}/`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
              className={`group block rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(15,23,42,0.08)] ring-2 ${ring} transition-transform hover:-translate-y-0.5`}
            >
              <header className="flex items-center gap-3">
                <span aria-hidden className="text-3xl leading-none">{country.flag}</span>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-tight tracking-tight text-sky-900">
                    {country.name}
                  </h3>
                  <p className={`mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${pillText}`}>
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-60`} />
                      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot}`} />
                    </span>
                    {seasonLabel} &middot; {liveInCountry} {liveInCountry === 1 ? "region live" : "regions live"}
                  </p>
                </div>
              </header>

              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed">
                {country.regions.map((r) => {
                  const town = PRIMARY_TOWN[r.id] ?? r.headlineLabel ?? r.baseTowns[0];
                  const temp = r.headline?.tempC;
                  // Drop the trailing town if it duplicates the region
                  // name (e.g. "Nozawa Onsen · Nozawa Onsen").
                  const showTown = town && town.toLowerCase() !== r.name.toLowerCase();
                  return (
                    <li key={r.id} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-slate-700">
                        <span className="font-semibold text-slate-900">{r.name}</span>
                        {showTown && (
                          <>
                            <span className="text-slate-400"> &middot; </span>
                            {town}
                          </>
                        )}
                      </span>
                      <span className="shrink-0 text-base font-bold tabular-nums text-sky-900">
                        {typeof temp === "number" ? `${Math.round(temp)}\u00B0C` : "\u2013"}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <span className="mt-4 inline-flex items-center text-xs font-semibold tracking-wide text-sky-700 group-hover:text-sky-900">
                explore {country.name.toLowerCase()}
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </motion.a>
          );
        })}
      </div>

      {/* TRUST LINE */}
      <p
        className="mx-auto mt-6 max-w-md text-center text-[11px] leading-relaxed text-slate-400"
        style={balance}
      >
        {liveCount} {liveCount === 1 ? "region" : "regions"} live &middot;{" "}
        <span className="tabular-nums">{data?.sourceCount ?? 7}</span> official sources &middot;{" "}
        <span className="tabular-nums">{data?.refreshIntervalMin ?? 15}</span>&nbsp;min refresh
      </p>
    </>
  );
}
