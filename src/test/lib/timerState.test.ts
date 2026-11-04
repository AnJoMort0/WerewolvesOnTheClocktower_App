import { describe, expect, it, vi } from "vitest";
import {
  acceptTimerRevision,
  parseTimerState,
  projectServerNow,
  projectTimerState,
  sampleTimerClock,
  type TimerState,
} from "@/lib/timerState";

const day = { phase: "day" as const, number: 2 };
const running: TimerState = {
  version: 2,
  revision: 4,
  phase: "day",
  phaseNumber: 2,
  status: "running",
  remainingMs: 300_000,
  deadlineAt: "2026-11-03T12:05:00.000Z",
  lastMutationId: "start-4",
};
const startedAt = Date.parse("2026-11-03T12:00:00.000Z");

describe("timer state and clock projection", () => {
  it("projects a running countdown from the deadline without changing its durable state or using the network", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const saved = structuredClone(running);
    try {
      expect(projectTimerState(running, day, startedAt)).toMatchObject({ timeLeft: 300, isRunning: true, timerDone: false });
      expect(projectTimerState(running, day, startedAt + 999)).toMatchObject({ timeLeft: 300, isRunning: true });
      expect(projectTimerState(running, day, startedAt + 1_000)).toMatchObject({ timeLeft: 299, isRunning: true });
      expect(projectTimerState(running, day, startedAt + 300_000)).toMatchObject({ timeLeft: 0, isRunning: false, timerDone: true });
      expect(projectTimerState(running, day, startedAt + 400_000)).toMatchObject({ remainingMs: 0, timeLeft: 0 });
      expect(running).toEqual(saved);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("keeps paused time fixed, displays completion, and hides old or night timers", () => {
    const paused: TimerState = { ...running, status: "paused", remainingMs: 89_500, deadlineAt: null };
    expect(projectTimerState(paused, day, startedAt + 500_000)).toMatchObject({ timeLeft: 90, isRunning: false, timerDone: false });
    expect(projectTimerState({ ...paused, status: "done", remainingMs: 0 }, day, startedAt)).toMatchObject({ timeLeft: 0, timerDone: true });
    expect(projectTimerState(running, { phase: "tribunal", number: 2 }, startedAt)).toBeNull();
    expect(projectTimerState(running, { phase: "day", number: 3 }, startedAt)).toBeNull();
    expect(projectTimerState(running, { phase: "night", number: 2 }, startedAt)).toBeNull();
    expect(projectTimerState(null, day, startedAt)).toBeNull();
  });

  it("uses a monotonic clock sample and rejects invalid samples", () => {
    const sample = sampleTimerClock(startedAt, 100, 300);
    expect(sample).toEqual({ serverNowMs: startedAt, sampledAtMonotonicMs: 200 });
    expect(projectServerNow(sample!, 1_200)).toBe(startedAt + 1_000);
    expect(projectServerNow(sample!, 150)).toBe(startedAt);
    expect(sampleTimerClock(startedAt, 300, 100)).toBeNull();
    expect(sampleTimerClock(Number.NaN, 100, 200)).toBeNull();
  });

  it("accepts valid v2 state and rejects malformed or unknown versions", () => {
    expect(parseTimerState(running)).toEqual(running);
    expect(parseTimerState({ ...running, version: 3 })).toBeNull();
    expect(parseTimerState({ ...running, revision: -1 })).toBeNull();
    expect(parseTimerState({ ...running, deadlineAt: "not a date" })).toBeNull();
    expect(parseTimerState({ ...running, status: "paused" })).toBeNull();
    expect(parseTimerState({ ...running, phase: "night" })).toBeNull();
  });

  it("rejects older and conflicting equal revisions after newer state arrives", () => {
    const newer: TimerState = { ...running, revision: 5, status: "paused", remainingMs: 200_000, deadlineAt: null };
    expect(acceptTimerRevision(null, running)).toBe(running);
    expect(acceptTimerRevision(running, newer)).toBe(newer);
    expect(acceptTimerRevision(newer, running)).toBe(newer);
    expect(acceptTimerRevision(newer, { ...newer, remainingMs: 100_000 })).toBe(newer);
  });
});
