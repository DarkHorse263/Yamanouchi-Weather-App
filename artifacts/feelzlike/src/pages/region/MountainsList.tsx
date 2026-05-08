import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Mountain as MountainIcon,
  Activity,
  ExternalLink,
  ChevronDown,
  Layers,
} from "lucide-react";
import { useRegion, useLanguage } from "@workspace/feelzlike-shell";
import type { MountainLink } from "@workspace/feelzlike-shell";

/**
 * Region mountains list.
 *
 * Apr 2026 reset:
 * - Mountains with `parentId` are folded into a single expandable group
 *   row (e.g. the 18 Shiga Kogen sub-resorts collapse to one card you can
 *   open). Stand-alone mountains (no parentId) render flat as before.
 * - Palette tightened to white + blue family (sky/blue) per the brand
 *   pass - old purple/teal aurora and gradient name treatment are gone.
 */

interface ParentGroupMeta {
  /** Display name shown on the group card */
  name: string;
  nameJa: string;
  /** One-liner shown beneath the title */
  blurb: string;
  blurbJa: string;
}

const PARENT_GROUP_META: Record<string, ParentGroupMeta> = {
  "shiga-kogen": {
    name: "Shiga Kogen",
    nameJa: "志賀高原",
    blurb: "Japan's largest interconnected ski area · 18 linked resorts on one lift pass",
    blurbJa: "日本最大の連結スキーエリア · 18のスキー場を1枚のリフト券で滑走",
  },
  "kita-shiga": {
    name: "Kita-Shiga Kogen",
    nameJa: "北志賀高原",
    blurb: "Western-slope cluster · 4 resorts separate from the Shiga Kogen pass system",
    blurbJa: "西斜面のリゾート群 · 志賀高原のリフト券とは別系統の4スキー場",
  },
};

