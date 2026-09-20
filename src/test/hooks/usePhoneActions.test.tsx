import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGMPhoneActions, usePlayerPhoneActions } from "@/hooks/usePhoneActions";
import type { PhonePlayer, PhoneWorld } from "@/lib/phoneActions";
import { useGMPlayerActionMirrors, usePlayerActionMirror } from "@/hooks/usePlayerActionMirrors";

const bus = vi.hoisted(() => {
  type Message = { event: string; payload: Record<string, unknown> };
  type Receiver = { receive: (message: Message) => void; topic: string };
  const receivers = new Set<Receiver>();
  const sent: Array<Message & { topic: string }> = [];
  let dropStates = false;
  return {
    receivers,
    sent,
    dropStates: (drop: boolean) => { dropStates = drop; },
    channel: (topic: string) => {
      const listeners = new Map<string, (message: { payload: Record<string, unknown> }) => void>();
      const channel = {
        topic,
        receive: (message: Message) => listeners.get(message.event)?.({ payload: message.payload }),
        on: (_type: string, filter: { event: string }, handler: (message: { payload: Record<string, unknown> }) => void) => {
          listeners.set(filter.event, handler);
          return channel;
        },
        subscribe: (callback?: (status: string) => void) => {
          receivers.add(channel);
          callback?.("SUBSCRIBED");
          return channel;
        },
        send: (message: Message) => {
          sent.push({ ...message, topic });
          if (!dropStates || message.event !== "state") {
            for (const receiver of receivers) {
              if (receiver !== channel && receiver.topic === topic) receiver.receive(message);
            }
          }
          return Promise.resolve("ok");
        },
      };
      return channel;
    },
  };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  channel: bus.channel,
  removeChannel: (channel: Parameters<typeof bus.receivers.delete>[0]) => { bus.receivers.delete(channel); return Promise.resolve("ok"); },
} }));

const player = (id: string, role: PhonePlayer["abilityRole"]): PhonePlayer => ({
  id, name: id, seat_position: 0, abilityRole: role, objectiveRole: role, dead: false, redX: false,
  werewolfTurned: false, evil: false, mime: false, canWake: true, powerless: false,
});
const world: PhoneWorld = { packBlocked: false, players: [
  player("wolf", "e01"), player("puppet", "v06"), player("witch", "e02"), player("victim", "v01"),
] };

