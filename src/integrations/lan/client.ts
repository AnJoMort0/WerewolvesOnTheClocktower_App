import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getPlayerSession } from "@/lib/playerSession";

type Result = { data: unknown; error: { message: string; code?: string } | null };
type Query = {
  table: string; operation: string; values?: unknown; columns?: string;
  filters: [string, unknown][]; order?: string; cardinality?: string;
};
type Subscription = { type: string; filter: Record<string, string>; callback: (value: Record<string, unknown>) => void };
type WireEvent = { type: string; topic?: string; event?: string; payload?: Record<string, unknown>; table?: string; eventType?: string; new?: Record<string, unknown>; old?: Record<string, unknown> };

/** The game's existing database/broadcast interface, implemented over a same-origin LAN server. */
export function createLanClient() {
  const clientId = Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, "0")).join("");
  const channels = new Set<LanChannel>();
  let source: EventSource | null = null;
  let ready = false;

  async function post(path: string, body: unknown): Promise<Result> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`/api/lan/${path}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ ...body as object, player: getPlayerSession(), clientId }),
      });
      const result = await response.json();
      return response.ok ? result : { data: null, error: result.error ?? { message: `LAN server returned ${response.status}` } };
    } catch (error) {
      return { data: null, error: { message: error instanceof Error ? error.message : "LAN connection lost" } };
    } finally { clearTimeout(timeout); }
  }

  class Builder implements PromiseLike<Result> {
    private result?: Promise<Result>;
    private query: Query;
    constructor(table: string) { this.query = { table, operation: "select", filters: [] }; }
    select(columns = "*") { this.query.columns = columns; return this; }
    eq(column: string, value: unknown) { this.query.filters.push([column, value]); return this; }
    order(column: string) { this.query.order = column; return this; }
    single() { this.query.cardinality = "single"; return this; }
    maybeSingle() { this.query.cardinality = "maybeSingle"; return this; }
    private mutate(operation: string, values?: unknown) {
      this.query.operation = operation;
      this.query.values = values;
      // Some existing callers deliberately discard builders. Defer until filters are chained,
      // and share one execution with await/then so mutations always run exactly once in LAN mode.
      queueMicrotask(() => { void this.execute(); });
      return this;
    }
    insert(values: unknown) { return this.mutate("insert", values); }
    update(values: unknown) { return this.mutate("update", values); }
    delete() { return this.mutate("delete"); }
    private execute() { return this.result ??= post("query", this.query); }
    then<TResult1 = Result, TResult2 = never>(
      fulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
      rejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> { return this.execute().then(fulfilled, rejected); }
  }

  function connect() {
    if (source) return;
    source = new EventSource(`/api/lan/events?clientId=${clientId}`);
    source.onopen = () => {
      ready = true;
      for (const channel of channels) channel.status?.("SUBSCRIBED");
    };
    source.onerror = () => {
      ready = false;
      for (const channel of channels) channel.status?.("CHANNEL_ERROR");
    };
    source.onmessage = ({ data }) => {
      const message = JSON.parse(data) as WireEvent;
      for (const channel of channels) channel.deliver(message);
    };
  }

  class LanChannel {
    private subscriptions: Subscription[] = [];
    status?: (status: string) => void;
    constructor(readonly topic: string) {}
    on(type: string, filter: Record<string, string>, callback: Subscription["callback"]) {
      this.subscriptions.push({ type, filter, callback }); return this;
    }
    subscribe(callback?: (status: string) => void) {
      this.status = callback;
      channels.add(this);
      connect();
      if (ready) queueMicrotask(() => { if (channels.has(this)) this.status?.("SUBSCRIBED"); });
      // A channel can mount after the shared stream was opened, including after a phone refresh.
      void post("replay", { topic: this.topic }).then(({ data }) => {
        if (channels.has(this) && data) this.deliver(data as WireEvent);
      });
      return this;
    }
    async send(message: { type: string; event: string; payload: unknown }) {
      const { error } = await post("broadcast", { topic: this.topic, ...message });
      return error ? "error" : "ok";
    }
    deliver(message: WireEvent) {
      for (const { type, filter, callback } of this.subscriptions) {
        if (type === "broadcast" && message.type === "broadcast" && message.topic === this.topic && message.event === filter.event) {
          callback({ payload: message.payload });
        } else if (type === "postgres_changes" && message.type === "postgres_changes" && message.table === filter.table
          && (filter.event === "*" || filter.event === message.eventType)) {
          const match = filter.filter?.match(/^([a-z_]+)=eq\.(.+)$/);
          if (match && (message.new?.[match[1]] ?? message.old?.[match[1]]) !== match[2]) continue;
          callback({ eventType: message.eventType, new: message.new ?? {}, old: message.old ?? {} });
        }
      }
    }
  }

  return {
    from: (table: string) => new Builder(table),
    rpc: (name: string, args: unknown) => post("rpc", { name, args }),
    channel: (topic: string) => new LanChannel(topic),
    removeChannel: async (channel: LanChannel) => {
      channels.delete(channel);
      if (!channels.size) { source?.close(); source = null; ready = false; }
      return "ok";
    },
  } as unknown as SupabaseClient<Database>;
}
