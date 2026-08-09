const fs = require('fs');

let content = fs.readFileSync('artifacts/feelzlike/src/regions/region-pins.ts', 'utf8');

const prefix = `
export type RegionKey =
  | "snowy-mountains"
  | "victorias-high-country"
  | "tasmania"
  | "yamanouchi"
  | "nozawa-onsen"
  | "iiyama"
  | "hakuba-valley"
  | "myoko"
  | "niseko"
  | "furano"
  | "sapporo"
  | "tomamu-sahoro"
  | "asahikawa"
  | "rusutsu-kiroro"
  | "yuzawa"
  | "zao-onsen"
  | "hakkoda-aomori-spring"
  | "appi-shizukuishi"
  | "bandai"
  | "daisen"
  | "minakami"
  | "kusatsu-manza"
  | "hachimantai"
  | "queenstown"
  | "wanaka"
  | "mt-hutt"
  | "ruapehu"
  | "whistler"
  | "powder-highway"
  | "okanagan"
  | "vancouver"
  | "banff-lake-louise"
  | "canmore"
  | "jasper"
  | "quebec-laurentians"
  | "quebec-charlevoix"
  | "quebec-eastern-townships";

export interface PinSpec { id: string; name: string; lat: number; lng: number; accent: string }

`;

fs.writeFileSync('artifacts/feelzlike/src/regions/region-pins.ts', prefix + content);