export function MountainsList() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const mountains = region.mountains ?? [];

  const { groups, standalone } = useMemo(() => groupMountains(mountains), [mountains]);

  const totalCount = mountains.length;

  return (
    <div className="relative">
      {/* Soft blue backdrop - palette pass replaces the purple/teal aurora. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at center, hsla(210,90%,55%,0.20), transparent 60%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent 60%, hsl(var(--background)) 100%)",
          }}
        />
      </div>

      <div className="relative px-6 md:px-10 py-10 md:py-14 max-w-6xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center gap-3">
            <span className="byline text-foreground/80">
              {region.name} · {region.subtitle}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {t("Live", "ライブ")}
            </span>
          </div>

          <h1
            className="font-display font-semibold text-5xl md:text-6xl tracking-tight text-blue-900 mt-3"
            style={{ letterSpacing: "-0.035em" }}
          >
            {t("Mountains", "スキー場")}
          </h1>

          <div className="flex items-end justify-between gap-6 mt-4 max-w-3xl">
            <p className="text-muted-foreground max-w-xl">
              {t(
                "Real-time conditions, lift status and live cams for every mountain in the region.",
                "地域内すべてのスキー場のリアルタイム状況・リフト稼働・ライブカメラ。",
              )}
            </p>
            <div className="text-right shrink-0">
              <p className="display-number text-4xl md:text-5xl text-blue-900 tnum">
                {String(totalCount).padStart(2, "0")}
              </p>
              <p className="byline text-muted-foreground/70 mt-1">
                {t("Mountains tracked", "対象スキー場")}
              </p>
            </div>
          </div>

          <div className="rule mt-8 mb-10" />
        </motion.header>

        {totalCount === 0 ? (
          <p className="text-muted-foreground">
            {t("No mountains configured for this region yet.", "スキー場は未設定です。")}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((group, gi) => (
              <ParentGroupCard
                key={`group-${group.parentId}`}
                parentId={group.parentId}
                children={group.children}
                index={gi}
                t={t}
              />
            ))}
            {standalone.map((m, i) => (
              <MountainCard
                key={m.id}
                mountain={m}
                index={groups.length + i}
                indexLabel={`M${String(groups.length + i + 1).padStart(2, "0")}`}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function groupMountains(mountains: MountainLink[]) {
  const standalone: MountainLink[] = [];
  const childrenByParent = new Map<string, MountainLink[]>();

  for (const m of mountains) {
    if (m.parentId) {
      if (!childrenByParent.has(m.parentId)) childrenByParent.set(m.parentId, []);
      childrenByParent.get(m.parentId)!.push(m);
    } else {
      standalone.push(m);
    }
  }

  const groups = Array.from(childrenByParent.entries()).map(([parentId, children]) => ({
    parentId,
    children,
  }));

  return { groups, standalone };
}

function ParentGroupCard({
  parentId,
  children,
  index,
  t,
}: {
  parentId: string;
  children: MountainLink[];
  index: number;
  t: (en: string, ja: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const meta = PARENT_GROUP_META[parentId] ?? {
    name: parentId,
    nameJa: parentId,
    blurb: "",
    blurbJa: "",
  };

  // Quick stats for the closed-state header.
  const elevations = children.map((c) => c.elevationM ?? 0).filter((e) => e > 0);
  const maxElev = elevations.length > 0 ? Math.max(...elevations) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="rounded-2xl border border-blue-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left p-5 hover:bg-blue-50/40 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="byline text-muted-foreground/80 tnum">G{String(index + 1).padStart(2, "0")}</span>
            <span className="byline text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1 byline text-foreground/80">
              <Layers className="w-3 h-3" /> {t("Group", "グループ")}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
            {children.length} {t("resorts", "スキー場")}
          </span>
        </div>

        <p className="font-display font-semibold text-2xl tracking-tight text-blue-900 mt-4 leading-tight">
          {t(meta.name, meta.nameJa)}
        </p>
        {meta.blurb && (
          <p className="text-sm text-muted-foreground mt-2 leading-snug">
            {t(meta.blurb, meta.blurbJa)}
          </p>
        )}

        <div className="rule mt-5 mb-4" />
        <div className="flex items-end justify-between">
          <div>
            <p className="byline text-muted-foreground/70">{t("Highest summit", "最高標高")}</p>
            <p className="display-number text-3xl text-blue-900 tnum mt-0.5">
              {maxElev > 0 ? maxElev.toLocaleString() : "-"}
              <span className="text-base text-muted-foreground/70 font-normal ml-1">m</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
            {open ? t("Collapse", "閉じる") : t("Expand", "展開")}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-blue-100 bg-blue-50/20"
          >
            <ul className="divide-y divide-blue-100/60">
              {children.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/mountain/${m.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {t(m.name, m.nameJa ?? m.name)}
                      </p>
                      {m.blurb && (
                        <p className="text-xs text-muted-foreground truncate">
                          {t(m.blurb, m.blurbJa ?? m.blurb)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {m.elevationM !== undefined && (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {m.elevationM.toLocaleString()} m
                        </span>
                      )}
                      <ArrowUpRight className="w-4 h-4 text-blue-600" aria-hidden />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MountainCard({
  mountain: m,
  index,
  indexLabel,
  t,
}: {
  mountain: MountainLink;
  index: number;
  indexLabel: string;
  t: (en: string, ja: string) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Link
        href={`/mountain/${m.id}`}
        className="group relative block rounded-2xl border border-blue-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all h-full"
      >
        {/* top row */}
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="byline text-muted-foreground/80 tnum">{indexLabel}</span>
            <span className="byline text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1 byline text-foreground/80">
              <MountainIcon className="w-3 h-3" /> {t("Mountain", "スキー場")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              <Activity className="w-2 h-2" />
              {t("Live", "ライブ")}
            </span>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-blue-700 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        <p className="font-display font-semibold text-2xl tracking-tight text-blue-900 mt-4 leading-tight">
          {t(m.name, m.nameJa ?? m.name)}
        </p>

        {m.blurb && (
          <p className="text-sm text-muted-foreground mt-2 leading-snug line-clamp-2">
            {t(m.blurb, m.blurbJa ?? m.blurb)}
          </p>
        )}

        {m.elevationM !== undefined && (
          <>
            <div className="rule mt-5 mb-4" />
            <div className="flex items-end justify-between">
              <div>
                <p className="byline text-muted-foreground/70">
                  {t("Summit elevation", "標高")}
                </p>
                <p className="display-number text-3xl text-blue-900 tnum mt-0.5">
                  {m.elevationM.toLocaleString()}
                  <span className="text-base text-muted-foreground/70 font-normal ml-1">m</span>
                </p>
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {t("View live", "ライブ表示")}
              </span>
            </div>
          </>
        )}

        {m.websiteUrl && (
          <span
            role="link"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              window.open(m.websiteUrl, "_blank", "noopener,noreferrer");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                e.preventDefault();
                window.open(m.websiteUrl, "_blank", "noopener,noreferrer");
              }
            }}
            className="relative mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            {t("Official site", "公式サイト")}
            <span className="text-muted-foreground/50">
              {new URL(m.websiteUrl).hostname.replace(/^www\./, "")}
            </span>
          </span>
        )}
      </Link>
    </motion.div>
  );
}
