import { Router, type IRouter } from "express";
import { db, resortAnnouncementsTable } from "@workspace/db";
import { and, eq, desc, or, isNull, gt } from "drizzle-orm";
import { parseRegionParam, RegionParamError } from "../lib/regions.js";

/**
 * Public read endpoint for the resort-announcements feed. Always reads from
 * Postgres (the write-authority store) so it never depends on a live scrape
 * succeeding · the ingestion job keeps the table fresh in the background.
 *
 * Pinned items (curated opening-weekend announcements) sort to the top, then
 * newest first. Regions with no rows return an empty list, not an error.
 */
const router: IRouter = Router();

router.get("/announcements", async (req, res): Promise<void> => {
  let region;
  try {
    region = parseRegionParam(req.query["region"]);
  } catch (err) {
    if (err instanceof RegionParamError) {
      res.status(400).json({ error: "INVALID_REGION", message: err.message });
      return;
    }
    throw err;
  }

  // Hide time-sensitive cards (e.g. opening-weekend seeds) once their
  // `expiresAt` has passed. Rows with no expiry never drop out.
  const notExpired = or(
    isNull(resortAnnouncementsTable.expiresAt),
    gt(resortAnnouncementsTable.expiresAt, new Date()),
  );
  const where = region
    ? and(
        eq(resortAnnouncementsTable.status, "published"),
        eq(resortAnnouncementsTable.region, region),
        notExpired,
      )
    : and(eq(resortAnnouncementsTable.status, "published"), notExpired);

  const rows = await db
    .select()
    .from(resortAnnouncementsTable)
    .where(where)
    .orderBy(desc(resortAnnouncementsTable.pinned), desc(resortAnnouncementsTable.publishedAt))
    .limit(100);

  if (rows.length === 0) res.setHeader("X-Empty-Reason", "no-announcements");

  res.json({
    announcements: rows.map((r) => ({
      id: r.id,
      region: r.region,
      resort: r.resort,
      category: r.category,
      title: r.title,
      body: r.body,
      sourceName: r.sourceName,
      sourceUrl: r.sourceUrl,
      pinned: r.pinned,
      publishedAt: r.publishedAt.toISOString(),
    })),
    updatedAt: new Date().toISOString(),
  });
});

export default router;