beforeEach(() => { vi.useFakeTimers(); window.localStorage.clear(); bus.dropStates(false); bus.sent.length = 0; });
afterEach(() => { cleanup(); bus.receivers.clear(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("phone synchronization across GM and player devices", () => {
  it("uses staggered slow idle recovery for fifty phones and cleans up every subscription", () => {
    const largeWorld: PhoneWorld = { packBlocked: false, players: Array.from({ length: 50 }, (_, i) => player(`player-${i}`, "v01")) };
    const gm = renderHook(() => useGMPhoneActions({ roomId: "room", contextKey: "night:1", enabled: true, world: largeWorld, onAction: vi.fn() }));
    const phones = largeWorld.players.map((p) => renderHook(() => usePlayerPhoneActions("room", p.id)));
    bus.sent.length = 0;
    act(() => vi.advanceTimersByTime(27500));
    expect(bus.sent).toHaveLength(0);
    act(() => vi.advanceTimersByTime(7500));
    expect(bus.sent.filter((message) => message.event === "request")).toHaveLength(50);
    expect(bus.sent.filter((message) => message.event === "state")).toHaveLength(50);
    phones.forEach((phone) => phone.unmount());
    gm.unmount();
    expect(bus.receivers.size).toBe(0);
    bus.sent.length = 0;
    act(() => vi.advanceTimersByTime(60000));
    expect(bus.sent).toHaveLength(0);
  });

  it("pushes changed views only to affected phones and ignores equivalent world rerenders", () => {
    const monkeyWorld: PhoneWorld = { ...world, players: [...world.players, player("monkey", "v26")] };
    const props = { roomId: "room", contextKey: "night:1", enabled: true, world: monkeyWorld, onAction: vi.fn() };
    const gm = renderHook((p) => useGMPhoneActions(p), { initialProps: props });
    const monkey = renderHook(() => usePlayerPhoneActions("room", "monkey"));
    renderHook(() => usePlayerPhoneActions("room", "witch"));
    bus.sent.length = 0;
    act(() => gm.result.current.toggle("monkey", "monkey-line", "monkey"));
    expect(monkey.result.current.session?.mode).toBe("monkey");
    expect(bus.sent.filter((message) => message.event === "state").map((message) => message.topic)).toEqual(["phone-room-monkey"]);
    bus.sent.length = 0;
    gm.rerender({ ...props, world: { ...monkeyWorld, players: monkeyWorld.players.map((p) => ({ ...p })) } });
    expect(bus.sent).toHaveLength(0);
  });

  it("pauses offline polling and requests current state immediately when the network returns", () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    renderHook(() => useGMPhoneActions({ roomId: "room", contextKey: "night:1", enabled: true, world, onAction: vi.fn() }));
    const device = renderHook(() => usePlayerPhoneActions("room", "wolf"));
    bus.sent.length = 0;
    act(() => vi.advanceTimersByTime(60000));
    expect(bus.sent).toHaveLength(0);
    online.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event("online")));
    expect(bus.sent.filter((message) => message.event === "request")).toHaveLength(1);
    expect(device.result.current.connected).toBe(true);
  });

  it("pauses hidden polling and requests current state when the phone wakes", () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    renderHook(() => useGMPhoneActions({ roomId: "room", contextKey: "night:1", enabled: true, world, onAction: vi.fn() }));
    renderHook(() => usePlayerPhoneActions("room", "wolf"));
    bus.sent.length = 0;
    act(() => vi.advanceTimersByTime(60000));
    expect(bus.sent).toHaveLength(0);
    visibility.mockReturnValue("visible");
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(bus.sent.filter((message) => message.event === "request")).toHaveLength(1);
  });

  it("mirrors open player action screens, recovers a GM reload, and closes both devices", () => {
    const onClose = vi.fn();
    const gm = renderHook(() => useGMPlayerActionMirrors("room", true, () => true));
    const device = renderHook(({ kind }) => usePlayerActionMirror("room", "paranoid", kind, onClose), {
      initialProps: { kind: "v10-assassinate" as "v10-assassinate" | null },
    });
    expect(gm.result.current.mode).toMatchObject({ actorPlayerId: "paranoid", kind: "v10-assassinate" });
    const mode = gm.result.current.mode!;
    expect(device.result.current("v10-assassinate")).toBe(mode.id);
    gm.unmount();
    const restored = renderHook(() => useGMPlayerActionMirrors("room", true, () => true));
    act(() => vi.advanceTimersByTime(2500));
    expect(restored.result.current.mode?.id).toBe(mode.id);
    act(() => restored.result.current.close(mode));
    expect(onClose).toHaveBeenCalledOnce();
    device.rerender({ kind: null });
    act(() => vi.advanceTimersByTime(5000));
    expect(restored.result.current.mode).toBeNull();
  });

  it("queues simultaneous action screens and rejects unavailable copied powers", () => {
    const gm = renderHook(() => useGMPlayerActionMirrors("room", true, (mode) => mode.actorPlayerId !== "unavailable"));
    renderHook(() => usePlayerActionMirror("room", "paranoid", "v10-assassinate", vi.fn()));
    renderHook(() => usePlayerActionMirror("room", "angel", "v18-resurrect", vi.fn()));
    renderHook(() => usePlayerActionMirror("room", "unavailable", "v23-web", vi.fn()));
    expect(gm.result.current.mode?.actorPlayerId).toBe("paranoid");
    act(() => gm.result.current.close(gm.result.current.mode!));
    expect(gm.result.current.mode?.actorPlayerId).toBe("angel");
    act(() => gm.result.current.close(gm.result.current.mode!));
    expect(gm.result.current.mode).toBeNull();
  });
  it("shares a Monkey drag reveal with its script button without revealing twice", () => {
    const onAction = vi.fn();
    const monkeyWorld: PhoneWorld = { ...world, players: [...world.players, player("monkey", "v26")] };
    const gm = renderHook(() => useGMPhoneActions({ roomId: "room", contextKey: "playing:night:1", enabled: true, world: monkeyWorld, onAction }));
    const monkey = renderHook(() => usePlayerPhoneActions("room", "monkey"));
    act(() => {
      gm.result.current.toggle("monkey", "1:drag:monkey:monkey", "monkey");
      gm.result.current.confirmMonkey("wolf");
    });
    expect(monkey.result.current.session?.monkeyReveal).toMatchObject({ targetPlayerId: "wolf", roleId: "e01", evil: true });
    act(() => gm.result.current.close());
    act(() => gm.result.current.toggle("monkey", "1:first:monkey", "monkey", null));
    expect(gm.result.current.session?.monkeyReveal?.targetPlayerId).toBe("wolf");
    act(() => gm.result.current.confirmMonkey("victim"));
    expect(onAction).toHaveBeenCalledTimes(1);
    act(() => monkey.result.current.send("close"));
    expect(gm.result.current.session?.visible).toBe(false);
  });

  it("allows GM Witch, Shaman and hunt actions when their phones cannot act", () => {
    const onAction = vi.fn(), onComplete = vi.fn();
    const gmWorld: PhoneWorld = { ...world, players: [...world.players, player("shaman", "e03")].map((p) => p.id === "victim" ? { ...p, redX: true } : p) };
    const gm = renderHook(() => useGMPhoneActions({ roomId: "room", contextKey: "playing:night:2", enabled: true, world: gmWorld, onAction, onComplete }));
    act(() => gm.result.current.toggle("poison", "witch-line", "witch"));
    act(() => gm.result.current.sendGM("confirm", "wolf"));
    expect(onAction).toHaveBeenLastCalledWith({ action: "poison", targetPlayerId: "wolf", sourcePlayerId: "witch" });
    act(() => gm.result.current.toggle("shaman", "shaman-line", "shaman"));
    act(() => gm.result.current.sendGM("confirm", "victim"));
    expect(onAction).toHaveBeenLastCalledWith({ action: "shaman", targetPlayerId: "victim", sourcePlayerId: "shaman" });
    act(() => gm.result.current.toggle("hunt", "hunt-line", null));
    expect(gm.result.current.consensus).toBeNull();
    act(() => {
      gm.result.current.sendGM("confirm", "witch");
      gm.result.current.sendGM("confirm", "witch");
    });
    expect(onAction).toHaveBeenCalledTimes(3);
    expect(onAction).toHaveBeenLastCalledWith({ action: "kill", targetPlayerId: "witch", sourcePlayerId: null });
    expect(onComplete).toHaveBeenCalledTimes(3);
  });

  it("synchronizes a Spider script selection and completes it once", () => {
    const onAction = vi.fn(), onComplete = vi.fn();
    const spiderWorld: PhoneWorld = { ...world, players: [...world.players, player("spider", "v23")] };
    const gm = renderHook(() => useGMPhoneActions({
      roomId: "room", contextKey: "playing:night:1", enabled: true, world: spiderWorld, onAction, onComplete,
    }));
    const spider = renderHook(() => usePlayerPhoneActions("room", "spider"));
    act(() => gm.result.current.toggle("web", "first-spider-line", "spider", null));
    expect(spider.result.current.session?.mode).toBe("web");
    act(() => spider.result.current.send("select", "victim"));
    expect(onAction).toHaveBeenCalledExactlyOnceWith({ action: "web", sourcePlayerId: "spider", targetPlayerId: "victim" });
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lineKey: "first-spider-line", participantIds: ["spider"] }));
    expect(spider.result.current.session?.pendingTargetPlayerId).toBe("victim");
  });

  it("keeps a confirmed Sleepwalker visit visible until the GM closes it", () => {
    const onAction = vi.fn(), onComplete = vi.fn();
    const sleepwalkerWorld: PhoneWorld = { ...world, players: [...world.players, player("sleepwalker", "v16")] };
    const gm = renderHook(() => useGMPhoneActions({
      roomId: "room", contextKey: "playing:night:2", enabled: true, world: sleepwalkerWorld, onAction, onComplete,
    }));
    const sleepwalker = renderHook(() => usePlayerPhoneActions("room", "sleepwalker"));
    act(() => gm.result.current.toggle("sleepwalker", "sleepwalker-line", "sleepwalker", 3));
    act(() => sleepwalker.result.current.send("confirm", "victim"));
    expect(onAction).toHaveBeenCalledExactlyOnceWith({ action: "sleepwalker", sourcePlayerId: "sleepwalker", targetPlayerId: "victim" });
    expect(onComplete).toHaveBeenCalledOnce();
    expect(gm.result.current.session?.pendingTargetPlayerId).toBe("victim");
    expect(sleepwalker.result.current.session?.pendingTargetPlayerId).toBe("victim");
    act(() => gm.result.current.close());
    expect(sleepwalker.result.current.session).toBeNull();
  });

  it("waits for GM approval before revealing a Priest confessor's character", () => {
    const onComplete = vi.fn();
    const priestWorld: PhoneWorld = { ...world, players: [
      ...world.players, player("priest", "v25"), { ...player("ghost", "v03"), dead: true, canWake: false, displayRole: "v03" },
    ] };
    const gm = renderHook(() => useGMPhoneActions({
      roomId: "room", contextKey: "playing:night:2", enabled: true, world: priestWorld, onAction: vi.fn(), onComplete,
    }));
    const priest = renderHook(() => usePlayerPhoneActions("room", "priest"));
    act(() => gm.result.current.toggle("priest", "priest-line", "priest", 20));
    act(() => priest.result.current.send("confirm", "ghost"));
    const sessionId = gm.result.current.session!.id;
    expect(gm.result.current.session?.pendingTargetPlayerId).toBe("ghost");
    expect(onComplete).not.toHaveBeenCalled();
    act(() => gm.result.current.resolvePriest(sessionId, "ghost", false));
    expect(priest.result.current.session?.pendingTargetPlayerId).toBeUndefined();
    act(() => priest.result.current.send("confirm", "ghost"));
    act(() => gm.result.current.resolvePriest(sessionId, "ghost", true));
    expect(priest.result.current.session?.priestReveal).toEqual({ targetPlayerId: "ghost", roleId: "v03" });
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lineKey: "priest-line", progressOrder: 20 }));
  });

  it("waits for Colossus approval, handles denial, and accepts once despite retries", () => {
    const onAction = vi.fn(), onComplete = vi.fn();
    const colossusWorld: PhoneWorld = { ...world, players: [...world.players.map((p) => ({ ...p, actedTonight: true })),
      { ...player("colossus", "v27"), redX: true, colossusReady: true }] };
    const props = { roomId: "room", contextKey: "playing:night:2", enabled: true, world: colossusWorld, onAction, onComplete };
    const gm = renderHook(() => useGMPhoneActions(props));
    const colossus = renderHook(() => usePlayerPhoneActions("room", "colossus"));
    act(() => gm.result.current.toggle("colossus", "2:normal:retaliation", "colossus", 29));
    act(() => colossus.result.current.send("confirm", "victim"));
    const sessionId = gm.result.current.session!.id;
    expect(colossus.result.current.session?.pendingTargetPlayerId).toBe("victim");
    expect(onAction).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    act(() => gm.result.current.resolveColossus(sessionId, "witch", true));
    expect(onAction).not.toHaveBeenCalled();
    act(() => gm.result.current.resolveColossus(sessionId, "victim", false));
    expect(colossus.result.current.session?.pendingTargetPlayerId).toBeUndefined();
    act(() => gm.result.current.sendGM("confirm", "witch"));
    expect(colossus.result.current.session?.pendingTargetPlayerId).toBe("witch");
    bus.dropStates(true);
    act(() => {
      gm.result.current.resolveColossus(sessionId, "witch", true);
      gm.result.current.resolveColossus(sessionId, "witch", true);
      colossus.result.current.send("confirm", "witch");
    });
    expect(onAction).toHaveBeenCalledExactlyOnceWith({ action: "colossus", sourcePlayerId: "colossus", targetPlayerId: "witch" });
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lineKey: "2:normal:retaliation", progressOrder: 29, participantIds: ["colossus"] }));
    bus.dropStates(false);
    act(() => vi.advanceTimersByTime(2500));
    expect(colossus.result.current.session).toBeNull();
    expect(colossus.result.current.pending).toBe(false);
  });

  it("withdraws a Colossus request when its target becomes ineligible before approval", () => {
    const onAction = vi.fn();
    const colossusWorld: PhoneWorld = { ...world, players: [...world.players.map((p) => ({ ...p, actedTonight: true })),
      { ...player("colossus", "v27"), redX: true, colossusReady: true }] };
    const props = { roomId: "room", contextKey: "playing:night:2", enabled: true, world: colossusWorld, onAction };
    const gm = renderHook((p) => useGMPhoneActions(p), { initialProps: props });
    act(() => gm.result.current.toggle("colossus", "retaliation", "colossus"));
    act(() => gm.result.current.sendGM("confirm", "victim"));
    const sessionId = gm.result.current.session!.id;
    gm.rerender({ ...props, world: { ...colossusWorld, players: colossusWorld.players.map((p) => p.id === "victim" ? { ...p, host: true } : p) } });
    act(() => gm.result.current.resolveColossus(sessionId, "victim", true));
    expect(onAction).not.toHaveBeenCalled();
    expect(gm.result.current.session?.pendingTargetPlayerId).toBeUndefined();
  });

  it("lets the GM or Monkey confirm once, synchronizes closes, and restores revealed cards", () => {
    const onAction = vi.fn(), onComplete = vi.fn();
    const monkeyWorld: PhoneWorld = { ...world, players: [...world.players, player("monkey", "v26")] };
    const props = { roomId: "room", contextKey: "playing:night:2", enabled: true, world: monkeyWorld, onAction, onComplete };
    const gm = renderHook((p) => useGMPhoneActions(p), { initialProps: props });
    const monkey = renderHook(() => usePlayerPhoneActions("room", "monkey"));
    const outsider = renderHook(() => usePlayerPhoneActions("room", "witch"));
    act(() => gm.result.current.toggle("monkey", "monkey-line", "monkey", 31));
    expect(monkey.result.current.session?.mode).toBe("monkey");
    expect(outsider.result.current.session).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
    act(() => gm.result.current.confirmMonkey("wolf"));
    expect(monkey.result.current.session?.monkeyReveal?.roleId).toBe("e01");
    act(() => monkey.result.current.send("confirm", "victim"));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lineKey: "monkey-line", progressOrder: 31 }));
    gm.rerender({ ...props, world: { ...monkeyWorld, players: monkeyWorld.players.map((p) => p.id === "monkey" ? { ...p, powerless: true, monkeyDisabled: true } : p) } });
    act(() => monkey.result.current.send("close"));
    expect(gm.result.current.session?.visible).toBe(false);
    act(() => gm.result.current.toggle("monkey", "monkey-line", "monkey", 31));
    expect(monkey.result.current.session?.visible).toBe(true);
    act(() => gm.result.current.close());
    expect(monkey.result.current.session?.visible).toBe(false);
    act(() => monkey.result.current.send("reopen"));
    expect(gm.result.current.session?.monkeyReveal?.roleId).toBe("e01");
    gm.unmount();
    const restored = renderHook(() => useGMPhoneActions(props));
    expect(restored.result.current.session?.monkeyReveal?.roleId).toBe("e01");
    act(() => restored.result.current.toggle("allies", "allies-line", null));
    act(() => restored.result.current.toggle("monkey", "monkey-line", "monkey", 31));
    expect(restored.result.current.session?.monkeyReveal?.roleId).toBe("e01");
    expect(onAction).toHaveBeenCalledTimes(1);
    act(() => restored.result.current.reset());
    act(() => restored.result.current.toggle("monkey", "monkey-line", "monkey", 31));
    expect(restored.result.current.session?.monkeyReveal).toBeUndefined();
  });

  it("synchronizes and restores a Fox result after the Fox loses its power", () => {
    const onAction = vi.fn(), onComplete = vi.fn();
    const foxPlayers = [
      { ...player("fox", "v04"), seat_position: 0 },
      { ...player("left", "v01"), seat_position: 1 },
      { ...player("target", "v01"), seat_position: 2 },
      { ...player("right", "v01"), seat_position: 3 },
    ];
    const foxWorld: PhoneWorld = { packBlocked: false, nightNumber: 2, players: foxPlayers };
    const props = { roomId: "room", contextKey: "playing:night:2", enabled: true, world: foxWorld, onAction, onComplete };
    const gm = renderHook((p) => useGMPhoneActions(p), { initialProps: props });
    const fox = renderHook(() => usePlayerPhoneActions("room", "fox"));

    act(() => gm.result.current.toggle("fox", "fox-line", "fox", 32));
    act(() => fox.result.current.send("confirm", "target"));
    expect(gm.result.current.session?.foxReveal).toMatchObject({
      targetPlayerId: "target",
      playerIds: ["left", "target", "right"],
      result: "clear",
      foxRanAway: true,
    });
    expect(onAction).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ action: "fox", sourcePlayerId: "fox" }));
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lineKey: "fox-line", progressOrder: 32 }));

    gm.rerender({ ...props, world: { ...foxWorld, players: foxPlayers.map((candidate) => (
      candidate.id === "fox" ? { ...candidate, powerless: true, foxDisabled: true } : candidate
    )) } });
    act(() => fox.result.current.send("close"));
    expect(gm.result.current.session?.visible).toBe(false);
    act(() => gm.result.current.toggle("fox", "fox-line", "fox", 32));
    expect(fox.result.current.session?.foxReveal?.foxRanAway).toBe(true);
    expect(onAction).toHaveBeenCalledTimes(1);

    gm.unmount();
    const restored = renderHook(() => useGMPhoneActions(props));
    expect(restored.result.current.session?.foxReveal?.targetPlayerId).toBe("target");
  });

  it("accepts a Monkey selection from the phone and recovers a lost reveal response", () => {
    const onAction = vi.fn(), onComplete = vi.fn();
    const monkeyWorld: PhoneWorld = { ...world, players: [...world.players, player("monkey", "v26")] };
    const gm = renderHook(() => useGMPhoneActions({ roomId: "room", contextKey: "playing:night:2", enabled: true, world: monkeyWorld, onAction, onComplete }));
    const monkey = renderHook(() => usePlayerPhoneActions("room", "monkey"));
    act(() => gm.result.current.toggle("monkey", "monkey-line", "monkey"));
    bus.dropStates(true);
    act(() => monkey.result.current.send("confirm", "wolf"));
    expect(onAction).toHaveBeenCalledTimes(1);
    bus.dropStates(false);
    act(() => vi.advanceTimersByTime(2500));
    expect(monkey.result.current.session?.monkeyReveal?.roleId).toBe("e01");
    expect(monkey.result.current.pending).toBe(false);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
  const setup = () => {
    const onAction = vi.fn();
    const onComplete = vi.fn();
    const gm = renderHook((props) => useGMPhoneActions(props), { initialProps: {
      roomId: "room", contextKey: "playing:night:2", enabled: true, world, onAction, onComplete,
    } });
    const wolf = renderHook(() => usePlayerPhoneActions("room", "wolf"));
    const puppet = renderHook(() => usePlayerPhoneActions("room", "puppet"));
    const witch = renderHook(() => usePlayerPhoneActions("room", "witch"));
    return { onAction, onComplete, gm, wolf, puppet, witch };
  };

  it("shares selections, waits for the Puppeteer, and executes an accepted kill once", () => {
    const { gm, wolf, puppet, witch, onAction, onComplete } = setup();
    act(() => gm.result.current.toggle("hunt", "hunt-line", null));
    expect(wolf.result.current.session?.mode).toBe("hunt");
    expect(puppet.result.current.session?.mode).toBe("hunt");
    expect(witch.result.current.session).toBeNull();
    act(() => wolf.result.current.send("select", "victim"));
    expect(puppet.result.current.session?.votes.wolf).toBe("victim");
    expect(gm.result.current.consensus).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
    act(() => puppet.result.current.send("select", "victim"));
    const sessionId = gm.result.current.session!.id;
    expect(gm.result.current.consensus).toBe("victim");
    act(() => {
      gm.result.current.resolveHunt(sessionId, "victim", true);
      gm.result.current.resolveHunt(sessionId, "victim", true);
    });
    expect(onAction).toHaveBeenCalledExactlyOnceWith({ action: "kill", sourcePlayerId: null, targetPlayerId: "victim" });
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lineKey: "hunt-line" }));
    expect(wolf.result.current.session).toBeNull();
    expect(puppet.result.current.session).toBeNull();
  });

  it("denial clears votes without killing or repeating the prompt", () => {
    const { gm, wolf, puppet, onAction, onComplete } = setup();
    act(() => gm.result.current.toggle("hunt", "hunt-line", null));
    act(() => wolf.result.current.send("select", "victim"));
    act(() => puppet.result.current.send("select", "victim"));
    act(() => gm.result.current.resolveHunt(gm.result.current.session!.id, "victim", false));
    act(() => vi.advanceTimersByTime(5000));
    expect(gm.result.current.consensus).toBeNull();
    expect(wolf.result.current.session?.votes).toEqual({});
    expect(onAction).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("cancellation reaches phones even when the first close broadcast was lost", () => {
    const { gm, wolf, puppet } = setup();
    act(() => gm.result.current.toggle("hunt", "hunt-line", null));
    bus.dropStates(true);
    act(() => gm.result.current.toggle("hunt", "hunt-line", null));
    expect(wolf.result.current.session).not.toBeNull();
    bus.dropStates(false);
    act(() => vi.advanceTimersByTime(2500));
    expect(wolf.result.current.session).toBeNull();
    expect(puppet.result.current.session).toBeNull();
  });

  it("retries an unacknowledged poison without applying it again or leaving the phone stuck", () => {
    const { gm, witch, onAction, onComplete } = setup();
    act(() => gm.result.current.toggle("poison", "witch-line", "witch", 7));
    expect(onComplete).not.toHaveBeenCalled();
    bus.dropStates(true);
    act(() => witch.result.current.send("confirm", "victim"));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(witch.result.current.pending).toBe(true);
    bus.dropStates(false);
    act(() => vi.advanceTimersByTime(2500));
    expect(witch.result.current.session).toBeNull();
    expect(witch.result.current.pending).toBe(false);
    expect(onAction).toHaveBeenCalledExactlyOnceWith({ action: "poison", sourcePlayerId: "witch", targetPlayerId: "victim" });
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lineKey: "witch-line", sourcePlayerId: "witch", progressOrder: 7 }));
  });

  it("recovers an active session after a phone reload and after a GM reload", () => {
    const { gm, wolf, puppet, onAction } = setup();
    act(() => gm.result.current.toggle("hunt", "hunt-line", null));
    act(() => wolf.result.current.send("select", "victim"));
    wolf.unmount();
    const reloadedWolf = renderHook(() => usePlayerPhoneActions("room", "wolf"));
    expect(reloadedWolf.result.current.session?.votes.wolf).toBe("victim");
    gm.unmount();
    const reloadedGM = renderHook(() => useGMPhoneActions({ roomId: "room", contextKey: "playing:night:2", enabled: true, world, onAction }));
    act(() => puppet.result.current.send("select", "victim"));
    expect(reloadedGM.result.current.consensus).toBe("victim");
  });

  it("cancels on phase change and never revives a previous night's session", () => {
    const { gm, wolf, onAction, onComplete } = setup();
    act(() => gm.result.current.toggle("hunt", "hunt-line", null));
    gm.rerender({ roomId: "room", contextKey: "playing:day:2", enabled: false, world, onAction, onComplete });
    expect(wolf.result.current.session).toBeNull();
    gm.rerender({ roomId: "room", contextKey: "playing:night:3", enabled: true, world, onAction, onComplete });
    expect(wolf.result.current.session).toBeNull();
    expect(gm.result.current.session).toBeNull();
  });

  it("completes allies on opening, but never completes a manually cancelled action", () => {
    const { gm, onComplete } = setup();
    act(() => gm.result.current.toggle("allies", "allies-line", null));
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lineKey: "allies-line" }));
    act(() => gm.result.current.toggle("allies", "allies-line", null));
    expect(onComplete).toHaveBeenCalledTimes(1);
    act(() => gm.result.current.toggle("poison", "witch-line", "witch"));
    act(() => gm.result.current.close());
    act(() => gm.result.current.toggle("poison", "invalid-line", "wolf"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("completes the Shaman's exact line when they ignore without spending a save", () => {
    const onAction = vi.fn();
    const onComplete = vi.fn();
    const shamanWorld: PhoneWorld = { ...world, players: [...world.players, player("shaman", "e03")] };
    const gm = renderHook(() => useGMPhoneActions({ roomId: "room", contextKey: "playing:night:2", enabled: true, world: shamanWorld, onAction, onComplete }));
    const shaman = renderHook(() => usePlayerPhoneActions("room", "shaman"));
    act(() => gm.result.current.toggle("shaman", "shaman-line", "shaman", 35));
    expect(onComplete).not.toHaveBeenCalled();
    act(() => shaman.result.current.send("ignore"));
    expect(onAction).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lineKey: "shaman-line", progressOrder: 35 }));
    expect(shaman.result.current.session).toBeNull();
  });
});
