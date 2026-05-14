import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout, AdminForbidden } from "./AdminLayout";
import { adminFetch, useAdminQuery, AdminApiError } from "./useAdminFetch";

interface Campaign {
  id: string;
  subject: string;
  bodyMd: string;
  regionFilter: string | null;
  status: "draft" | "sending" | "sent" | "failed";
  recipientCount: number | null;
  deliveredCount: number | null;
  failedCount: number | null;
  sentAt: string | null;
  createdAt: string;
}
interface CampaignsPayload {
  campaigns: Campaign[];
}

interface StatsPayload {
  newsletter: { verified: number; pending: number; total: number };
}

const REGION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "all regions" },
  { value: "snowy-mountains", label: "snowy mountains" },
  { value: "victorias-high-country", label: "victoria's high country" },
  { value: "yamanouchi", label: "yamanouchi" },
];

export default function AdminNewsletter() {
  const qc = useQueryClient();
  const stats = useAdminQuery<StatsPayload>("stats", "/stats");
  const campaigns = useAdminQuery<CampaignsPayload>("campaigns", "/newsletter/campaigns");

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState<"draft" | "preview" | "test" | "send" | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const isForbidden = stats.error?.status === 403 || campaigns.error?.status === 403;

  async function createDraft(): Promise<Campaign | null> {
    if (!subject.trim() || body.trim().length < 10) {
      setStatusMsg({ kind: "err", text: "subject + at least 10 chars of body required" });
      return null;
    }
    setBusy("draft");
    setStatusMsg(null);
    try {
      const r = await adminFetch<{ campaign: Campaign }>("/newsletter/campaigns", {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(),
          bodyMd: body,
          regionFilter: regionFilter || null,
        }),
      });
      qc.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      return r.campaign;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "failed to save draft";
      setStatusMsg({ kind: "err", text: msg });
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function handlePreview() {
    const draft = await createDraft();
    if (!draft) return;
    setBusy("preview");
    try {
      const r = await adminFetch<{ html: string }>(
        `/newsletter/campaigns/${draft.id}/preview`,
        { method: "POST" },
      );
      setPreviewHtml(r.html);
      setStatusMsg({ kind: "ok", text: `draft saved · previewing ${draft.id.slice(0, 8)}…` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "preview failed";
      setStatusMsg({ kind: "err", text: msg });
    } finally {
      setBusy(null);
    }
  }

  async function handleTestSend() {
    if (!testEmail.includes("@")) {
      setStatusMsg({ kind: "err", text: "enter a valid test email first" });
      return;
    }
    const draft = await createDraft();
    if (!draft) return;
    setBusy("test");
    try {
      await adminFetch(`/newsletter/campaigns/${draft.id}/send`, {
        method: "POST",
        body: JSON.stringify({ testEmail }),
      });
      setStatusMsg({ kind: "ok", text: `test sent to ${testEmail}` });
    } catch (err) {
      const e = err as AdminApiError;
      setStatusMsg({
        kind: "err",
        text:
          e.status === 412
            ? "RESEND_API_KEY missing · add it to project secrets to send email."
            : e.message ?? "test send failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleBroadcast() {
    if (
      !window.confirm(
        `send to ALL verified newsletter subscribers${
          regionFilter ? ` in ${regionFilter}` : ""
        }? this can't be undone.`,
      )
    ) {
      return;
    }
    const draft = await createDraft();
    if (!draft) return;
    setBusy("send");
    try {
      const r = await adminFetch<{ recipientCount: number; delivered: number; failed: number }>(
        `/newsletter/campaigns/${draft.id}/send`,
        { method: "POST", body: JSON.stringify({}) },
      );
      qc.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      setStatusMsg({
        kind: "ok",
        text: `broadcast complete · ${r.delivered}/${r.recipientCount} delivered, ${r.failed} failed`,
      });
      setSubject("");
      setBody("");
      setPreviewHtml(null);
    } catch (err) {
      const e = err as AdminApiError;
      setStatusMsg({
        kind: "err",
        text:
          e.status === 412
            ? "RESEND_API_KEY missing · add it to project secrets to send email."
            : e.message ?? "broadcast failed",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminLayout active="newsletter">
      {isForbidden ? (
        <AdminForbidden />
      ) : (
        <div className="grid lg:grid-cols-[1fr_minmax(0,520px)] gap-6">
          <div className="space-y-5">
            <div className="rounded-lg border bg-white p-5">
              <h2 className="text-sm font-semibold mb-3 lowercase">audience</h2>
              {stats.isLoading ? (
                <div className="text-xs text-muted-foreground">loading…</div>
              ) : stats.data ? (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">verified</div>
                    <div className="text-xl font-semibold tabular-nums text-emerald-700">{stats.data.newsletter.verified}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">pending</div>
                    <div className="text-xl font-semibold tabular-nums text-amber-700">{stats.data.newsletter.pending}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">total ever</div>
                    <div className="text-xl font-semibold tabular-nums">{stats.data.newsletter.total}</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border bg-white p-5 space-y-3">
              <h2 className="text-sm font-semibold lowercase">compose</h2>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">subject</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="weekend snow outlook · august 23"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">region filter</span>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white"
                >
                  {REGION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground">
                  matches subscribers who picked this region. blank = send to everyone.
                </span>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">body · markdown</span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={14}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono"
                  placeholder={`# title\n\nopening line.\n\n- bullet one\n- bullet two\n\n[read more](https://feelzlike.com/...)`}
                />
              </label>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handlePreview}
                  disabled={!!busy}
                  className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  {busy === "preview" ? "rendering…" : "preview"}
                </button>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="rounded-md border px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleTestSend}
                    disabled={!!busy}
                    className="px-3 py-2 text-sm rounded-md bg-slate-200 hover:bg-slate-300 disabled:opacity-50"
                  >
                    {busy === "test" ? "sending…" : "send test"}
                  </button>
                </div>
                <button
                  onClick={handleBroadcast}
                  disabled={!!busy}
                  className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50 ml-auto"
                >
                  {busy === "send" ? "broadcasting…" : "broadcast to verified"}
                </button>
              </div>

              {statusMsg ? (
                <div
                  className={`text-xs rounded-md px-3 py-2 ${
                    statusMsg.kind === "ok"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-rose-50 text-rose-800"
                  }`}
                >
                  {statusMsg.text}
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border bg-white p-5">
              <h2 className="text-sm font-semibold mb-3 lowercase">history</h2>
              {campaigns.isLoading ? (
                <div className="text-xs text-muted-foreground">loading…</div>
              ) : campaigns.data && campaigns.data.campaigns.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="py-2">subject</th>
                      <th>status</th>
                      <th>delivered</th>
                      <th>sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.data.campaigns.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="py-2 truncate max-w-[280px]">{c.subject}</td>
                        <td>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              c.status === "sent"
                                ? "bg-emerald-100 text-emerald-900"
                                : c.status === "draft"
                                ? "bg-slate-100 text-slate-900"
                                : c.status === "sending"
                                ? "bg-sky-100 text-sky-900"
                                : "bg-rose-100 text-rose-900"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="tabular-nums">
                          {c.deliveredCount ?? "—"}
                          {c.recipientCount != null ? ` / ${c.recipientCount}` : ""}
                        </td>
                        <td className="text-xs text-muted-foreground">
                          {c.sentAt ? new Date(c.sentAt).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground">no campaigns yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5 lg:sticky lg:top-6 self-start">
            <h2 className="text-sm font-semibold mb-3 lowercase">preview</h2>
            {previewHtml ? (
              <iframe
                title="newsletter preview"
                srcDoc={previewHtml}
                className="w-full rounded border"
                style={{ height: "640px" }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                hit <em>preview</em> after writing the body to render the email here.
              </p>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
