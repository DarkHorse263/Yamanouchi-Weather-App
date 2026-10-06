/** Paid forecasts only. Never fall back to the non-commercial public service. */
export async function fetchOpenMeteo(input: string, init?: RequestInit): Promise<Response> {
  const key = process.env.OPEN_METEO_API_KEY;
  if (!key) throw new Error("Open-Meteo commercial service is not configured");
  const url = new URL(input);
  if (url.hostname !== "api.open-meteo.com" || url.pathname !== "/v1/forecast") {
    throw new Error("Unsupported Open-Meteo endpoint");
  }
  url.hostname = "customer-api.open-meteo.com";
  url.searchParams.set("apikey", key);
  try {
    const response = await fetch(url, { ...init, redirect: "error" });
    if (!response.ok) {
      // Preserve status-based retry/load-shedding without forwarding provider errors.
      const headers = new Headers();
      const retryAfter = response.headers?.get("retry-after");
      if (retryAfter) headers.set("retry-after", retryAfter);
      return Response.json({ error: true, reason: "Weather provider unavailable" }, { status: response.status, headers });
    }
    // Do not expose a Response.url containing the credential.
    return Response.json(await response.json());
  } catch {
    // Network errors may embed the credential-bearing URL or nested causes.
    throw new Error("Open-Meteo commercial forecast request failed");
  }
}
