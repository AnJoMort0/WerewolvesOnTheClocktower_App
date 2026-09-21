export type ProphecyPhase = {
  phase: "night" | "day" | "tribunal";
  number: number;
};

/** A correct prophecy preserves a dead player's power for the day following
 * their death and the next night. The stored value is that final night. */
export function isProphecyRetentionActive(
  retainedUntilNight: number | null | undefined,
  phase: ProphecyPhase | null | undefined,
): boolean {
  if (!phase || typeof retainedUntilNight !== "number"
    || !Number.isInteger(retainedUntilNight) || retainedUntilNight < 1) return false;
  return phase.phase === "night"
    ? phase.number === retainedUntilNight
    : phase.number === retainedUntilNight - 1;
}
