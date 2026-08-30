import { asc } from "drizzle-orm";
import { db, thredboLiftTransitionsTable } from "@workspace/db";
import { analyzeThredboLiftWindHistory } from "../lib/thredboLiftWindAnalysis.js";
import { THREDBO_THRESHOLDS } from "../lib/thredboLiftThresholds.js";

function markdown(
  rows: ReturnType<typeof analyzeThredboLiftWindHistory>,
  generatedAt: Date,
): string {
  const lines = [
    "# Thredbo lift wind-hold evidence",
    "",
    `Generated: ${generatedAt.toISOString()}`,
    "",
    "Wind value = strongest concurrent top-station sustained/gust reading; village is used only when top is unavailable. Recommendations require at least 3 starts and 3 true reopen releases, non-conflicting distributions, and one consistent station.",
    "",
    "| Lift | Current | Starts | Releases | Flags | Recommendation | Verified |",
    "| --- | ---: | --- | --- | --- | --- | --- |",
  ];
  for (const row of rows) {
    const recommendation = row.recommendation
      ? `${row.recommendation.thresholdKmh} km/h (${row.recommendation.basis}; medians ${row.recommendation.releaseMedianKmh}/${row.recommendation.startMedianKmh})`
      : "keep current";
    lines.push(
      `| ${row.name} | ${row.currentThresholdKmh} km/h | ${row.windHoldStarts.join(", ") || "none"} | ${row.releases.join(", ") || "none"} | ${row.flags.join(", ") || "ready"} | ${recommendation} | ${row.verifiedAt} |`,
    );
  }
  return `${lines.join("\n")}\n`;
}

const transitions = await db
  .select()
  .from(thredboLiftTransitionsTable)
  .orderBy(asc(thredboLiftTransitionsTable.feedUpdatedAt));
const generatedAt = new Date();
const analysis = analyzeThredboLiftWindHistory(transitions, THREDBO_THRESHOLDS);
const format = process.argv.includes("--json") ? "json" : "markdown";
process.stdout.write(
  format === "json"
    ? `${JSON.stringify({ generatedAt: generatedAt.toISOString(), analysis }, null, 2)}\n`
    : markdown(analysis, generatedAt),
);
