import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "./useAdminFetch";

interface RecoveryRecord {
  id: number;
  phase: string;
  attempts: number;
  lastError: string | null;
  requestedAt: string;
  nextAttemptAt: string;
}

export function AccountDeletionRecovery() {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "account-deletions"],
    queryFn: () => adminFetch<{ records: RecoveryRecord[]; limit: number }>("/account-deletions"),
    refetchInterval: 30_000,
    staleTime: 0,
    retry: false,
  });
  const retry = useMutation({
    mutationFn: (id: number) => adminFetch(`/account-deletions/${id}/retry`, { method: "POST" }),
    onSettled: () => cache.invalidateQueries({ queryKey: ["admin", "account-deletions"] }),
  });
  return (
    <section className="rounded-xl border border-border p-4 space-y-3" data-testid="section-account-deletion-recovery">
      <h2 className="font-semibold">Account deletion recovery</h2>
      <p className="text-sm text-muted-foreground">
        Saved requests survive sign-out and server restarts. Retries finish billing cancellation and identity deletion before local cleanup.
        Unresolved requests stay here until completed; identifying details are removed 30 days after completion.
      </p>
      {query.isLoading && <p role="status">Loading deletion requests…</p>}
      {query.isError && <p role="alert">Cannot load recovery requests. Refresh to try again.</p>}
      {retry.isError && <p role="alert">Retry did not complete. The request remains saved; review its status below.</p>}
      {retry.isSuccess && <p role="status">Deletion completed.</p>}
      {query.data?.records.length === 0 && <p className="text-sm">No incomplete deletion requests.</p>}
      {query.data && query.data.records.length >= query.data.limit &&
        <p className="text-sm">Showing the newest {query.data.limit} requests. Automatic recovery processes oldest first.</p>}
      <ul className="space-y-3">
        {query.data?.records.map((record) => (
          <li key={record.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="text-sm">
              <p>Request #{record.id} · {record.phase === "pending_clerk" ? "Identity deletion pending" : "Local cleanup pending"}</p>
              <p className="text-muted-foreground">
                {new Date(record.requestedAt).toLocaleString()} · {record.attempts} attempts
                {record.lastError ? ` · ${record.lastError}` : ""}
                {` · next eligible retry ${new Date(record.nextAttemptAt).toLocaleString()}`}
              </p>
            </div>
            <button type="button" disabled={retry.isPending}
              className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
              data-testid={`button-retry-deletion-${record.id}`}
              onClick={() => retry.mutate(record.id)}>
              {retry.isPending && retry.variables === record.id ? "Retrying…" : "Retry deletion"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}