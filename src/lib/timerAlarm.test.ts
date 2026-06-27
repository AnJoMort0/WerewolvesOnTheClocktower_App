import { describe, expect, it } from "vitest";
import { shouldPlayTimerAlarm } from "@/lib/timerAlarm";

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
