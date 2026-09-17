export type GameRuntime = { elapsedMs: number; runningSince: number | null };
export const EMPTY_GAME_RUNTIME: GameRuntime = { elapsedMs: 0, runningSince: null };

export function getGameRuntimeMs(runtime: GameRuntime, now: number): number {
  return runtime.elapsedMs + (runtime.runningSince === null ? 0 : Math.max(0, now - runtime.runningSince));
}

export function updateGameRuntime(runtime: GameRuntime, status: string, now: number): GameRuntime {
  if (status === "lobby") return EMPTY_GAME_RUNTIME;
  if (status === "playing") return runtime.runningSince === null ? { ...runtime, runningSince: now } : runtime;
  return runtime.runningSince === null ? runtime : { elapsedMs: getGameRuntimeMs(runtime, now), runningSince: null };
}

export function formatGameRuntime(milliseconds: number): string {
  const minutes = Math.floor(Math.max(0, milliseconds) / 60_000);
  return `${Math.floor(minutes / 60).toString().padStart(2, "0")}h:${(minutes % 60).toString().padStart(2, "0")}min`;
}

export function normalizeGameRuntime(value: unknown): GameRuntime {
  if (!value || typeof value !== "object") return EMPTY_GAME_RUNTIME;
  const candidate = value as Partial<GameRuntime>;
  return typeof candidate.elapsedMs === "number" && Number.isFinite(candidate.elapsedMs) && candidate.elapsedMs >= 0
    && (candidate.runningSince === null || (typeof candidate.runningSince === "number" && Number.isFinite(candidate.runningSince)))
    ? candidate as GameRuntime : EMPTY_GAME_RUNTIME;
}
