import { describe, expect, it } from "vitest";
import { shouldPlayProjectedTimerAlarm, shouldPlayTimerAlarm } from "@/lib/timerAlarm";
import type { TimerProjection } from "@/lib/timerState";

describe("shouldPlayTimerAlarm", () => {
  it("fires once when the current phase timer changes from active to done", () => {
    expect(shouldPlayTimerAlarm(
      { phase: "day", timerDone: false },
      { phase: "day", timerDone: true },
    )).toBe(true);
  });

  it("does not fire for initial hydration, repeated done updates, or a phase change", () => {
    expect(shouldPlayTimerAlarm(null, { phase: "day", timerDone: true })).toBe(false);
    expect(shouldPlayTimerAlarm(
      { phase: "day", timerDone: true },
      { phase: "day", timerDone: true },
    )).toBe(false);
    expect(shouldPlayTimerAlarm(
      { phase: "day", timerDone: false },
      { phase: "tribunal", timerDone: true },
    )).toBe(false);
  });
});

describe("projected timer alarm", () => {
  const running: TimerProjection = {
    phase: "day", phaseNumber: 2, revision: 4, timeLeft: 1,
    remainingMs: 500, isRunning: true, timerDone: false,
  };
  const expired: TimerProjection = { ...running, timeLeft: 0, remainingMs: 0, isRunning: false, timerDone: true };

  it("sounds once for a live, visible expiry of the same phase timer", () => {
    expect(shouldPlayProjectedTimerAlarm(running, expired, "live", true)).toBe(true);
    expect(shouldPlayProjectedTimerAlarm(expired, expired, "live", true)).toBe(false);
  });

  it("stays silent for refresh, wake, hidden expiry and phase changes", () => {
    expect(shouldPlayProjectedTimerAlarm(null, expired, "live", true)).toBe(false);
    expect(shouldPlayProjectedTimerAlarm(running, expired, "recovery", true)).toBe(false);
    expect(shouldPlayProjectedTimerAlarm(running, expired, "live", false)).toBe(false);
    expect(shouldPlayProjectedTimerAlarm(running, { ...expired, phaseNumber: 3 }, "live", true)).toBe(false);
    expect(shouldPlayProjectedTimerAlarm(running, { ...expired, phase: "tribunal" }, "live", true)).toBe(false);
  });
});
