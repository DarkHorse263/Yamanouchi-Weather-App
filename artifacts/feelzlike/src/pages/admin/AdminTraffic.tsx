import { AdminLayout } from "./AdminLayout";

/**
 * Plausible embed. Requires:
 *   - VITE_PLAUSIBLE_DOMAIN  · the domain you configured in plausible (eg. "feelzlike.com")
 *   - VITE_PLAUSIBLE_HOST    · plausible host (default "https://plausible.io")
 *   - the dashboard set to "public" in plausible site settings
 *
 * If the env isn't set we render a setup checklist so the page never blanks.
 */
export default function AdminTraffic() {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  const host = (import.meta.env.VITE_PLAUSIBLE_HOST as string | undefined) ?? "https://plausible.io";

  return (
    <AdminLayout active="traffic">
      {domain ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold lowercase">traffic · {domain}</h2>
            <a
              href={`${host}/${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-sky-700 hover:underline"
            >
              open in plausible ↗
            </a>
          </div>
          <iframe
            title="plausible analytics"
            src={`${host}/share/${encodeURIComponent(domain)}?auth=embed&embed=true&theme=light`}
            loading="lazy"
            className="w-full rounded-lg border bg-white"
            style={{ height: "1600px" }}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 space-y-3 text-amber-900">
          <h2 className="font-semibold">plausible isn't wired up yet</h2>
          <p className="text-sm">
            this tab embeds your plausible.io dashboard so traffic & conversions
            live next to subscriber numbers. once configured it'll auto-render here.
          </p>
          <ol className="text-sm list-decimal list-inside space-y-1">
            <li>add your site at <a className="underline" href="https://plausible.io/sites" target="_blank" rel="noopener noreferrer">plausible.io/sites</a></li>
            <li>in <em>site settings → visibility</em>, mark the dashboard public (and turn on "shared link · embeddable")</li>
            <li>set <code className="font-mono text-xs">VITE_PLAUSIBLE_DOMAIN</code> in your project secrets to the domain you registered (e.g. <code className="font-mono text-xs">feelzlike.com</code>)</li>
            <li>(optional) set <code className="font-mono text-xs">VITE_PLAUSIBLE_HOST</code> if you self-host plausible</li>
            <li>restart the web workflow</li>
          </ol>
        </div>
      )}
    </AdminLayout>
  );
}
