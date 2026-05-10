import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, accommodationTable, diningTable, attractionsTable } from "@workspace/db";
import { requireAdminToken } from "../middlewares/require-admin-token.js";
import {
  GetAccommodationResponse,
  GetDiningResponse,
  GetAttractionsResponse,
  CreateAccommodationBody,
  UpdateAccommodationBody,
  UpdateAccommodationParams,
  DeleteAccommodationParams,
  CreateDiningBody,
  UpdateDiningBody,
  UpdateDiningParams,
  DeleteDiningParams,
  CreateAttractionBody,
  UpdateAttractionBody,
  UpdateAttractionParams,
  DeleteAttractionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/accommodation", async (req, res): Promise<void> => {
  const { type, region } = req.query as { type?: string; region?: string };
  let query = db.select().from(accommodationTable).$dynamic();

  if (type && type !== "all") {
    query = query.where(eq(accommodationTable.type, type));
  }

  if (region) {
    query = query.where(eq(accommodationTable.region, region));
  }

  const rows = await query.orderBy(accommodationTable.featured, accommodationTable.name);
  res.json(GetAccommodationResponse.parse(rows));
});

router.post("/accommodation", requireAdminToken, async (req, res): Promise<void> => {
  const parsed = CreateAccommodationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(accommodationTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.patch("/accommodation/:id", requireAdminToken, async (req, res): Promise<void> => {
  const params = UpdateAccommodationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAccommodationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== null && v !== undefined) updateData[k] = v;
  }
  const [row] = await db.update(accommodationTable).set(updateData).where(eq(accommodationTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Accommodation not found" });
    return;
  }
  res.json(row);
});

router.delete("/accommodation/:id", requireAdminToken, async (req, res): Promise<void> => {
  const params = DeleteAccommodationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.delete(accommodationTable).where(eq(accommodationTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Accommodation not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/dining", async (req, res): Promise<void> => {
  const { type, region } = req.query as { type?: string; region?: string };
  let query = db.select().from(diningTable).$dynamic();

  if (type && type !== "all") {
    query = query.where(eq(diningTable.type, type));
  }

  if (region) {
    query = query.where(eq(diningTable.region, region));
  }

  const rows = await query.orderBy(diningTable.featured, diningTable.name);
  res.json(GetDiningResponse.parse(rows));
});

router.post("/dining", requireAdminToken, async (req, res): Promise<void> => {
  const parsed = CreateDiningBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(diningTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.patch("/dining/:id", requireAdminToken, async (req, res): Promise<void> => {
  const params = UpdateDiningParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDiningBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== null && v !== undefined) updateData[k] = v;
  }
  const [row] = await db.update(diningTable).set(updateData).where(eq(diningTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Dining venue not found" });
    return;
  }
  res.json(row);
});

router.delete("/dining/:id", requireAdminToken, async (req, res): Promise<void> => {
  const params = DeleteDiningParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.delete(diningTable).where(eq(diningTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Dining venue not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/attractions", async (req, res): Promise<void> => {
  const { category, region } = req.query as { category?: string; region?: string };
  let query = db.select().from(attractionsTable).$dynamic();

  if (category && category !== "all") {
    query = query.where(eq(attractionsTable.category, category));
  }

  if (region) {
    query = query.where(eq(attractionsTable.region, region));
  }

  const rows = await query.orderBy(attractionsTable.featured, attractionsTable.name);
  res.json(GetAttractionsResponse.parse(rows));
});

router.post("/attractions", requireAdminToken, async (req, res): Promise<void> => {
  const parsed = CreateAttractionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(attractionsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.patch("/attractions/:id", requireAdminToken, async (req, res): Promise<void> => {
  const params = UpdateAttractionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAttractionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== null && v !== undefined) updateData[k] = v;
  }
  const [row] = await db.update(attractionsTable).set(updateData).where(eq(attractionsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Attraction not found" });
    return;
  }
  res.json(row);
});

router.delete("/attractions/:id", requireAdminToken, async (req, res): Promise<void> => {
  const params = DeleteAttractionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.delete(attractionsTable).where(eq(attractionsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Attraction not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
