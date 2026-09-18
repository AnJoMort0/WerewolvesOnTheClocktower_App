import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PlayerView from "@/pages/PlayerView";
import { t } from "@/lib/i18n";

const backend = vi.hoisted(() => {
  type Result = { data: unknown; error: { message: string } | null };
  type Listener = { type: string; filter: { event: string }; handler: (payload: Record<string, unknown>) => void };
  type Channel = { topic: string; listeners: Listener[]; subscriber?: (status: string) => void };
  const channels = new Set<Channel>();
  const state = {
    failOwn: false, missing: false, ownReads: 0, phase: 1,
    pending: null as Promise<Result> | null,
  };
  return {
    state, channels,
    from: (table: string) => {
      let columns = "";
      const query = {
        select: (value: string) => { columns = value; return query; },
        eq: () => query,
        order: () => query,
        update: () => query,
        maybeSingle: () => query,
        single: () => query,
        then: (resolve: (result: Result) => unknown, reject?: (error: unknown) => unknown) => {
          if (table === "players" && columns === "name, character, is_alive, room_id") {
            state.ownReads++;
            const result = state.pending ?? Promise.resolve({
              data: state.failOwn || state.missing ? null : { name: "Human", character: "v01", is_alive: true, room_id: "room" },
              error: state.failOwn ? { message: "Temporary network failure" } : null,
            });
            return result.then(resolve, reject);
          }
          const data = table === "rooms"
            ? { status: "playing", language: "en", player_action_state: null, phase_state: { phase: "night", number: state.phase }, timer_state: null, game_over_state: null }
            : [{ id: "player", name: "Human", seat_position: 0, is_alive: true }];
          return Promise.resolve({ data, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
    channel: (topic: string) => {
      const channel = {
        topic, listeners: [] as Listener[], subscriber: undefined as ((status: string) => void) | undefined,
        on: (type: string, filter: { event: string }, handler: Listener["handler"]) => {
          channel.listeners.push({ type, filter, handler }); return channel;
        },
        subscribe: (subscriber?: (status: string) => void) => {
          channel.subscriber = subscriber; channels.add(channel); subscriber?.("SUBSCRIBED"); return channel;
        },
        send: () => Promise.resolve("ok"),
      };
      return channel;
    },
  };
});

vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: backend.from, channel: backend.channel,
  removeChannel: (channel: Parameters<typeof backend.channels.delete>[0]) => { backend.channels.delete(channel); return Promise.resolve("ok"); },
} }));

const showPlayer = () => render(<MemoryRouter initialEntries={["/play/player"]}>
  <Routes><Route path="/play/:playerId" element={<PlayerView />} /></Routes>
</MemoryRouter>);
const loaded = () => waitFor(() => expect(screen.getAllByText("Human").length).toBeGreaterThan(0));

beforeEach(() => {
  window.localStorage.clear();
  Object.assign(backend.state, { failOwn: false, missing: false, ownReads: 0, phase: 1, pending: null });
});
afterEach(() => { cleanup(); backend.channels.clear(); vi.restoreAllMocks(); });

describe("player recovery and room isolation", () => {
  it("keeps a transient fetch failure recoverable and loads current state when the network returns", async () => {
    backend.state.failOwn = true;
    showPlayer();
    await waitFor(() => expect(backend.state.ownReads).toBe(1));
    expect(screen.queryByText(t("sessionEnded", "pt"))).toBeNull();
    backend.state.failOwn = false;
    act(() => window.dispatchEvent(new Event("online")));
    await loaded();
    expect(screen.queryByText(t("sessionEnded", "en"))).toBeNull();
  });

  it("coalesces recovery events, preserves the session on API errors, and cleans up listeners", async () => {
    const view = showPlayer();
    await loaded();
    await act(async () => {});
    let resolve!: (result: { data: null; error: { message: string } }) => void;
    backend.state.pending = new Promise((done) => { resolve = done; });
    const before = backend.state.ownReads;
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(backend.state.ownReads).toBe(before + 1);
    await act(async () => resolve({ data: null, error: { message: "Offline" } }));
    expect(screen.queryByText(t("sessionEnded", "en"))).toBeNull();
    backend.state.pending = null;
    view.unmount();
    act(() => window.dispatchEvent(new Event("focus")));
    expect(backend.state.ownReads).toBe(before + 1);
    expect(backend.channels.size).toBe(0);
  });

  it("fetches current room state after a socket rejoin", async () => {
    showPlayer();
    await loaded();
    backend.state.phase = 2;
    const ownChannel = Array.from(backend.channels).find((channel) => channel.topic === "player-player")!;
    act(() => ownChannel.subscriber?.("SUBSCRIBED"));
    await waitFor(() => expect(screen.getByText("Night 2")).toBeInTheDocument());
  });

  it("ignores another player's deletion but handles its own deletion", async () => {
    showPlayer();
    await loaded();
    const ownChannel = Array.from(backend.channels).find((channel) => channel.topic === "player-player")!;
    const deleted = ownChannel.listeners.find((listener) => listener.type === "postgres_changes" && listener.filter.event === "DELETE")!;
    act(() => deleted.handler({ old: { id: "other-game-player" } }));
    expect(screen.queryByText(t("sessionEnded", "en"))).toBeNull();
    act(() => deleted.handler({ old: { id: "player" } }));
    expect(screen.getByText(t("sessionEnded", "en"))).toBeInTheDocument();
  });

  it("handles a genuinely missing player row as removal", async () => {
    backend.state.missing = true;
    showPlayer();
    await waitFor(() => expect(screen.getByText(t("sessionEnded", "pt"))).toBeInTheDocument());
  });
});
