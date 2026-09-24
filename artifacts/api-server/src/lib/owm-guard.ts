/**
 * All OWM traffic shares one durable rolling-minute ledger in job_runs.
 * This reserved non-scheduled row contains timestamps only, never URLs or keys.
 * Row locking + database time makes admissions safe across autoscale replicas.
 * No DDL is needed; missing/unavailable storage fails closed.
 */
export const OWM_BUDGET = 40;
export const OWM_WINDOW_MS = 60_000;
export const OWM_STATE_JOB = "openweather-quota-v1";
const OWM_LAYERS = ["precipitation_new", "clouds_new", "temp_new", "wind_new", "snow"];
export function validOwmTile(layer: string, z: string, x: string, y: string): boolean {
  if (!OWM_LAYERS.includes(layer) || ![z, x, y].every(v => /^(0|[1-9]\d{0,5})$/.test(v))) return false;
  const zoom = Number(z);
  return zoom <= 12 && Number(x) < 2 ** zoom && Number(y) < 2 ** zoom;
}
export interface QuotaStore {
  admit(): Promise<boolean>;
  cooldown(ms: number): Promise<void>;
}
interface Client {
  query(sql: string, params?: unknown[]): Promise<{ rows: any[] }>;
  release(error?: boolean): void;
}
interface State { admissions: number[]; blockedUntil: number }

export function postgresQuotaStore(connect: () => Promise<Client>): QuotaStore {
  async function update(cooldown?: number): Promise<boolean> {
    // Bound pool acquisition too; release a connection arriving after timeout.
    let expired = false;
    let timer: ReturnType<typeof setTimeout>;
    const pending = connect().then(client => {
      if (expired) { client.release(); throw new Error("Quota connection timeout"); }
      return client;
    });
    const client = await Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => { expired = true; reject(new Error("Quota connection timeout")); }, 2000);
      }),
    ]).finally(() => clearTimeout(timer!));
    let broken = false;
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL statement_timeout = '2000ms'");
      await client.query("SET LOCAL lock_timeout = '1500ms'");
      await client.query(`INSERT INTO job_runs (job_name, run_key, summary, ok)
        VALUES ($1, 'global', '{"admissions":[],"blockedUntil":0}', true)
        ON CONFLICT (job_name, run_key) DO NOTHING`, [OWM_STATE_JOB]);
      const result = await client.query(
        "SELECT summary FROM job_runs WHERE job_name=$1 AND run_key='global' FOR UPDATE", [OWM_STATE_JOB]);
      // Read time AFTER acquiring the lock, not at transaction start.
      const clock = await client.query("SELECT extract(epoch FROM clock_timestamp()) * 1000 AS now");
      const now = Number(clock.rows[0].now);
      const state: State = JSON.parse(result.rows[0].summary);
      if (!Number.isFinite(now) || !Array.isArray(state.admissions) ||
          !state.admissions.every(Number.isFinite) || !Number.isFinite(state.blockedUntil)) {
        throw new Error("Invalid quota state");
      }
      state.admissions = state.admissions.filter(t => t > now - OWM_WINDOW_MS);
      const allowed = cooldown === undefined && state.blockedUntil <= now && state.admissions.length < OWM_BUDGET;
      if (allowed) state.admissions.push(now);
      if (cooldown !== undefined) state.blockedUntil = Math.max(state.blockedUntil, now + cooldown);
      await client.query(`UPDATE job_runs SET summary=$2, started_at=clock_timestamp(),
        finished_at=clock_timestamp(), ok=true WHERE job_name=$1 AND run_key='global'`,
      [OWM_STATE_JOB, JSON.stringify(state)]);
      await client.query("COMMIT");
      return allowed;
    } catch {
      broken = true;
      try { await client.query("ROLLBACK"); } catch { broken = true; }
      throw new Error("OpenWeather coordination unavailable");
    } finally { client.release(broken); }
  }
  return { admit: () => update(), cooldown: async ms => { await update(ms); } };
}

export function cooldownMs(status: number, retryAfter: string | null, now: number): number {
  const seconds = retryAfter === null ? NaN : Number(retryAfter);
  const requested = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter ?? "") - now;
  // Bad credentials should not be retried constantly; all cooldowns recover.
  const baseline = status === 401 ? 15 * 60_000 : 60_000;
  return Math.min(24 * 60 * 60_000, Math.max(baseline, Number.isFinite(requested) ? requested : 0));
}

type Cached = { body: Buffer | null; until: number };
export class OpenWeatherGuard {
  private cache = new Map<string, Cached>();
  private inflight = new Map<string, Promise<Buffer>>();
  private localBlockedUntil = 0;
  constructor(
    private store: QuotaStore,
    private fetcher: typeof fetch = fetch,
    private now: () => number = Date.now,
  ) {}

  async request(url: URL, tile = false): Promise<Buffer> {
    // Never retain credentials in cache keys, errors, logs, or coordination state.
    const safe = new URL(url);
    safe.searchParams.delete("appid");
    const key = safe.toString();
    const hit = this.cache.get(key);
    if (hit && hit.until > this.now()) {
      if (!hit.body) throw new Error("OpenWeather temporarily unavailable");
      return hit.body;
    }
    const existing = this.inflight.get(key);
    if (existing) return existing;
    if (this.inflight.size >= 64) throw new Error("OpenWeather busy");
    const work = this.load(url, tile).then(body => {
      this.put(key, { body, until: this.now() + (tile ? 300_000 : 600_000) });
      return body;
    }).catch(() => {
      this.put(key, { body: null, until: this.now() + 5000 });
      throw new Error("OpenWeather temporarily unavailable");
    }).finally(() => this.inflight.delete(key));
    this.inflight.set(key, work);
    return work;
  }
  private put(key: string, value: Cached) {
    this.cache.delete(key);
    // Each body is capped at 512KiB; at most 256 entries (~128MiB).
    while (this.cache.size >= 256) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(key, value);
  }
  private async load(url: URL, tile: boolean): Promise<Buffer> {
    if (this.localBlockedUntil > this.now() || !await this.store.admit()) throw new Error("Quota unavailable");
    const response = await this.fetcher(url, { signal: AbortSignal.timeout(8000), redirect: "error" });
    if (response.status === 429 || response.status === 401) {
      const ms = cooldownMs(response.status, response.headers.get("retry-after"), this.now());
      this.localBlockedUntil = this.now() + ms;
      await response.body?.cancel();
      await this.store.cooldown(ms);
      throw new Error("OpenWeather circuit open");
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error("OpenWeather upstream error");
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Empty response");
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > 512 * 1024) throw new Error("Response too large");
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    const body = Buffer.concat(chunks);
    if (tile) {
      if (!body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error("Invalid tile");
    } else {
      const data = JSON.parse(body.toString("utf8"));
      if (!data || typeof data !== "object" || (data.cod && Number(data.cod) !== 200)) throw new Error("Invalid JSON response");
    }
    return body;
  }
}