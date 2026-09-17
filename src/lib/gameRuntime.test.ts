import { describe, expect, it } from "vitest";
import { EMPTY_GAME_RUNTIME, formatGameRuntime, getGameRuntimeMs, normalizeGameRuntime, updateGameRuntime } from "./gameRuntime";

describe("game runtime", () => {
  it("excludes the lobby and game-over pause, then resumes accumulated play time", () => {
    const started = updateGameRuntime(EMPTY_GAME_RUNTIME, "playing", 10_000);
    expect(getGameRuntimeMs(started, 70_000)).toBe(60_000);
    const ended = updateGameRuntime(started, "finished", 130_000);
    expect(getGameRuntimeMs(ended, 9_000_000)).toBe(120_000);
    const resumed = updateGameRuntime(ended, "playing", 9_000_000);
    expect(getGameRuntimeMs(resumed, 9_060_000)).toBe(180_000);
    expect(updateGameRuntime(resumed, "lobby", 9_070_000)).toEqual(EMPTY_GAME_RUNTIME);
  });

  it("restores timestamps without losing time on refresh", () => {
    const restored = normalizeGameRuntime(JSON.parse(JSON.stringify({ elapsedMs: 60_000, runningSince: 10_000 })));
    expect(getGameRuntimeMs(updateGameRuntime(restored, "playing", 70_000), 130_000)).toBe(180_000);
    expect(normalizeGameRuntime({ elapsedMs: -1, runningSince: null })).toEqual(EMPTY_GAME_RUNTIME);
    expect(formatGameRuntime(3_659_999)).toBe("01h:00min");
    expect(formatGameRuntime(366_000_000)).toBe("101h:40min");
  });
});
