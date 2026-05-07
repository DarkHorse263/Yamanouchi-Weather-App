import { StayCard } from "@/components/StayCard";
import { getStaysByTown } from "@/data";
import type { Stay, TownSlug } from "@/types/stayEat";

interface DemoSpec {
  town: TownSlug;
  id: string;
  caption: string;
}

// The 4 demo stays explicitly named in the playbook (Prompt 2.2).
// Note: Hotel Issa-tei is curated as `type: "ryokan"` (not "hotel") - we keep
// the playbook's wording in the caption since the chosen record is correct;
// the type-badge will read RYOKAN, which is the truthful classification.
const SPECS: readonly DemoSpec[] = [
  { town: "shibu_onsen", id: "yorozuya",                       caption: "Yamanouchi · ryokan (Yorozuya)" },
  { town: "yudanaka",    id: "hotel-issa-tei-biyu-no-yado",    caption: "Yamanouchi · hotel-style ryokan (Hotel Issa-tei)" },
  { town: "jindabyne",   id: "lake-crackenback-resort",        caption: "Jindabyne · alpine resort (Lake Crackenback)" },
  { town: "berridale",   id: "cottonwood-lodge-berridale",     caption: "Berridale · ski lodge (Cottonwood Lodge)" },
] as const;

interface ResolvedDemo {
  spec: DemoSpec;
  stay: Stay | null;
}

function resolveDemos(): ResolvedDemo[] {
  return SPECS.map((spec) => {
    const stay = getStaysByTown(spec.town).find((s) => s.id === spec.id) ?? null;
    return { spec, stay };
  });
}

export default function StayCardDemo() {
  const demos = resolveDemos();

  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-6">
        <p className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
          Component preview · Sprint 2 · Prompt 2.2
        </p>
        <h1 className="font-display text-2xl mt-1">StayCard - region-aware listing</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Four cards: a Yamanouchi ryokan, a Yamanouchi hotel-style ryokan, a Jindabyne alpine
          resort, and a Berridale ski lodge. Same component renders both AU and JP records via
          the discriminated <code className="px-1 rounded bg-muted text-[11px]">country</code>{" "}
          field.
        </p>
      </header>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {demos.map(({ spec, stay }) => (
          <figure key={`${spec.town}/${spec.id}`} className="flex flex-col gap-2">
            {stay ? (
              <StayCard stay={stay} />
            ) : (
              <div
                role="alert"
                className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-rose-300 bg-rose-50/50 p-4 text-center text-xs text-rose-900"
              >
                Demo record <code className="font-mono">{spec.id}</code> not found in town{" "}
                <code className="font-mono">{spec.town}</code>.
              </div>
            )}
            <figcaption className="text-[11px] text-muted-foreground">{spec.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
