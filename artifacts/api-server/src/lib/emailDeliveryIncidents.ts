import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, emailDeliveryIncidentsTable } from "@workspace/db";

export async function recordEmailDeliveryIncident(params: {
  providerEventId: string;
  email: string;
  type: "bounced" | "complained";
  reason: string | null;
}) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${params.email}, 0))`);
    return tx
      .insert(emailDeliveryIncidentsTable)
      .values(params)
      .onConflictDoNothing({ target: emailDeliveryIncidentsTable.providerEventId })
      .returning({ id: emailDeliveryIncidentsTable.id });
  });
}

export type ResolveEmailDeliveryIncidentOutcome =
  | { kind: "not_found" }
  | { kind: "already_resolved" }
  | { kind: "confirmation_required" }
  | { kind: "newer_exists" }
  | {
      kind: "resolved";
      incidentType: string;
      incident: {
        id: string;
        resolvedAt: Date | null;
        resolvedByEmail: string | null;
      };
    };

export async function resolveEmailDeliveryIncident(params: {
  id: string;
  email: string;
  adminUserId: string;
  adminEmail: string;
  confirmComplaint: boolean;
}): Promise<ResolveEmailDeliveryIncidentOutcome> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${params.email}, 0))`);

    const [incident] = await tx
      .select({
        id: emailDeliveryIncidentsTable.id,
        type: emailDeliveryIncidentsTable.type,
        resolvedAt: emailDeliveryIncidentsTable.resolvedAt,
      })
      .from(emailDeliveryIncidentsTable)
      .where(eq(emailDeliveryIncidentsTable.id, params.id))
      .limit(1);
    if (!incident) return { kind: "not_found" };
    if (incident.resolvedAt) return { kind: "already_resolved" };
    if (incident.type === "complained" && !params.confirmComplaint) {
      return { kind: "confirmation_required" };
    }

    const [latest] = await tx
      .select({ id: emailDeliveryIncidentsTable.id })
      .from(emailDeliveryIncidentsTable)
      .where(eq(emailDeliveryIncidentsTable.email, params.email))
      .orderBy(desc(emailDeliveryIncidentsTable.createdAt), desc(emailDeliveryIncidentsTable.id))
      .limit(1);
    if (latest?.id !== params.id) return { kind: "newer_exists" };

    const [resolved] = await tx
      .update(emailDeliveryIncidentsTable)
      .set({
        resolvedAt: new Date(),
        resolvedByUserId: params.adminUserId,
        resolvedByEmail: params.adminEmail,
      })
      .where(
        and(
          eq(emailDeliveryIncidentsTable.id, params.id),
          isNull(emailDeliveryIncidentsTable.resolvedAt),
        ),
      )
      .returning({
        id: emailDeliveryIncidentsTable.id,
        resolvedAt: emailDeliveryIncidentsTable.resolvedAt,
        resolvedByEmail: emailDeliveryIncidentsTable.resolvedByEmail,
      });
    return resolved
      ? { kind: "resolved", incidentType: incident.type, incident: resolved }
      : { kind: "already_resolved" };
  });
}