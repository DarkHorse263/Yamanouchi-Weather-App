import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, restaurantsTable, menuItemsTable } from "@workspace/db";
import { requireOwner } from "./middleware";

const router: IRouter = Router();

router.get("/restaurants/:slug", async (req, res): Promise<void> => {
  const { slug } = req.params;
  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.slug, slug)).limit(1);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  res.json(restaurant);
});

router.post("/restaurants", requireOwner, async (req, res): Promise<void> => {
  const { slug, name, nameJa, address, imageUrl } = req.body;

  if (!slug || !name) {
    res.status(400).json({ error: "slug and name are required" });
    return;
  }

  const existing = await db.select().from(restaurantsTable).where(eq(restaurantsTable.slug, slug)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Slug already taken" });
    return;
  }

  const [restaurant] = await db.insert(restaurantsTable).values({
    ownerId: req.session.ownerId!,
    slug,
    name,
    nameJa: nameJa || null,
    address: address || null,
    imageUrl: imageUrl || null,
  }).returning();

  res.status(201).json(restaurant);
});

router.patch("/restaurants/:slug", requireOwner, async (req, res): Promise<void> => {
  const { slug } = req.params;
  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.slug, slug)).limit(1);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  if (restaurant.ownerId !== req.session.ownerId) {
    res.status(403).json({ error: "Not your restaurant" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  const allowedFields = ["name", "nameJa", "address", "imageUrl"];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db.update(restaurantsTable)
    .set(updateData)
    .where(eq(restaurantsTable.id, restaurant.id))
    .returning();

  res.json(updated);
});

router.get("/restaurants/:slug/items", async (req, res): Promise<void> => {
  const { slug } = req.params;
  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.slug, slug)).limit(1);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  const isOwner = req.session.ownerId === restaurant.ownerId;

  let items;
  if (isOwner) {
    items = await db.select().from(menuItemsTable)
      .where(eq(menuItemsTable.restaurantId, restaurant.id))
      .orderBy(menuItemsTable.sortOrder);
  } else {
    items = await db.select().from(menuItemsTable)
      .where(and(eq(menuItemsTable.restaurantId, restaurant.id), eq(menuItemsTable.approved, true)))
      .orderBy(menuItemsTable.sortOrder);
  }

  res.json(items);
});

router.post("/restaurants/:slug/items", requireOwner, async (req, res): Promise<void> => {
  const { slug } = req.params;
  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.slug, slug)).limit(1);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  if (restaurant.ownerId !== req.session.ownerId) {
    res.status(403).json({ error: "Not your restaurant" });
    return;
  }

  const {
    nameJa, titleEn, descriptionEn, nameRomaji, namePhoneticEn,
    translationConfidence, translationWarnings, approved,
    category, priceRange, allergens, tags, imageUrl, sortOrder,
  } = req.body;

  if (!nameJa) {
    res.status(400).json({ error: "nameJa is required" });
    return;
  }

  const [item] = await db.insert(menuItemsTable).values({
    restaurantId: restaurant.id,
    nameJa,
    titleEn: titleEn || null,
    descriptionEn: descriptionEn || null,
    nameRomaji: nameRomaji || null,
    namePhoneticEn: namePhoneticEn || null,
    translationConfidence: translationConfidence ?? null,
    translationWarnings: translationWarnings || null,
    approved: approved ?? false,
    category: category || null,
    priceRange: priceRange || null,
    allergens: allergens || null,
    tags: tags || null,
    imageUrl: imageUrl || null,
    sortOrder: sortOrder ?? 0,
  }).returning();

  res.status(201).json(item);
});

router.patch("/restaurants/:slug/items/:id", requireOwner, async (req, res): Promise<void> => {
  const { slug, id } = req.params;
  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) {
    res.status(400).json({ error: "Invalid item id" });
    return;
  }

  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.slug, slug)).limit(1);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  if (restaurant.ownerId !== req.session.ownerId) {
    res.status(403).json({ error: "Not your restaurant" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    "nameJa", "titleEn", "descriptionEn", "nameRomaji", "namePhoneticEn",
    "translationConfidence", "translationWarnings", "approved",
    "category", "priceRange", "allergens", "tags", "imageUrl", "sortOrder",
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [item] = await db.update(menuItemsTable)
    .set(updateData)
    .where(and(eq(menuItemsTable.id, itemId), eq(menuItemsTable.restaurantId, restaurant.id)))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }

  res.json(item);
});

router.delete("/restaurants/:slug/items/:id", requireOwner, async (req, res): Promise<void> => {
  const { slug, id } = req.params;
  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) {
    res.status(400).json({ error: "Invalid item id" });
    return;
  }

  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.slug, slug)).limit(1);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  if (restaurant.ownerId !== req.session.ownerId) {
    res.status(403).json({ error: "Not your restaurant" });
    return;
  }

  const [item] = await db.delete(menuItemsTable)
    .where(and(eq(menuItemsTable.id, itemId), eq(menuItemsTable.restaurantId, restaurant.id)))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
