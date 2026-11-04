import { describe, expect, it, vi } from "vitest";
import { transitionWithRecovery } from "@/lib/timerTransitionClient";

describe("timer transition response recovery", () => {
  it("does not read after a confirmed transition", async () => {
    const recover = vi.fn();
    const result = await transitionWithRecovery(async () => ({ data: { revision: 2 }, error: null }), recover);
    expect(result).toEqual({ kind: "applied", data: { revision: 2 } });
    expect(recover).not.toHaveBeenCalled();
  });

  it("reads once after a lost successful response and never resends the command", async () => {
    const send = vi.fn().mockRejectedValue(new Error("response lost"));
    const recover = vi.fn().mockResolvedValue(true);
    expect(await transitionWithRecovery(send, recover)).toEqual({ kind: "recovered" });
    expect(send).toHaveBeenCalledOnce();
    expect(recover).toHaveBeenCalledOnce();
  });

  it("leaves the state uncertain when the authoritative read fails", async () => {
    const send = vi.fn().mockResolvedValue({ data: null, error: new Error("timeout") });
    const recover = vi.fn().mockRejectedValue(new Error("offline"));
    expect(await transitionWithRecovery(send, recover)).toEqual({ kind: "uncertain" });
    expect(send).toHaveBeenCalledOnce();
    expect(recover).toHaveBeenCalledOnce();
  });
});
