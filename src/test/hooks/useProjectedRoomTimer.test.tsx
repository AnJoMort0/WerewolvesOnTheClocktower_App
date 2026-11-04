import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useProjectedRoomTimer } from "@/hooks/useProjectedRoomTimer";
import type { TimerState } from "@/lib/timerState";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));

afterEach(() => {
  vi.useRealTimers();
  rpc.mockReset();
});

describe("local timer projection", () => {
  it("counts down without more RPC calls or writes", async () => {
    vi.useFakeTimers();
    rpc.mockImplementation(async () => ({ data: Date.now(), error: null }));
    const timer: TimerState = {
      version: 2, revision: 2, phase: "day", phaseNumber: 1, status: "running",
      remainingMs: 10000, deadlineAt: new Date(Date.now() + 10000).toISOString(), lastMutationId: "start",
    };
    const { result } = renderHook(() => useProjectedRoomTimer(timer, { phase: "day", number: 1 }));
    await act(async () => { await Promise.resolve(); });
    expect(rpc).toHaveBeenCalledOnce();
    const initial = result.current?.timeLeft ?? 0;
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(result.current?.timeLeft).toBeLessThan(initial);
    expect(rpc).toHaveBeenCalledOnce();
  });

  it("does not loop after a clock failure and retries on a later focus", async () => {
    vi.useFakeTimers();
    rpc.mockRejectedValueOnce(new Error("offline"))
      .mockImplementation(async () => ({ data: Date.now(), error: null }));
    renderHook(() => useProjectedRoomTimer(null, null));
    await act(async () => { await Promise.resolve(); });
    expect(rpc).toHaveBeenCalledOnce();
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(rpc).toHaveBeenCalledOnce();
    await act(async () => { window.dispatchEvent(new Event("focus")); await Promise.resolve(); });
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});
