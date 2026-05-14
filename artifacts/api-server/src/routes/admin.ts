import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { sql, and, eq, gte, desc, isNotNull, isNull, count } from "drizzle-orm";
import {
  db,
  newsletterSubscribersTable,
  alertSubscribersTable,
  newsClicksTable,
  newsletterCampaignsTable,
} from "@workspace/db";
import { requireAdminUser } from "../middlewares/requireAdminUser.js";
import { sendEmail } from "../lib/emailSender.js";

/**
 * Admin router · mounted at /api/admin/*. Every route here goes through
 * `requireAdminUser` which checks for both an authenticated session AND that
 * the user's email is on the `ADMIN_EMAILS` allowlist. Returns 401 (logged
 * out) vs 403 (logged in but not admin).
 */
const router: IRouter = Router();

router.use(requireAdminUser);

/**
 * Origin-pinning guard for the entire admin surface · protects BOTH:
 *   1. CSRF on cookie-authenticated mutations (POST/PUT/DELETE), and
 *   2. Confidentiality of read endpoints (GET /me, /stats, etc.) which
 *      would otherwise be readable cross-origin from any allowed Replit
 *      subdomain because credentialed CORS reflects those origins.
 *
 * We require Origin (or Referer for browsers that strip Origin on GET) to
 * match the request host. Same-origin fetches always satisfy this; any
 * cross-origin browser fetch with credentials is rejected. Server-to-server
 * traffic (no Origin/Referer) is also rejected · admin endpoints have no
 * legitimate non-browser caller.
 *
 * OPTIONS preflights are exempt so CORS negotiation can complete; the actual
 * follow-up request still has to pass this guard.
 */
router.use((req: Request, res: Response, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) {
    res.status(403).json({ error: "ORIGIN_REQUIRED" });
    return;
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    res.status(403).json({ error: "INVALID_ORIGIN" });
    return;
  }
  const reqHost = req.get("host") ?? "";
  if (originHost !== reqHost) {
    res.status(403).json({ error: "ORIGIN_MISMATCH" });
    return;
  }
  next();
});

// ── Identity probe ────────────────────────────────────────────────────────
// Cheap GET so the admin SPA can detect "is the current user actually on the
// allowlist?" without doing a full /stats fetch. Returns the same 401 / 403
// surface as every other admin route, so the frontend gate is uniform.
router.get("/me", (req: Request, res: Response) => {
  const user = req.user!; // requireAdminUser already vouched
  res.json({ user });
});

// ── Stats tab ─────────────────────────────────────────────────────────────

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Newsletter buckets
    const [nlTotalRow] = await db
      .select({ c: count() })
      .from(newsletterSubscribersTable);
    const [nlVerifiedRow] = await db
      .select({ c: count() })
      .from(newsletterSubscribersTable)
      .where(and(isNotNull(newsletterSubscribersTable.verifiedAt), isNull(newsletterSubscribersTable.unsubscribedAt)));
    const [nlPendingRow] = await db
      .select({ c: count() })
      .from(newsletterSubscribersTable)
      .where(and(isNull(newsletterSubscribersTable.verifiedAt), isNull(newsletterSubscribersTable.unsubscribedAt)));
    const [nlUnsubRow] = await db
      .select({ c: count() })
      .from(newsletterSubscribersTable)
      .where(isNotNull(newsletterSubscribersTable.unsubscribedAt));
    const [nlNew7dRow] = await db
      .select({ c: count() })
      .from(newsletterSubscribersTable)
      .where(gte(newsletterSubscribersTable.createdAt, since7d));

    // Alert buckets (same pattern)
    const [alTotalRow] = await db
      .select({ c: count() })
      .from(alertSubscribersTable);
    const [alVerifiedRow] = await db
      .select({ c: count() })
      .from(alertSubscribersTable)
      .where(and(isNotNull(alertSubscribersTable.verifiedAt), isNull(alertSubscribersTable.unsubscribedAt)));
    const [alPendingRow] = await db
      .select({ c: count() })
      .from(alertSubscribersTable)
      .where(and(isNull(alertSubscribersTable.verifiedAt), isNull(alertSubscribersTable.unsubscribedAt)));
    const [alUnsubRow] = await db
      .select({ c: count() })
      .from(alertSubscribersTable)
      .where(isNotNull(alertSubscribersTable.unsubscribedAt));
    const [alNew7dRow] = await db
      .select({ c: count() })
      .from(alertSubscribersTable)
      .where(gte(alertSubscribersTable.createdAt, since7d));

    // News clicks · top 10 by id over the last 30 days, with sponsored flag
    const topClicks = await db
      .select({
        newsId: newsClicksTable.newsId,
        source: newsClicksTable.source,
        category: newsClicksTable.category,
        sponsored: newsClicksTable.sponsored,
        clicks: count(),
      })
      .from(newsClicksTable)
      .where(gte(newsClicksTable.createdAt, since30d))
      .groupBy(
        newsClicksTable.newsId,
        newsClicksTable.source,
        newsClicksTable.category,
        newsClicksTable.sponsored,
      )
      .orderBy(desc(count()))
      .limit(10);

    // Click totals last 30d, split by sponsored vs editorial
    const [clickTotalsRow] = await db
      .select({
        total: count(),
        sponsoredTotal: sql<number>`count(*) filter (where ${newsClicksTable.sponsored} = true)`.mapWith(Number),
      })
      .from(newsClicksTable)
      .where(gte(newsClicksTable.createdAt, since30d));

    res.json({
      newsletter: {
        total: nlTotalRow?.c ?? 0,
        verified: nlVerifiedRow?.c ?? 0,
        pending: nlPendingRow?.c ?? 0,
        unsubscribed: nlUnsubRow?.c ?? 0,
        new7d: nlNew7dRow?.c ?? 0,
      },
      alerts: {
        total: alTotalRow?.c ?? 0,
        verified: alVerifiedRow?.c ?? 0,
        pending: alPendingRow?.c ?? 0,
        unsubscribed: alUnsubRow?.c ?? 0,
        new7d: alNew7dRow?.c ?? 0,
      },
      news: {
        windowDays: 30,
        totalClicks: clickTotalsRow?.total ?? 0,
        sponsoredClicks: clickTotalsRow?.sponsoredTotal ?? 0,
        editorialClicks: (clickTotalsRow?.total ?? 0) - (clickTotalsRow?.sponsoredTotal ?? 0),
        top: topClicks,
      },
    });
  } catch (err) {
    console.error("[admin/stats] failed", err);
    res.status(500).json({ error: "STATS_FAILED" });
  }
});

