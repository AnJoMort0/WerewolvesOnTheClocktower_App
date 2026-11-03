export type TimerPhase = "night" | "day" | "tribunal";
export type ActiveTimerPhase = Exclude<TimerPhase, "night">;

export type TimerState = {
  version: 2;
  revision: number;
  phase: TimerPhase;
  phaseNumber: number;
  status: "inactive" | "running" | "paused" | "done";
  remainingMs: number;
  deadlineAt: string | null;
  lastMutationId: string | null;
};

export type TimerPhaseState = { phase: TimerPhase; number: number };

export type TimerProjection = {
  phase: ActiveTimerPhase;
  phaseNumber: number;
  revision: number;
  timeLeft: number;
  remainingMs: number;
  isRunning: boolean;
  timerDone: boolean;
};

export type TimerClockSample = {
  serverNowMs: number;
  sampledAtMonotonicMs: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isPhase = (value: unknown): value is TimerPhase =>
  value === "night" || value === "day" || value === "tribunal";

const isActivePhase = (value: unknown): value is ActiveTimerPhase =>
  value === "day" || value === "tribunal";

/** Decode a durable v2 timer. An unknown version must not be mistaken for a legacy timer. */
export function parseTimerState(value: unknown): TimerState | null {
  if (!isRecord(value) || value.version !== 2) return null;
  const { revision, phase, phaseNumber, status, remainingMs, deadlineAt, lastMutationId } = value;
  if (!Number.isSafeInteger(revision) || (revision as number) < 0
    || !isPhase(phase) || !Number.isSafeInteger(phaseNumber) || (phaseNumber as number) < 1
    || !Number.isSafeInteger(remainingMs) || (remainingMs as number) < 0
    || (lastMutationId !== null && typeof lastMutationId !== "string")) return null;
  if (status === "running") {
    if (!isActivePhase(phase) || typeof deadlineAt !== "string" || !Number.isFinite(Date.parse(deadlineAt))) return null;
  } else if (status === "inactive") {
    if (phase !== "night" || deadlineAt !== null || remainingMs !== 0) return null;
  } else if (status === "paused" || status === "done") {
    if (!isActivePhase(phase) || deadlineAt !== null || (status === "done" && remainingMs !== 0)) return null;
  } else return null;
  return value as TimerState;
}

/** Legacy running timers have no deadline; preserve their saved value, paused. */
export function recoverLegacyTimerState(value: unknown, currentPhase: TimerPhaseState): TimerState | null {
  if (!isRecord(value) || "version" in value || !isActivePhase(value.phase)
    || value.phase !== currentPhase.phase || !Number.isSafeInteger(currentPhase.number) || currentPhase.number < 1
    || !Number.isSafeInteger(value.timeLeft) || (value.timeLeft as number) < 0
    || typeof value.isRunning !== "boolean" || typeof value.timerDone !== "boolean") return null;
  const remainingMs = (value.timeLeft as number) * 1000;
  if (!Number.isSafeInteger(remainingMs)) return null;
  const done = value.timerDone || remainingMs === 0;
  return {
    version: 2,
    revision: 0,
    phase: value.phase,
    phaseNumber: currentPhase.number,
    status: done ? "done" : "paused",
    remainingMs: done ? 0 : remainingMs,
    deadlineAt: null,
    lastMutationId: null,
  };
}

/** Use the request midpoint to bound uncertainty from network round-trip time. */
export function sampleTimerClock(serverNowMs: number, requestedAtMonotonicMs: number, receivedAtMonotonicMs: number): TimerClockSample | null {
  if (![serverNowMs, requestedAtMonotonicMs, receivedAtMonotonicMs].every(Number.isFinite)
    || receivedAtMonotonicMs < requestedAtMonotonicMs) return null;
  return { serverNowMs, sampledAtMonotonicMs: (requestedAtMonotonicMs + receivedAtMonotonicMs) / 2 };
}

export function projectServerNow(sample: TimerClockSample, nowMonotonicMs: number): number {
  return sample.serverNowMs + Math.max(0, nowMonotonicMs - sample.sampledAtMonotonicMs);
}

/** A display tick only projects saved state; it never mutates or sends it. */
export function projectTimerState(state: TimerState | null, currentPhase: TimerPhaseState, serverNowMs: number): TimerProjection | null {
  if (!state || !isActivePhase(state.phase) || state.phase !== currentPhase.phase
    || state.phaseNumber !== currentPhase.number || state.status === "inactive" || !Number.isFinite(serverNowMs)) return null;
  const remainingMs = state.status === "running"
    ? Math.max(0, Date.parse(state.deadlineAt!) - serverNowMs)
    : state.status === "paused" ? state.remainingMs : 0;
  const timerDone = state.status === "done" || (state.status === "running" && remainingMs === 0);
  return {
    phase: state.phase,
    phaseNumber: state.phaseNumber,
    revision: state.revision,
    timeLeft: Math.ceil(remainingMs / 1000),
    remainingMs,
    isRunning: state.status === "running" && !timerDone,
    timerDone,
  };
}

/** Keep the newest authoritative state when a delayed event or recovery read arrives. */
export function acceptTimerRevision(current: TimerState | null, incoming: TimerState): TimerState {
  return !current || incoming.revision > current.revision ? incoming : current;
}
