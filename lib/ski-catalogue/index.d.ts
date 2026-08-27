import type { PublicCatalogueRecord } from "./public-runtime.js";

export * from "./public-runtime.js";
export type Lifecycle = "draft" | "verified" | "published";
export declare const LIFECYCLES: readonly Lifecycle[];
export declare const PUBLICATION_REQUIREMENTS: readonly string[];
export declare function validateRecord(record: unknown): string[];
export declare function validateCatalogue(records: unknown[]): string[];
export declare function publicProjection(record: unknown): PublicCatalogueRecord | undefined;