router.get("/recent-signups", async (_req: Request, res: Response) => {
  try {
    const newsletter = await db
      .select({
        id: newsletterSubscribersTable.id,
        email: newsletterSubscribersTable.email,
        regions: newsletterSubscribersTable.regions,
        verifiedAt: newsletterSubscribersTable.verifiedAt,
        createdAt: newsletterSubscribersTable.createdAt,
      })
      .from(newsletterSubscribersTable)
      .orderBy(desc(newsletterSubscribersTable.createdAt))
      .limit(20);

    const alerts = await db
      .select({
        id: alertSubscribersTable.id,
        email: alertSubscribersTable.email,
        regions: alertSubscribersTable.regions,
        verifiedAt: alertSubscribersTable.verifiedAt,
        createdAt: alertSubscribersTable.createdAt,
      })
      .from(alertSubscribersTable)
      .orderBy(desc(alertSubscribersTable.createdAt))
      .limit(20);

    res.json({ newsletter, alerts });
  } catch (err) {
    console.error("[admin/recent-signups] failed", err);
    res.status(500).json({ error: "RECENT_SIGNUPS_FAILED" });
  }
});

// ── Newsletter tab ────────────────────────────────────────────────────────

router.get("/newsletter/campaigns", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(newsletterCampaignsTable)
      .orderBy(desc(newsletterCampaignsTable.createdAt))
      .limit(50);
    res.json({ campaigns: rows });
  } catch (err) {
    console.error("[admin/campaigns] list failed", err);
    res.status(500).json({ error: "LIST_FAILED" });
  }
});

const CreateCampaignBody = z.object({
  subject: z.string().min(2).max(200),
  bodyMd: z.string().min(10).max(50_000),
  regionFilter: z.string().min(1).max(80).optional().nullable(),
});

router.post("/newsletter/campaigns", async (req: Request, res: Response) => {
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_INPUT", details: parsed.error.issues });
    return;
  }
  try {
    const senderUserId = req.isAuthenticated() ? req.user.id : null;
    const [row] = await db
      .insert(newsletterCampaignsTable)
      .values({
        subject: parsed.data.subject,
        bodyMd: parsed.data.bodyMd,
        regionFilter: parsed.data.regionFilter ?? null,
        senderUserId,
        status: "draft",
      })
      .returning();
    res.status(201).json({ campaign: row });
  } catch (err) {
    console.error("[admin/campaigns] create failed", err);
    res.status(500).json({ error: "CREATE_FAILED" });
  }
});

