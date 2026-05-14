// `./generated/api` exports zod runtime schemas alongside their inferred types
// (e.g. `GetWeatherResponse` is both a value and a type). The orval `types/`
// barrel re-exports the same names as plain TS interfaces, which collides at
// both the value and type level (TS2308). All current consumers
// (api-server routes) only need the schemas from `./generated/api`, so the
// `types/` barrel is intentionally NOT re-exported. Import directly from
// `@workspace/api-zod/generated/types/<name>` if you ever need a pure
// interface without pulling in zod.
export * from "./generated/api";
// Pure-type re-exports for shapes that have no zod runtime peer (e.g. the
// AuthUser DTO returned by /auth/user). Anything that already exists as a zod
// schema in `./generated/api` is intentionally NOT re-exported here to avoid
// TS2308 ambiguity collisions.
export type { AuthUser } from "./generated/types/authUser";
export type { AuthUserEnvelope } from "./generated/types/authUserEnvelope";
