import { useMemo, useState } from "react";

import { StayMap } from "@/components/StayMap";
import { Button } from "@/components/ui/button";
import { getStaysByRegion } from "@/data";

// Two-region demo for the StayMap component. Each panel mounts a StayMap with
// its own region's stays and that region's curated "today's #1 mountain" key
// (faked here - the real consumer page in Prompt 2.6 will read it from
// Today's Call). A toggle lets us flip the topMountainDriveKey to verify
// markers recolour correctly.
export default function StayMapDemo() {
  const auStays = useMemo(() => getStaysByRegion("snowy_mountains"), []);
  const jpStays = useMemo(() => getStaysByRegion("yamanouchi"), []);

  const [auTopKey, setAuTopKey] = useState<string>("thredbo");
  const [jpTopKey, setJpTopKey] = useState<string>("shiga_kogen");

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-9">
      <header className="space-y-2">
        <h1 className="font-display text-3xl">StayMap demo</h1>
        <p className="text-sm text-muted-foreground">
          Markers colour-bucketed by drive-time to today's #1 mountain (curated key).
          Click a marker → popover with photo, type, price band, drive time,
          View details (opens the same Sheet as a StayCard click), and Book
          (primary booking provider).
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display text-xl">
            Snowy Mountains (NSW) - {auStays.length} stays
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Top mountain:</span>
            {(["thredbo", "perisher", "charlottes_pass", "selwyn"] as const).map((k) => (
              <Button
                key={k}
                size="sm"
                variant={auTopKey === k ? "default" : "outline"}
                onClick={() => setAuTopKey(k)}
                className="h-7 px-2 text-[11px]"
              >
                {k}
              </Button>
            ))}
          </div>
        </div>
        <StayMap
          stays={auStays}
          topMountainDriveKey={auTopKey}
          fallbackCenter={{ lat: -36.41, lng: 148.62 }}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display text-xl">
            Yamanouchi (JP) - {jpStays.length} stays
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Top mountain:</span>
            {([
              "shiga_kogen",
              "yakebitaiyama",
              "okushiga_kogen",
              "ryuoo",
              "kita_shiga",
              "yomase_onsen",
            ] as const).map((k) => (
              <Button
                key={k}
                size="sm"
                variant={jpTopKey === k ? "default" : "outline"}
                onClick={() => setJpTopKey(k)}
                className="h-7 px-2 text-[11px]"
              >
                {k}
              </Button>
            ))}
          </div>
        </div>
        <StayMap
          stays={jpStays}
          topMountainDriveKey={jpTopKey}
          fallbackCenter={{ lat: 36.74, lng: 138.43 }}
        />
      </section>
    </div>
  );
}