/**
 * Lightweight markdown → HTML converter. Deliberately tiny · only the
 * subset we want in newsletters: paragraphs, **bold**, *italic*, [text](url),
 * # / ## / ### headings, and bullet/numbered lists. No tables, no images,
 * no inline HTML. Anything we don't recognise is rendered as a plain
 * paragraph (escaped).
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(s: string): string {
  let out = escapeHtml(s);
  // links [text](https://...)
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_m, text, url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`,
  );
  // bold **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic *text* (after bold)
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      const level = m[1].length;
      out.push(`<h${level}>${renderInline(m[2])}</h${level}>`);
      i++;
      continue;
    }
    if (line.match(/^[-*]\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(`<li>${renderInline(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push(`<li>${renderInline(lines[i].replace(/^\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }
    // paragraph (collect consecutive non-blank lines)
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].match(/^(#|[-*]\s|\d+\.\s)/)) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${renderInline(para.join(" "))}</p>`);
  }
  return out.join("\n");
}

function renderEmailHtml(subject: string, bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;background:#f8fafc;margin:0;padding:24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    <tr><td>
      <p style="margin:0 0 16px 0;font-size:12px;color:#64748b;letter-spacing:0.12em;text-transform:uppercase;">feelzlike</p>
      <h1 style="margin:0 0 24px 0;font-size:22px;line-height:1.2;color:#0f172a;">${escapeHtml(subject)}</h1>
      <div style="font-size:15px;line-height:1.55;color:#0f172a;">${bodyHtml}</div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;" />
      <p style="margin:0;font-size:12px;color:#64748b;">
        You're receiving this because you subscribed to feelzlike updates.
        <a href="{{UNSUBSCRIBE_URL}}" style="color:#0284c7;">Unsubscribe</a>.
      </p>
    </td></tr>
  </table>
</body></html>`;
}

router.post("/newsletter/campaigns/:id/preview", async (req: Request, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(newsletterCampaignsTable)
      .where(eq(newsletterCampaignsTable.id, String(req.params.id)))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    const html = renderEmailHtml(row.subject, renderMarkdown(row.bodyMd));
    res.json({ subject: row.subject, html });
  } catch (err) {
    console.error("[admin/campaigns] preview failed", err);
    res.status(500).json({ error: "PREVIEW_FAILED" });
  }
});

const SendBody = z.object({
  testEmail: z.string().email().optional().nullable(),
});

router.post("/newsletter/campaigns/:id/send", async (req: Request, res: Response) => {
  const parsed = SendBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_INPUT" });
    return;
  }
  const testEmail = parsed.data.testEmail ?? null;

  if (!process.env.RESEND_API_KEY) {
    res.status(412).json({ error: "RESEND_API_KEY_MISSING", message: "Add RESEND_API_KEY to deliver emails." });
    return;
  }

  try {
    const [campaign] = await db
      .select()
      .from(newsletterCampaignsTable)
      .where(eq(newsletterCampaignsTable.id, String(req.params.id)))
      .limit(1);
    if (!campaign) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    if (campaign.status === "sent" && !testEmail) {
      res.status(409).json({ error: "ALREADY_SENT" });
      return;
    }

    const html = renderEmailHtml(campaign.subject, renderMarkdown(campaign.bodyMd));

    // Strip basic markdown for the plain-text fallback
    const plain = campaign.bodyMd
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
      .replace(/[*_`#>]/g, "")
      .trim();

    // Test send · single recipient, no DB status change beyond marking last preview
    if (testEmail) {
      await sendEmail({
        to: testEmail,
        subject: `[TEST] ${campaign.subject}`,
        html: html.replace("{{UNSUBSCRIBE_URL}}", "https://feelzlike.com/"),
        text: plain,
        tag: "newsletter-test",
      });
      res.json({ ok: true, mode: "test", sentTo: testEmail });
      return;
    }

    // Real send · gather verified, non-unsub'd subscribers
    let recipients = await db
      .select({
        id: newsletterSubscribersTable.id,
        email: newsletterSubscribersTable.email,
        regions: newsletterSubscribersTable.regions,
      })
      .from(newsletterSubscribersTable)
      .where(
        and(
          isNotNull(newsletterSubscribersTable.verifiedAt),
          isNull(newsletterSubscribersTable.unsubscribedAt),
        ),
      );

    if (campaign.regionFilter) {
      const target = campaign.regionFilter;
      recipients = recipients.filter((r) =>
        Array.isArray(r.regions) && r.regions.includes(target),
      );
    }

    await db
      .update(newsletterCampaignsTable)
      .set({ status: "sending", recipientCount: recipients.length })
      .where(eq(newsletterCampaignsTable.id, campaign.id));

    let delivered = 0;
    let failed = 0;
    for (const r of recipients) {
      try {
        await sendEmail({
          to: r.email,
          subject: campaign.subject,
          html: html.replace(
            "{{UNSUBSCRIBE_URL}}",
            `https://feelzlike.com/newsletter/unsubscribed`,
          ),
          text: plain,
          tag: "newsletter-broadcast",
        });
        delivered++;
      } catch (err) {
        console.error("[admin/campaigns] send failed for", r.email, err);
        failed++;
      }
    }

    await db
      .update(newsletterCampaignsTable)
      .set({
        status: failed === recipients.length ? "failed" : "sent",
        deliveredCount: delivered,
        failedCount: failed,
        sentAt: new Date(),
      })
      .where(eq(newsletterCampaignsTable.id, campaign.id));

    res.json({ ok: true, mode: "broadcast", recipientCount: recipients.length, delivered, failed });
  } catch (err) {
    console.error("[admin/campaigns] send pipeline failed", err);
    res.status(500).json({ error: "SEND_FAILED" });
  }
});

export default router;
