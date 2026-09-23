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

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  // Powder-alert scheduling is explicit opt-in (RUN_ALERT_CRON=1). Its
  // job_runs claim makes multiple autoscale replicas safe.
  import("./jobs/alertEvaluator.js")
    .then((m) => {
      m.startAlertCron();
      server.on("request", () => m.requestAlertSchedulerWake());
    })
    .catch((err) => console.error("[boot] failed to start alert cron:", err));
  // Daily production smoke test (site up, canonicals intact, dead outbound
  // links) - emails the owner on failure. RUN_SMOKE_CRON=1 enables the
  // autoscale-safe DB-claimed scheduler (see smokeTest.ts header).
  import("./jobs/smokeTest.js")
    .then((m) => m.startSmokeCron())
    .catch((err) => console.error("[boot] failed to start smoke cron:", err));
  import("./jobs/thredboLiftHistory.js")
    .then((m) => m.startThredboLiftHistoryCron())
    .catch((err) => console.error("[boot] failed to start Thredbo lift history cron:", err));
});
