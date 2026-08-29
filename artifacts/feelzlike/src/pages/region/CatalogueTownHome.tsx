import { ArrowUpRight, Building2, Mountain } from "lucide-react";
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
        title={model.indoorOnly ? `${town.name} - indoor snow facility` : `${town.name} - nearby mountain weather`}
        description={model.indoorOnly
          ? `${town.name} has an indoor snow facility in ${region.name}. Outdoor mountain weather and snow forecasts do not apply.`
          : `${town.name} is a base for published mountain weather in ${region.name}. Choose a nearby mountain for its forecast.`}
        path={`/${region.id}/${town.id}`}
      />
      <PageHeader
        byline={`${region.name} · ${t(model.indoorOnly ? "Indoor facility directory" : "Base town", model.indoorOnly ? "屋内施設案内" : "拠点の町")}`}
        title={t(town.name, town.nameJa)}
        description={t(
          model.description,
          model.indoorOnly
            ? "屋内スノー施設の案内です。屋外の山岳天気・リフト状況・自然降雪予報は対象外です。"
            : "この拠点では町の天気を現在公開していません。近隣の山を選んで、山岳天気と予報をご確認ください。",
        )}
      />

      <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)]">
        <p className="text-[14px] font-bold lowercase text-[#0055FF]">
          {t(model.heading, model.indoorOnly ? "近隣の屋内スノー施設" : "近隣の公開済み山岳天気")}
        </p>
        <div className="mt-4 space-y-3">
          {model.mountains.map((mountain) => (
            <Link
              key={mountain.id}
              href={`~${mountain.href}`}
              className="group flex items-center gap-4 rounded-2xl bg-[#F0F5FF] p-4 hover:bg-[#0055FF] transition-colors"
            >
              {mountain.indoor
                ? <Building2 className="h-5 w-5 shrink-0 text-[#0055FF] group-hover:text-white" />
                : <Mountain className="h-5 w-5 shrink-0 text-[#0055FF] group-hover:text-white" />}
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