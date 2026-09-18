# Free-tier capacity and reliability audit

Audit date: 18 September 2026. Scope: the repository and read-only checks of its configured Supabase project. This report describes the code **before the audit fixes**, and records any implemented fixes separately at the end.

## Verdict

I would not yet rely on the current implementation for a real 50-player game without a rehearsed manual fallback. I would not share it for independent society use yet. Static hosting is appropriate, but idle Realtime traffic, recovery gaps, unrestricted database writes, and multiple competing GM authorities need attention.

The first free-tier constraint is Supabase Realtime message throughput or monthly messages, rather than Cloudflare Workers requests. Fifty players with one GM already generate about 80 counted Realtime events per second from phone synchronisation alone. Two such rooms exceed the published 100-events-per-second Free limit before normal actions are included. Three active GM browsers make one room substantially worse.

The top three changes before wider use are:

1. Reduce idle phone synchronisation and publish only changed views to affected phones.
2. Make writes and broadcasts enforce room membership and GM/player permissions on the server, with bounded room creation and joining.
3. Persist recoverable game state and requests, resynchronise on reconnect, and allow only one active GM authority per room.

## Evidence and limits of the audit

**Measured or directly calculable:** subscription topology, intervals, SDK query execution, migrations and live policies/triggers/indexes, aggregate database sizes, local asset sizes, and existing production bundle sizes.

**Estimated:** a three-hour game's action count, time spent using timers or action modals, payload transfer overhead, and monthly totals. Estimates assume all phones remain connected; sleeping phones reduce traffic but introduce recovery risks.

**Unknown:** actual monthly quota consumption, live peak Realtime rates, network compression, typical night count, future society activity, Cloudflare dashboard configuration, and behaviour under a physical 50-phone load test. No production data was changed, and no load test was run against Supabase.

Read-only database checks found 51 rooms and 270 players, with 27 rooms still marked `playing`. The database occupied 12,733,587 bytes (about 12.1 MiB); rooms and players including indexes occupied approximately 272 KiB and 248 KiB. Average JSON row sizes were 623 bytes for rooms and 332 bytes for players; the largest current room JSON was 8,723 bytes. These are a snapshot, not measurements of a completed 50-player game.

### Published free-tier allowances

