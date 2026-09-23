export const ALERT_SCHEDULER_JOB_NAME = "powder-alert-evaluator";
export const ALERT_SCHEDULER_BUCKET_HOURS = 3;

export interface AlertDeliveryReadiness {
  ready: boolean;
  schedulerConfigured: boolean;
  schedulerStarted: boolean;
  emailConnectionConfigured: boolean;
  senderIdentityConfigured: boolean;
  senderConfigured: boolean;
  tokenConfigured: boolean;
  liveInboxVerification: "not_checked";
  issues: string[];
}

let schedulerStarted = false;

export function markAlertSchedulerStarted(): void {
  schedulerStarted = true;
}

export function alertRunKey(now: Date = new Date()): string {
  const bucketHour =
    Math.floor(now.getUTCHours() / ALERT_SCHEDULER_BUCKET_HOURS) *
    ALERT_SCHEDULER_BUCKET_HOURS;
  const bucket = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      bucketHour,
    ),
  );
  return bucket.toISOString().replace(".000Z", "Z");
}

export function getAlertDeliveryReadiness(
  env: NodeJS.ProcessEnv = process.env,
  runtimeStarted: boolean = schedulerStarted,
): AlertDeliveryReadiness {
  const apiKey = env.RESEND_API_KEY?.trim() ?? "";
  const from = env.ALERT_FROM_EMAIL?.trim() ?? "";
  const token = env.ALERT_TOKEN_SECRET?.trim() ?? "";
  const schedulerConfigured =
    env.RUN_ALERT_CRON === "1" && env.ALERT_CRON_DISABLED !== "1";
  const emailConnectionConfigured =
    apiKey.length >= 10 && apiKey !== "placeholder";
  const senderIdentityConfigured =
    from.length > 0 && !from.includes("onboarding@resend.dev");
  const senderConfigured =
    emailConnectionConfigured && senderIdentityConfigured;
  const tokenConfigured = token.length >= 16;
  const issues: string[] = [];

  if (!senderConfigured) issues.push("alert_sender_not_configured");
  if (!tokenConfigured) issues.push("alert_token_secret_not_configured");
  if (!schedulerConfigured) issues.push("alert_scheduler_not_configured");
  if (schedulerConfigured && !runtimeStarted) {
    issues.push("alert_scheduler_not_started");
  }

  return {
    ready: issues.length === 0,
    schedulerConfigured,
    schedulerStarted: runtimeStarted,
    emailConnectionConfigured,
    senderIdentityConfigured,
    senderConfigured,
    tokenConfigured,
    // Configuration cannot prove that a monitored reply-to mailbox receives
    // mail, or that the provider accepts this sender. That requires a separate
    // human/provider verification; this readiness check never sends test mail.
    liveInboxVerification: "not_checked",
    issues,
  };
}

export function assertAlertDeliveryConfigured(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const readiness = getAlertDeliveryReadiness(env, true);
  const deliveryIssues = readiness.issues.filter(
    (issue) => !issue.startsWith("alert_scheduler_"),
  );
  if (deliveryIssues.length > 0) {
    throw new Error(
      `Powder alert delivery is not configured: ${deliveryIssues.join(", ")}`,
    );
  }
}