export const ENGAGEMENT_BOT_USER_AGENT =
  /bot|crawl|spider|slurp|headless|lighthouse|pingdom|monitor|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python-requests|axios|node-fetch/i;

export function isHumanEngagementRequest(userAgent: unknown): boolean {
  return (
    typeof userAgent === "string" &&
    userAgent.length > 0 &&
    !ENGAGEMENT_BOT_USER_AGENT.test(userAgent)
  );
}

export function engagementNeedsVisitorHash(kind: string): boolean {
  return kind === "view";
}