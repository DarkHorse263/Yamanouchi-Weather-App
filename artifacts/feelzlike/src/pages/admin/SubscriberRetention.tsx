import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "./useAdminFetch";

export function SubscriberRetention() {
  const cache = useQueryClient();
  const [email, setEmail] = useState("");
  const [scope, setScope] = useState("alerts");
  const [confirmed, setConfirmed] = useState(false);
  const preview = useQuery({
    queryKey: ["admin", "retention-preview"],
    queryFn: () => adminFetch<{ counts: Record<string, number> }>("/retention/preview"),
    staleTime: 0, refetchInterval: 60_000, retry: false,
  });
  const clear = useMutation({
    mutationFn: (input: { email: string; scope: string }) =>
      adminFetch<{ cleared: number }>("/retention/suppression/clear", {
        method: "POST", body: JSON.stringify({ ...input, confirm: true }),
      }),
    onSuccess: () => {
      setEmail(""); setConfirmed(false);
      void cache.invalidateQueries({ queryKey: ["admin", "retention-preview"] });
    },
  });
  return (
    <section className="rounded-xl border border-border p-4 space-y-3" data-testid="section-subscriber-retention">
      <h2 className="font-semibold">Subscriber retention & email blocks</h2>
      <p className="text-sm text-muted-foreground">
        Daily retention runs by default in production and can be paused by an operator.
        These counts are a read-only preview; this panel never starts a purge.
      </p>
      {preview.isLoading && <p role="status">Loading retention preview…</p>}
      {preview.isError && <p role="alert">Retention preview unavailable. Check the deployed schema and retention configuration.</p>}
      {preview.data && <dl className="grid grid-cols-2 gap-2 text-sm">
        {Object.entries(preview.data.counts).map(([name, count]) => (
          <div key={name}><dt className="text-muted-foreground">{{
            pending: "Expired pending signups", unsubscribed: "Expired unsubscribed profiles",
            dispatch: "Expired dispatch logs", incidents: "Expired delivery incidents", consent: "Expired consent evidence",
          }[name] ?? name}</dt><dd>{count}</dd></div>
        ))}
      </dl>}
      <h3 className="font-medium">Clear a retained email block</h3>
      <p className="text-sm text-muted-foreground">
        Only clear a block after verifying the recipient’s request. This does not subscribe them.
        If delivery incident details still exist, use the incident resolution controls instead.
      </p>
      <form className="space-y-3" onSubmit={(event) => {
        event.preventDefault();
        if (confirmed && !clear.isPending) clear.mutate({ email: email.trim(), scope });
      }}>
        <label className="block text-sm">Recipient email
          <input type="email" required value={email} disabled={clear.isPending} autoComplete="off"
            className="mt-1 block w-full rounded-md border border-border bg-background p-2"
            onChange={(event) => { setEmail(event.target.value); setConfirmed(false); clear.reset(); }} />
        </label>
        <label className="block text-sm">Block type
          <select value={scope} disabled={clear.isPending}
            className="mt-1 block w-full rounded-md border border-border bg-background p-2"
            onChange={(event) => { setScope(event.target.value); setConfirmed(false); clear.reset(); }}>
            <option value="alerts">Alert unsubscribe / account deletion</option>
            <option value="delivery">Expired bounce / complaint incident</option>
          </select>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={confirmed} disabled={clear.isPending} required
            onChange={(event) => setConfirmed(event.target.checked)} />
          I verified this recipient’s request and authorize removing this block, including any complaint block selected.
        </label>
        <button type="submit" disabled={!confirmed || !email || clear.isPending}
          className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50">
          {clear.isPending ? "Clearing…" : "Clear retained block"}
        </button>
      </form>
      {clear.isError && <p role="alert">Block not cleared. Existing delivery incidents must be resolved in the incident controls; otherwise check your admin access and try again.</p>}
      {clear.isSuccess && <p role="status">{clear.data.cleared ? "Retained block cleared. No subscription was created." : "No retained block matched. No subscription was changed."}</p>}
    </section>
  );
}