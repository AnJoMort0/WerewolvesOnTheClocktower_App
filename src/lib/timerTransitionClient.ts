/** A transition is sent once. If its result is unknown, read durable state before another command. */
export async function transitionWithRecovery<T>(
  send: () => Promise<{ data: T | null; error: unknown }>,
  recover: () => Promise<boolean>,
): Promise<{ kind: "applied"; data: T } | { kind: "recovered" | "uncertain" }> {
  try {
    const result = await send();
    if (!result.error && result.data) return { kind: "applied", data: result.data };
  } catch {
    // A request may have committed even when its response was lost.
  }
  try {
    return { kind: await recover() ? "recovered" : "uncertain" };
  } catch {
    return { kind: "uncertain" };
  }
}