Supabase Free lists 200 concurrent Realtime connections, two million Realtime messages per month, a 500 MB database, and 5 GB uncached egress. API requests have no fixed monthly request allowance, but shared compute and transfer still matter. Free projects may pause after a week of inactivity. [Supabase pricing](https://supabase.com/pricing)

Realtime Free additionally limits events to 100 per second, channel joins to 100 per second, and channels to 100 per connection. Throughput excess can disconnect clients, which then reconnect automatically. These are project limits, separate from monthly message allowances. [Realtime limits](https://supabase.com/docs/guides/realtime/limits)

Cloudflare Pages static requests are free and unlimited; Pages Functions consume Workers requests, whose Free allowance is 100,000 per day. Pages Free allows 500 builds per month. [Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/), [Pages platform limits](https://developers.cloudflare.com/pages/platform/limits/)

## 1. Realtime inventory

The application imports one shared `createClient` instance from `src/integrations/supabase/client.ts`. Channels multiplex over one WebSocket per browser context; seventeen channels do **not** mean seventeen connections. Multiple tabs/devices create additional contexts and connections. HTTP queries do not each create a persistent Realtime connection.

| Subscriber / topic | What it receives | Scope and observations |
| --- | --- | --- |
| PlayerView: `player-{playerId}` | Own player UPDATE and DELETE | Own updates overlap the room roster subscription. DELETE must check the returned old ID. |
| PlayerView: `room-{roomId}-status` | Room UPDATE | Receives the whole changed room record, including unrelated activity changes and JSON snapshots. |
| PlayerView: `room-{roomId}-all-players` | Room players, all events | Every event triggers a full public roster query. |
| PlayerView: `player-sync-{roomId}` | Explicit refresh notification | Each phone queries its own row and full roster, even if `playerIds` names another player. |
| PlayerView: `fortune-teller-reveal-{roomId}` | Fortune Teller cards | Every phone receives the broadcast; callback selects its recipient. |
| PlayerView: `little-girl-reveal-{roomId}` | Little Girl information | Same room-wide delivery. |
| PlayerView: `lamplighter-reveal-{roomId}` | Lamplighter results | Same room-wide delivery. |
| PlayerView: `werewolf-seer-reveal-{roomId}` | Werewolf Seer results | Same room-wide delivery; callback may also fetch its own current player row. |
| PlayerView: `spider-reveal-{roomId}` | Spider results | Same room-wide delivery. |
| PlayerView: `spy-reveal-{roomId}` | Spy cards | Same room-wide delivery. |
| PlayerView: `mime-reveal-{roomId}` | Mime card | Same room-wide delivery. |
| PlayerView: `room-phase-{roomId}` | Phase notification | Broadcast complements intended durable room state, but durable writes currently do not execute. |
| PlayerView: `room-timer-{roomId}` | Timer value | One broadcast per second while counting. |
| PlayerView: `game-over-{roomId}` | Game-over state | Also persisted by an awaited room update. |
| PlayerView: `player-actions-{roomId}` | Day action resolution | Room-wide delivery; also uses durable `player_action_state`. |
| usePlayerPhoneActions: `phone-{roomId}-{playerId}` | Private-to-topic action view | One per phone. Sends sync every 2.5 seconds even with no action open. |
| usePlayerActionMirror: `player-action-modes-{roomId}` | GM closes an open day picker | One per phone; open pickers announce every 2.5 seconds to the whole room. |
| GMRoom: `room-{roomId}-players` | Room player changes | Full GM roster query on every event. |
| GMRoom: `room-{roomId}-player-actions` | Room UPDATE | Processes all room updates; callback changes the room object even for activity-only updates. |
| useGMPhoneActions: `phone-{roomId}-{playerId}` for each player | Phone commands and sync | Fifty channels for fifty players, on each GM browser. |
| useGMPlayerActionMirrors: `player-action-modes-{roomId}` | Open day pickers | One channel per GM. |
| RoomDisplay | Local browser storage events | No Supabase queries or channels; works in the same browser profile/origin as the GM. |

A settled player has 17 joined channels and one socket. A GM has 53 joined channels for 50 players, plus a bounded collection of unjoined sender topics. The installed Realtime SDK reuses an existing channel with the same topic; repeated `channel(topic)` sends do **not** allocate an unbounded new channel every second. GM send-only topics use the SDK's HTTP Broadcast fallback because they are not joined.

Effects remove channels and clear intervals/listeners on cleanup. SDK reconnects rejoin existing channels; no permanent duplicate subscription loop was found. However, changes to the roster rebuild all GM phone channels, room status rebuilds the GM roster subscription, and changes to death-state-dependent callbacks rebuild the GM room subscription. These cause avoidable join bursts. Fifty simultaneous phones joining seventeen channels produce approximately 850 joins, so staggered arrivals are preferable; reconnect storms can reach the join-rate limit.

There is no Supabase Presence usage. There is polling alongside Realtime: action sync every 2.5 seconds, day-action state queries every 1.5 seconds **only while an actual request is pending**, and open day-picker broadcasts every 2.5 seconds. Runtime/timer/local GM clock intervals are local computations except for the timer sync callback.

## 2. Database and API paths

| Path | Actual requests / mutations | Assessment |
| --- | --- | --- |
| Index.createRoom | One INSERT returning a room; at most eight attempts on code collision | Bounded normal retries, no server creation quota. |
| JoinRoom.fetchRoom / joinGame | Room by indexed code; optional saved-player check; full room player/token list to match a name; one INSERT returning a player | Room-scoped and small at 50 players, but tokens are publicly readable and joins are unrestricted. |
| PlayerView.fetchPlayer | Own player, room snapshot, and public roster | Runs on entry and again when the discovered room ID changes; not on every render. No general reconnect refetch. |
| PlayerView roster callback | One full room roster SELECT per player-table event per phone | Fifty queries for a single update, plus GM queries. Highest database read amplification. |
| GMRoom.fetchPlayers | Full room roster with character/readiness fields | Same event-driven refresh; existing room index makes the query inexpensive individually. |
| Explicit player-sync broadcast | Two SELECTs per phone | Adds about 100 queries per broadcast, often after the same update already caused roster refreshes. |
| Role distribution/reset/bulk night completion | Per-player updates through Promise.all | Requests execute; up to fifty writes in a burst. Each player write also updates its room through a trigger. |
| Death, resurrection, transformation, character metadata | Awaited, `.then`-consumed, or Promise.all writes | Real writes; metadata effect compares character strings before updating. Error results often do not undo optimistic state. |
| Day action request | Read room JSON, append locally, UPDATE the whole JSON | Read-modify-write can lose another player's simultaneous request. |
| GM day action approval | Persist updated request/charge JSON and send resolution | Local request IDs help prevent repeated approval within one GM context, not across independent GMs. |
| Game over | Broadcast, then awaited room UPDATE with game log/outcomes | Real durable snapshot; grows with the game log and fans out on later room updates. |
| Cleanup button | `cleanup_old_rooms(retention: '24 hours')` | Public invoker function; live RLS has no rooms DELETE policy, so browser callers cannot actually delete rooms. |

There are no queries retrieving all historical rooms during ordinary play, no client storage uploads, no Edge Function calls, and no per-player loop of reads after every render. TanStack Query is mounted but does not cache these direct Supabase queries.

### Important: some intended writes never execute

The installed `@supabase/postgrest-js` performs its fetch inside `PostgrestBuilder.then`. Merely constructing a builder, including `void builder`, does not send it.

Affected paths include PlayerView's `markSeen` every twenty seconds, GM phase persistence, timer persistence, timer defaults persistence, and some GM player-action charge/pruning effects. All use unconsumed query builders. In contrast, `await`, `.then(...)`, and `Promise.all` consume builders and execute their requests. Read-only live checks found **zero stored phases and zero stored timers across all 51 rooms**, consistent with this code defect.

Therefore the current twenty-second heartbeat contributes **zero database requests**, rather than 27,000 writes per three-hour game. It also fails to maintain readiness/connection state. Simply adding `.then` everywhere would be dangerous: fixing that heartbeat unchanged would create 27,000 player updates, 27,000 triggered room updates, around 1.4 million roster reads, and roughly 2.8 million database-change deliveries, before phase rebroadcasts or ordinary play. The activity trigger must be separated from ephemeral connectivity before enabling frequent database heartbeats.

`touch_room_activity` currently updates a room on every player INSERT/UPDATE/DELETE, even when only last-seen information changes. Each room notification also makes GMRoom set a new room object; the phase effect depends on that object and sends another phase broadcast. This magnifies actual player writes and would magnify a repaired heartbeat.

## 3. Authority and recovery

The database is authoritative for player identity/character, permanent `is_alive`, room status, game-over outcome/log, and submitted day-action JSON. It is **not** authoritative for the whole running game.

Pending red X deaths, poisons/effects, remaining charges, script completion and actors, copied-role state, night timing, kill sources, and running phone sessions largely live in GMRoom React state plus localStorage. Phone-session snapshots are local to the GM browser. RoomDisplay likewise depends on same-browser storage, not a remote GM device.

Phone action sync retries pending commands and compares revisions; command sequences, session IDs, and committing before action execution prevent duplicate actions in a single GM. Monkey's revealed card can survive GM reload within that browser. Focus and subscription recovery request the current phone view. These are useful protections worth preserving.

However:

- General player/room state is fetched on mount, not automatically after a socket reconnect, waking from sleep, or network restoration. A missed roster or room event can leave state stale indefinitely.
- An unsuccessful player fetch currently treats missing data as removal, even when the cause is a network/API error.
- Legacy reveal popups are transient broadcasts; a sleeping phone can miss its reveal. They are not backed by a durable reveal inbox or acknowledgement/replay path.
- Timer values depend on successive broadcasts; no client deadline-based reconstruction exists.
- Two players can overwrite each other's day requests because whole room JSON is updated non-atomically.
- Two GM devices execute separate authoritative hooks with different local snapshots and no leader/lease. Both can respond to a command, approve actions, or overwrite state. Player revision ordering cannot resolve conflicting authorities reliably.

Meeting the requested database-authority and multi-GM requirements needs a designed persistence/ownership change, not a small retry patch. Do not claim those requirements are already met after reducing traffic.

## 4. Cloudflare

No `functions/`, Worker entry point, `_worker.js`, or Wrangler configuration exists in the repository. Vite builds static browser files; Supabase calls go directly from the browser to Supabase. `public/sw.js` is a **browser service worker**, not a Cloudflare Worker.

**Calculated game-caused Pages Function/Worker invocations: zero**, assuming deployment matches this repository. Frequent votes, queries, broadcasts, and mutations do not use Cloudflare Workers. Any externally configured dashboard Worker routes would need a separate dashboard check.

Keep this architecture. Moving all phone polling behind a Worker would add a second usage meter without solving the polling problem.

## 5. Room isolation and simultaneous games

Ordinary queries filter by room ID, room code, or a specific player ID. Broadcast topics include the room ID. Normal INSERT/UPDATE subscriptions include room/player filters, so Game B should not update Game A's state.

The critical exception is authorization: live rooms UPDATE and players UPDATE/DELETE policies use `USING (true)`, and INSERT policies accept unrestricted rows. No authenticated room-owner/member identity is enforced. Tokens exist but are readable and not checked by policies. A modified client can damage another game's state or generate unlimited permitted writes. Public broadcasts can also be forged. This matters even when card secrecy is not a priority.

DELETE handling also needs care. Default replica identity provides primary-key old data rather than a complete room row; do not depend solely on DELETE subscription filters. PlayerView's own deletion callback must compare `payload.old.id` with its player ID. Room wildcard listeners may receive unrelated deletions and refetch unnecessarily. Validate this against the deployed server when strengthening isolation. [Postgres Changes deletion and scaling behaviour](https://supabase.com/docs/guides/realtime/postgres-changes)

Two games have approximately 102 connections with one GM each, or 106 with three GM browsers each, below 200. Four 50-player games exceed 200 even with one GM each. Message rate, join bursts, and shared monthly allowance become constraints earlier than sockets.

## 6. Usage calculations

Supabase counts each Broadcast send plus each recipient delivery. Postgres Changes count recipient deliveries. Receiving a topic's message still consumes traffic when its application callback ignores it. [Realtime message accounting](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages)

Let `N = 50` connected phones, `T = 10,800` seconds, and `G` be GM browsers joining every phone topic. Current idle synchronisation sends `N × T / 2.5 = 216,000` requests. Each request costs `1 + G`; each GM emits a response whose recipients include the phone and other joined GM browsers. With default broadcast self-delivery off, a complete exchange costs `(G + 1)²` messages.

| GM browsers per room | Sync-only counted messages / 3-hour game | Sync-only events / second |
| --- | ---: | ---: |
| 1 | 864,000 | 80 |
| 2 | 1,944,000 | 180 |
| 3 | 3,456,000 | 320 |

These are code-derived steady-state calculations, not measured billing. Once throttling disconnects clients, actual delivery falls and retries alter totals. Three GMs are also unsafe for game authority, independent of quota.

Additional traffic:

- Each running timer second broadcasts to fifty phones: approximately 51 messages. One hour of timers adds about 183,600 messages.
- One actual player change delivers player and triggered room events to about 102 subscriptions with one GM, plus the own-player overlap. A phase rebroadcast adds about 51 more messages because the GM updates its room object. Allow roughly 150-155 messages per change, excluding phone view republishing.
- One room-wide reveal costs about 51 messages; an open day-picker heartbeat likewise costs about 51 every 2.5 seconds.
- Before fixes, ordinary phone commands call `commit`, which publishes on all fifty phone topics even though most phones still have an unchanged null view. Each such publication costs around 100 messages with one GM.

For illustration, **300-600 executed player mutations, 30-60 minutes of timers, and ordinary reveal/picker activity** produce roughly **1.0-1.2 million messages per game with one GM**. Some combinations exceed this; more timed play and copied-role/metadata changes increase it. With three GMs, sync alone exceeds the monthly Free allowance in one game.

| Scenario, before fixes, one active GM per game | Illustrative monthly messages | Most likely first constraint |
| --- | ---: | --- |
| One 50-player game | 1.0-1.2 million | Burst throughput; otherwise uses around half the monthly quota |
| Five games/month | 5-6 million | Two-million monthly message allowance |
| Ten games/month | 10-12 million | Monthly messages; egress depends on modal/roster activity |
| Twenty games/month | 20-24 million | Monthly messages; accumulated egress becomes relevant |
| Multiple societies on this deployment | Combined totals above | Shared project throughput and allowance; public mutation permissions |
| Two simultaneous 50-player games | Around 160 sync events/sec before actions | 100-events/sec throughput limit, despite sufficient sockets |
| Three simultaneous games | Around 240 sync events/sec | Throughput; sockets still around 153 with one GM each |

Societies using genuinely separate Supabase projects do not share a project's connection/throughput limits. Copying only the frontend or using different room codes with the same configured project does share them. Organization-level billing allowances must also be checked when adding projects.

### API reads and network estimates

With 300-600 player mutations, the roster subscriptions alone generate approximately **15,300-30,600 roster SELECTs per game** for fifty phones and one GM. Each explicit sync notification adds around 100 reads. These are event-dependent estimates; current unused heartbeat builders are excluded.

A fifty-row public roster is roughly 5-8 KB of JSON with ordinary names/UUIDs; one fetch per mutation means roughly 1.5-4.8 MB per phone for those reads. Individual row events, triggered room records, and whole room JSON snapshots add further transfer. A fifty-player action view is roughly 6-8 KB; participating phones can repeatedly receive that complete view during an open action rather than a delta. Spectators mostly receive tiny null state responses.

Use **roughly 5-40 MB of Supabase downloads per phone per game** as a planning range, strongly dependent on modal duration, game log size, and executed mutations; spectator phones tend toward the lower end. About 0.5-2 GB across fifty phones is plausible in a busy game. This is not a measured network trace or guarantee. Idle sync uploads are hundreds of KB per phone before transport overhead; actual action counts and reconnects determine additional uploads. Measure egress during a rehearsal before committing to a monthly game count.

### Static assets

Measured original artwork totals: roles 124,881,569 bytes, icons 1,954,676 bytes, extras 8,723,459 bytes. Optimized display assets total **3,352,160 bytes across 170 files**, with the largest approximately 47.5 KB. These originals are editing sources, not ordinarily shipped as full-resolution game cards.

The existing production output was **5,188,989 bytes across 149 files**. Its main JS was 1,387,963 bytes (463,384 bytes gzip); CSS was 60,099 bytes (11,705 gzip). Browser image downloads depend on what is displayed; eager image URL imports do not automatically fetch every PNG/WebP. A rulebook visit downloads more card images than an ordinary player view. Static delivery is Cloudflare traffic, not Supabase egress.

The service worker caches same-origin responses but is network-first, so it can revalidate/refetch unchanged files. Hashed assets benefit from browser/CDN caching. Offline shell availability is not offline game support: database and live actions still need connectivity.

## 7. Historical data and abuse

There is no server log/event/history table growing once per action. The running game log lives in GM localStorage and is copied into room `game_over_state` at game over. Room/player rows persist until explicit deletion; ending a room deletes its players but retains the room, while game over alone keeps both.

Fifty current-size player rows contribute approximately **16.6 KB logical JSON per game**, before indexes and row overhead. A completed room adds phase/action metadata and its full game-over log. If a game has 200-500 log entries averaging 0.5-1 KB each, its logical retained data might be roughly **0.12-0.55 MB**. That log estimate must be replaced with measurements after a real game. Fifty-row games without long logs are much smaller. Repeated updates also create dead tuples/WAL; row-size estimates are not total disk-growth guarantees.

Cleanup is manual, unscheduled, and currently ineffective for browser callers because the invoker RPC cannot pass rooms DELETE RLS. No `pg_cron` extension is installed. Twenty games a month at the illustrative log size would retain around 2.4-11 MB logical data per month if nothing expires, plus indexes/bloat. Storage has zero objects; artwork does not consume Supabase Storage.

Recommend deleting finished/abandoned room/player state after a defined retention period, exporting a game's readable log if desired before expiry, and keeping artwork/rules in Git. A daily privileged, narrowly scoped cleanup job is enough; it must never expose unrestricted room deletion as an anonymous RPC. Avoid deleting a live game simply because no permanent player changes occurred for a while.

Normal room creation retries are bounded; UI buttons commonly disable while submitting. However, createRoom/joinGame do not both guard entry with a synchronous in-flight lock, and join by Enter can invoke the handler despite a disabled button. More importantly, browser-only disabling cannot prevent direct unrestricted inserts or broadcast spam. There are no server player-count caps, creation quotas, JSON-size caps, or per-room request rate bounds. The lightweight server permission work should include those bounds. No infinite application retry loop was found, but fixed-interval sync and SDK reconnection can sustain traffic during an outage or throughput rejection.

## 8. Recommendations

### CRITICAL

| Change and location | Current behaviour / why it matters | Smallest practical fix / impact |
| --- | --- | --- |
| C1: Phone traffic, `usePhoneActions.ts` publish/commit/player sync | Idle 2.5-second requests cost 864k messages/game; each command republishes all views. Little headroom for actions or concurrent rooms. | Keep prompt push delivery; use slow, staggered idle recovery, fast pending/active recovery, skip offline/hidden polling, deduplicate unchanged views and target retries. Idle sync can fall approximately 90% or more; exact game savings depend on action time. |
| C2: Cross-room destructive writes, live rooms/players policies and public Broadcast topics | Any public client can update any room/player or delete players and flood allowed writes. Fair play does not protect against buggy clients or strangers. | Establish server-verified owner/member identities, scope mutations and private channel sends, add bounded create/join/action RPCs. Tokens must be unexposed before treating them as capabilities. This materially changes admission/authorization and needs a coordinated migration/client design. |
| C3: Source of truth, GMRoom snapshots/usePhoneActions/PlayerView requests | Local-only effects/charges/pending sessions, dead builders, missed broadcasts, non-atomic JSON requests, and multiple GM authorities can lose or duplicate actions. | First execute intended low-frequency durable writes with errors handled; use timestamps/deadlines for timers; persist versioned running state and atomic requests; one active GM lease plus read-only secondary devices. This materially changes coordination and requires a staged design. Never enable the current high-frequency database heartbeat unchanged. |
| C4: Player recovery/removal, PlayerView fetchPlayer/refreshPlayerState/own DELETE | API errors look like removal; socket reconnect does not generally fetch current rows; own DELETE callback trusts a filter. | Check genuine missing-row responses separately from transient errors, guard old player ID, and refetch on reconnect/focus/network recovery with one in-flight fetch. A bounded recovery fetch costs a few SELECTs per actual recovery, much less than continuous polling. |

### HIGH VALUE

| Change and location | Current behaviour / why it matters | Smallest practical fix / impact |
| --- | --- | --- |
| H1: Roster handling, PlayerView/GMRoom postgres_changes callbacks | Fifty full roster reads for every single-row change. | Apply visible INSERT/UPDATE deltas locally and refetch once on join/reconnect/unknown DELETE, with debouncing. Potentially removes most of the estimated 15k-30k roster reads/game. |
| H2: Activity trigger, `touch_room_activity`; GM phase effect | Every player write updates the whole room; activity changes cause a redundant phase broadcast. | Exclude ephemeral liveness writes and touch on meaningful changes/coarse intervals; depend on actual phase fields rather than the whole room object. Removes one room change delivery and often one phase broadcast per player update, roughly 100 messages per update at 50 players. Coordinate with C3 heartbeat design. |
| H3: Timer sync, DayTribunalPanel/GMRoom/PlayerView | Every second delivers a value to all phones; sixty minutes add ~184k messages. | Broadcast/persist start, pause, reset, completion and deadline; phones count locally. A few transition messages replace thousands of ticks. Requires timer semantics/recovery tests; do not just execute the current per-second database write. |
| H4: Reveal broadcasts and day-picker mirrors, PlayerView/GMRoom/usePlayerActionMirrors | All phones receive role-specific results; open pickers send room-wide heartbeats. | Use existing per-player topics or member-scoped targeted channels and an acknowledged recoverable reveal record. One-target reveal could cost about two messages instead of 51. |
| H5: Explicit sync notification, PlayerView player-sync callback | All phones refetch their private row even if `playerIds` names one changed player; roster events already refetch. | Refresh private rows only for named recipients; coalesce or remove redundant roster sync once delta/recovery logic is reliable. Saves up to fifty private reads per notification. |
| H6: Expiry, cleanup RPC / GM cleanup button | Historical games remain; public invoker cleanup has no effective delete permission. | Owner/admin scheduled cleanup with safe retention and export option. Do not grant broad anonymous rooms DELETE or add an unguarded security-definer RPC. Keeps storage bounded; no monthly request concern at a daily cadence. |
| H7: Readiness, PlayerView markSeen / GM isPlayerConnected | Heartbeat builder does not execute, so readiness becomes stale. | Use coarse authenticated liveness separate from the published game table, or acknowledge existing phone-channel connectivity to the active GM. Rehearse phone sleep/rejoin. Do this with C2/C3/H2 rather than restoring 27k writes/game. |

### NICE TO HAVE

| Change and location | Current behaviour / why it matters | Smallest practical fix / impact |
| --- | --- | --- |
| N1: Page loading, App.tsx | All pages and translations share a ~463 KB gzip main JS bundle. | Lazy-load GM/generator/rulebook routes after measuring cold phone load. Improves initial load; does not reduce Supabase quota. |
| N2: Historical payloads, room game_over_state | Whole log is delivered on room changes after game over. | Once measured logs grow substantially, fetch logs on demand from a separate room-scoped archive. Probably unnecessary at today's row sizes. |
| N3: Join lookup, JoinRoom.joinGame | Downloads every player's token/name to find an existing name. | After server ownership work, a bounded room/name lookup RPC can return only the appropriate identity. Small request-byte reduction; important token handling belongs to C2. |
| N4: Duplicate code index, live indexes | Both unique rooms_code_key and rooms_code_idx index the same column. | Remove redundant index in a reviewed migration when doing database maintenance. Negligible impact at 51 rooms. |

### DO NOT CHANGE

- Static Pages hosting with direct browser-to-Supabase requests: zero game-caused Worker invocations.
- Shared Supabase client: channels share a socket; replacing seventeen channels with seventeen clients would make capacity worse.
- Existing optimized WebP cards/icons and skin fallbacks: images are already small and do not use Supabase Storage.
- Room/code/player indexes and room-filtered normal queries: historical growth does not make a 50-row room lookup a whole-table download.
- Local display tab/storage events and local runtime clock: no database polling is needed for these.
- Bounded room-code retries, unchanged-character comparison, command/session sequence guards, and commit-before-action: preserve these when improving recovery and authority.
- Strictly fair-play UI secrecy: do not spend the main optimization effort hiding every card from frontend inspection; focus server permissions on preventing damage and excess usage.

## 9. Implementation boundary

The requested neutral artwork correction is independent of this audit. Dog-Wolf remains neutral without a known owner's side; Spy/Thief remain neutral on the first night, and their normal good/evil skins apply from their side-selection night. Explicit evil/turned effects and Dog-Wolf's solo objective still choose the corresponding variants.

Only small critical usage/recovery fixes may be implemented after this report. C2 and the larger C3 changes are intentionally left as recommendations because they materially change authorization, persistent-state ownership, or GM coordination. The existing public mutation permissions are not strengthened merely by client traffic fixes, and the verdict on wider sharing remains unchanged until those changes are made.

## 10. Critical fixes implemented after the audit

**C1, implemented:** `usePhoneActions.ts` now deduplicates each phone's view plus acknowledgment. Equivalent world rerenders and unchanged spectators no longer trigger broadcasts. Explicit sync and already-acknowledged retries still force a targeted response so dropped packets cannot strand a phone. Subscriptions clear their publication cache on cleanup.

Idle recovery checks are staggered across phones at approximately 30-35 seconds instead of every 2.5 seconds. Open actions and pending commands retain the original 2.5-second recovery. Pushes still open/update/close actions immediately. Hidden/offline phones skip polling, and focus, visibility restoration, online events, and channel joins request state immediately.

**C4, implemented:** `PlayerView.tsx` uses `maybeSingle` and distinguishes a genuinely missing player from API/network errors. The full state fetch runs on focus, network restoration, visible wake, and own-channel rejoin, with cancellation and one request sequence in flight. Own DELETE events compare the returned player ID before removing the session. This restores current **database-backed** state; it cannot restore legacy broadcasts or game state that was never persisted.

**Deferred:** C2's server membership/authorization and C3's atomic persistence/GM authority changes would materially change the existing admission and coordination model. No schema or production permissions were changed. No high-value/nice-to-have audit recommendation was implemented. In particular, the non-executing database heartbeat, timer persistence, and cleanup permission problem remain documented rather than being enabled in a way that creates traffic or destructive access.

### Revised capacity estimates for the patched code

An entirely idle fifty-phone room with one GM now calculates to approximately **62,000-72,000 sync messages over three hours**, about **92% fewer** than 864,000. This is the reduction to the idle sync path, not a claim of a 92% reduction in total game traffic. Fifty-phone fake-timer tests verify exactly fifty requests and fifty responses during the first 35 seconds after initial subscriptions settle, no polling during the preceding 27.5 seconds, and complete cleanup on unmount. They are simulated component/hook tests, not measured Supabase billing or a physical load test.

For an illustrative game with 300-600 real player mutations, 30-60 minutes of timers, 5-12 phones participating in open action modes for a combined 15-30 minutes, and moderate reveals/day pickers, plan around **0.25-0.5 million messages/game**. Actual timer duration, mutation bursts, modal durations, and full-roster reads remain unknown until rehearsed.

| Scenario, patched code, one active GM per game | Illustrative monthly messages | Remaining concern |
| --- | ---: | --- |
| One game | 0.25-0.5 million | Writes/joins/timer bursts and recovery correctness; lower steady idle usage |
| Five games/month | 1.25-2.5 million | Could fit or exceed two million; measure a representative rehearsal |
| Ten games/month | 2.5-5 million | Likely exceeds monthly Free messages |
| Twenty games/month | 5-10 million | Exceeds monthly messages; egress also needs measurement |
| Two simultaneous fifty-player games | Idle sync around 12 events/sec combined | Timers and active actions can still exceed 100 events/sec; two simultaneous timer broadcasts alone total about 102 |
| Multiple societies | Aggregate traffic of all their games | Monthly usage remains shared; server write isolation is still unsuitable for wider sharing |

The small patches make a supervised rehearsal more reasonable, but I still would not endorse an unrehearsed real fifty-phone game or independent society sharing until the remaining critical ownership/persistence work is addressed. The main quota bottleneck remains Supabase Realtime, especially per-second timer fan-out and shared monthly messages. Cloudflare Worker invocations remain zero under the repository's static deployment.

### Verification

All 265 tests across 36 files passed, including the simulated fifty-phone traffic/cleanup checks, dropped-response retry tests, reconnect/error/deletion handling, and neutral/selected artwork tests. TypeScript and the production build passed. Lint retains the two existing Fast Refresh warnings. This does not replace a representative physical-phone rehearsal or measurement of dashboard usage.
