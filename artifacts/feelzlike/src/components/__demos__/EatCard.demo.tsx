import { EatCard } from "@/components/EatCard";
import { getEatsByTown } from "@/data";
import type { Eat, TownSlug } from "@/types/stayEat";

interface DemoSpec {
  town: TownSlug;
  id: string;
  caption: string;
}

// Six cards covering every type currently present in curated data, balanced
// across both regions. One per major Eat.type - gives the visual reviewer one
// example of each badge colour and one example of each region's discriminated
// extras (AU: après-ski/takeaway/groceries; JP: cash-only/EN-menu/picture).
const SPECS: readonly DemoSpec[] = [
  { town: "jindabyne",   id: "sundance-bakehouse-jindabyne",   caption: "Jindabyne · bakery (Sundance Bakehouse)" },
  { town: "berridale",   id: "berridale-inn-pub-restaurant",   caption: "Berridale · pub (Berridale Inn)" },
  { town: "jindabyne",   id: "bacco-italian-restaurant",       caption: "Jindabyne · restaurant (Bacco)" },
  { town: "shibu_onsen", id: "ramen-tokumi",                   caption: "Shibu Onsen · ramen (Tokumi)" },
  { town: "shibu_onsen", id: "chokkun-izakaya",                caption: "Shibu Onsen · izakaya (Chokkun)" },
  { town: "yudanaka",    id: "enza-cafe",                      caption: "Yudanaka · cafe (Enza)" },
] as const;

interface ResolvedDemo {
  spec: DemoSpec;
  eat: Eat | null;
}

function resolveDemos(): ResolvedDemo[] {
  return SPECS.map((spec) => {
    const eat = getEatsByTown(spec.town).find((e) => e.id === spec.id) ?? null;
    return { spec, eat };
  });
}

export default function EatCardDemo() {
  const demos = resolveDemos();
  const missing = demos.filter((d) => !d.eat);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-5">
        <p className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
          Component preview · Sprint 3 · Prompt 3.2
        </p>
        <h1 className="font-display text-2xl mt-1">EatCard - region-aware listing</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Six cards covering every Eat type present in the curated dataset. Same component
          renders both AU and JP records via the discriminated{" "}
          <code className="px-1 rounded bg-muted text-[11px]">country</code> field. The
          &ldquo;Hours unverified&rdquo; pill is the Prompt&nbsp;3.2 placeholder &mdash;
          Prompt&nbsp;3.4 swaps in timezone-aware open/closed logic without any wiring change
          here.
        </p>
        {missing.length > 0 ? (
          <p
            role="alert"
            className="mt-3 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-900"
          >
            {missing.length} demo record{missing.length === 1 ? "" : "s"} not found:{" "}
            {missing.map((m) => `${m.spec.town}/${m.spec.id}`).join(", ")}
          </p>
        ) : null}
      </header>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {demos.map(({ spec, eat }) => (
          <figure key={`${spec.town}/${spec.id}`} className="flex flex-col gap-2">
            {eat ? (
              <EatCard eat={eat} />
            ) : (
              <div
                role="alert"
                className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-rose-300 bg-rose-50/50 p-4 text-center text-xs text-rose-900"
              >
                Eat record not found: <code>{spec.town}/{spec.id}</code>
              </div>
            )}
            <figcaption className="text-[11px] text-muted-foreground italic px-1">
              {spec.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
