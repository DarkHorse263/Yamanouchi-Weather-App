/** Only a genuine Clerk resource-not-found response is idempotent success. */
export function clerkIdentityMissing(error: unknown): boolean {
  const value = error as { status?: number; errors?: Array<{ code?: string }> } | null;
  return value?.status === 404 && value.errors?.some((e) => e.code === "resource_not_found") === true;
}

export interface DeletionSteps {
  deleteIdentity(): Promise<unknown>;
  markLocalPending(): Promise<void>;
  // Must be atomic (savepoint) including mark completed.
  cleanupLocal(): Promise<void>;
  recordFailure(code: "CLERK_DELETE_FAILED" | "LOCAL_CLEANUP_FAILED"): Promise<void>;
}

/** Called inside a locked durable transaction. No local cleanup before Clerk. */
export async function performDeletionSteps(phase: string, ops: DeletionSteps) {
  if (phase === "completed") return { complete: true, phase: "completed" };
  if (phase !== "pending_clerk" && phase !== "pending_local") throw new Error("INVALID_DELETION_PHASE");
  if (phase === "pending_clerk") {
    try { await ops.deleteIdentity(); }
    catch (error) {
      if (!clerkIdentityMissing(error)) {
        await ops.recordFailure("CLERK_DELETE_FAILED");
        return { complete: false, phase: "pending_clerk" };
      }
    }
    await ops.markLocalPending();
  }
  try {
    await ops.cleanupLocal();
    return { complete: true, phase: "completed" };
  } catch {
    await ops.recordFailure("LOCAL_CLEANUP_FAILED");
    return { complete: false, phase: "pending_local" };
  }
}