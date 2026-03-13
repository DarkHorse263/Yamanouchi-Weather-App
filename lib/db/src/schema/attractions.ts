import { pgTable, text, serial, boolean, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attractionsTable = pgTable("attractions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameJa: text("name_ja"),
  category: text("category").notNull().default("activity"),
  region: text("region").notNull(),
  address: text("address"),
  addressJa: text("address_ja"),
  description: text("description").notNull().default(""),
  descriptionJa: text("description_ja"),
  admissionFee: text("admission_fee"),
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

export const insertAttractionSchema = createInsertSchema(attractionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAttraction = z.infer<typeof insertAttractionSchema>;
export type Attraction = typeof attractionsTable.$inferSelect;
