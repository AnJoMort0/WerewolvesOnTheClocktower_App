import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameRuntime } from "@/hooks/useGameRuntime";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(10_000); window.localStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("persistent game runtime", () => {
  it("waits for restoration, retains refresh time, freezes at game over, and resumes", () => {
    const gm = renderHook(({ status, ready }) => useGameRuntime("room", status, ready), {
      initialProps: { status: "playing", ready: false },
    });
    expect(window.localStorage.getItem("wotct_runtime_room")).toBeNull();
    gm.rerender({ status: "playing", ready: true });
    act(() => vi.advanceTimersByTime(60_000));
    expect(gm.result.current.elapsedMs).toBe(60_000);
    gm.unmount();
    act(() => vi.advanceTimersByTime(60_000));
    const reloaded = renderHook(({ status }) => useGameRuntime("room", status, true), { initialProps: { status: "playing" } });
    expect(reloaded.result.current.elapsedMs).toBe(120_000);
    act(() => reloaded.result.current.transition("finished"));
    reloaded.rerender({ status: "finished" });
    act(() => vi.advanceTimersByTime(600_000));
    expect(reloaded.result.current.elapsedMs).toBe(120_000);
    reloaded.unmount();
    const paused = renderHook(({ status }) => useGameRuntime("room", status, true), { initialProps: { status: "finished" } });
    expect(paused.result.current.elapsedMs).toBe(120_000);
    paused.rerender({ status: "playing" });
    act(() => vi.advanceTimersByTime(60_000));
    expect(paused.result.current.elapsedMs).toBe(180_000);
    paused.rerender({ status: "lobby" });
    expect(paused.result.current.elapsedMs).toBe(0);
  });
});
