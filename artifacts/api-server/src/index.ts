// Sentry instrumentation is loaded via tsx `--import ./src/instrument.ts`
// in the dev script (see package.json). This is required by @sentry/node v8+
// because OpenTelemetry can only patch modules that have not yet been imported.
// Plain `import "./instrument"` here is too late - express has already loaded.
import app from "./app";
import { validateLocationContracts } from "./lib/validate-locations.js";

// Fail fast if any served location id violates the OpenAPI path schemas
// (regex `^[a-z0-9-]+$`). Cheap O(n) on boot, prevents the kind of drift
// that previously hid VHC mountain ids from the generated client types.
validateLocationContracts();

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  // Start the powder-alert cron evaluator (every 3h). Disabled by setting
  // ALERT_CRON_DISABLED=1 - useful when running multiple workers in
  // production where you want only one to own the schedule.
  import("./jobs/alertEvaluator.js")
    .then((m) => m.startAlertCron())
    .catch((err) => console.error("[boot] failed to start alert cron:", err));

  // Resort-announcements feed. Run ingestion once at boot so the feed has
  // its seeded opening-weekend content immediately (idempotent), then start
  // the periodic refresh cron (gated by RUN_ANNOUNCE_CRON, off by default).
  import("./jobs/announcementsIngest.js")
    .then(async (m) => {
      await m.runAnnouncementsIngest().catch((err) =>
        console.error("[boot] announcements ingest failed:", err),
      );
      m.startAnnouncementsCron();
    })
    .catch((err) => console.error("[boot] failed to start announcements ingest:", err));
});
