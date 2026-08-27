import { ArrowUpRight, Mountain } from "lucide-react";
import { Link } from "wouter";
import { PageHeader, useBaseTown, useLanguage, useRegion } from "@workspace/feelzlike-shell";
import { PageMeta } from "@/lib/seo/PageMeta";
import { catalogueTownLandingModel } from "@/regions/catalogue";

export function CatalogueTownHome() {
  const { region } = useRegion();
  const { town } = useBaseTown();
  const { t } = useLanguage();

  if (!town) return null;
  const model = catalogueTownLandingModel(region, town);
  if (!model) return null;

  return (
    <div className="px-4 md:px-10 py-4 md:py-8 max-w-4xl mx-auto">
      <PageMeta
        title={`${town.name} - nearby mountain weather`}
        description={`${town.name} is a base for published mountain weather in ${region.name}. Choose a nearby mountain for its forecast.`}
        path={`/${region.id}/${town.id}`}
      />
      <PageHeader
        byline={`${region.name} · ${t("Base town", "拠点の町")}`}
        title={t(town.name, town.nameJa)}
        description={t(
          model.description,
          "この拠点では町の天気を現在公開していません。近隣の山を選んで、山岳天気と予報をご確認ください。",
        )}
      />

      <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)]">
        <p className="text-[14px] font-bold lowercase text-[#0055FF]">
          {t(model.heading, "近隣の公開済み山岳天気")}
        </p>
        <div className="mt-4 space-y-3">
          {model.mountains.map((mountain) => (
            <Link
              key={mountain.id}
              href={`~${mountain.href}`}
              className="group flex items-center gap-4 rounded-2xl bg-[#F0F5FF] p-4 hover:bg-[#0055FF] transition-colors"
            >
              <Mountain className="h-5 w-5 shrink-0 text-[#0055FF] group-hover:text-white" />
              <span className="min-w-0 flex-1 font-display text-lg font-black lowercase text-[#0F172A] group-hover:text-white">
                {t(mountain.name, mountain.nameJa)}
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-[#0055FF] group-hover:text-white" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}