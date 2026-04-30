// Sentry instrumentation is loaded via tsx `--import ./src/instrument.ts`
// in the dev script (see package.json). This is required by @sentry/node v8+
// because OpenTelemetry can only patch modules that have not yet been imported.
// Plain `import "./instrument"` here is too late — express has already loaded.
import app from "./app";

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
});
