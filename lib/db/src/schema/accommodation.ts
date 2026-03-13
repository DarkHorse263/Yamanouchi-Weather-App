import { pgTable, text, serial, boolean, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accommodationTable = pgTable("accommodation", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameJa: text("name_ja"),
  type: text("type").notNull().default("hotel"),
  region: text("region").notNull(),
  address: text("address"),
  addressJa: text("address_ja"),
  description: text("description").notNull().default(""),
  descriptionJa: text("description_ja"),
  priceRange: text("price_range"),
  phone: text("phone"),
  email: text("email"),
  websiteUrl: text("website_url"),
  imageUrl: text("image_url"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  amenities: text("amenities"),
  onsenAvailable: boolean("onsen_available").notNull().default(false),
  skiInSkiOut: boolean("ski_in_ski_out").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAccommodationSchema = createInsertSchema(accommodationTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAccommodation = z.infer<typeof insertAccommodationSchema>;
export type Accommodation = typeof accommodationTable.$inferSelect;
