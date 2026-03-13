import { pgTable, text, serial, boolean, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const diningTable = pgTable("dining", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameJa: text("name_ja"),
  type: text("type").notNull().default("restaurant"),
  region: text("region").notNull(),
  address: text("address"),
  addressJa: text("address_ja"),
  description: text("description").notNull().default(""),
  descriptionJa: text("description_ja"),
  cuisine: text("cuisine"),
  cuisineJa: text("cuisine_ja"),
  priceRange: text("price_range"),
  phone: text("phone"),
  websiteUrl: text("website_url"),
  imageUrl: text("image_url"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  openingHours: text("opening_hours"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDiningSchema = createInsertSchema(diningTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDining = z.infer<typeof insertDiningSchema>;
export type Dining = typeof diningTable.$inferSelect;
