import { pool } from "@workspace/db";
import { runSubscriberRetention } from "../lib/subscriberRetention.js";

// Intentionally dry-run only: cannot accidentally purge by mistyping a flag.
try {
  if (process.argv.length > 2) throw new Error("This command accepts no arguments and is dry-run only.");
  console.log(JSON.stringify(await runSubscriberRetention(true), null, 2));
} finally { await pool.end(); }