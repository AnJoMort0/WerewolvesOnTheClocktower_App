# Offline LAN games

The entire game can run on one computer and the phones connected to its local network. During play, no Supabase, Cloudflare, Google Fonts, account, or internet connection is required. Rooms, players, roles, timers, private information, mirrored action screens, votes, approvals, and game-over messages use the local server. The game rules and GM controls are the same as in the hosted version.

**Opening `index.html` directly does not start a multiplayer game.** Browsers cannot serve that file to other devices or coordinate their actions. Instead, double-click **Start LAN Game.cmd**. It starts a small server and opens the home screen automatically.

## Easiest Windows setup: download, extract, double-click

If available, download **WerewolvesOnTheClocktower-LAN-Windows-x64.zip** from the project's [GitHub releases](https://github.com/AnJoMort0/WerewolvesOnTheClocktower_App/releases), right-click it, choose **Extract All**, and double-click **Start LAN Game.cmd** in the extracted folder. Node is bundled; the host needs no installation or internet after downloading the ZIP. The package targets Windows computers capable of running x64 applications.

If no prepared release is available, use GitHub's **Code → Download ZIP**, extract the whole folder into Documents, and double-click the same launcher with internet connected. It checks the bundled runtime, its cached runtime, then installed Node, accepting Node 20 or 22. If none works, it downloads the version pinned in `.nvmrc` from the official Node.js site, verifies its SHA-256 against the official download list, and extracts it into `.build/runtime` in a source download. No administrator rights or system-wide installation is needed. The first source launch also runs dependency installation and builds the app. Keep the window open until the browser appears; subsequent launches reuse those files offline.

Windows x64 and ARM64 source downloads are supported. A source folder containing a prepared `.build/lan-kit` uses that kit automatically. A prepared release does not install dependencies or rebuild. An interrupted first setup can be retried by launching again while online. The launcher changes PowerShell's execution policy only for its own process.

For player-friendly game instructions, see the [main guide](README.md). The sections below explain optional preparation, networking, and recovery.

## Optional: prepare a portable Windows package yourself

Preparation needs internet to download the development dependencies. It can happen on a different computer from the eventual game host.

1. On a Windows computer, install Node.js **22** from the [official Node.js download page](https://nodejs.org/en/download), using the official Windows installer or extracted Windows ZIP. Keep its bundled `LICENSE` file alongside `node.exe`.
2. Download or clone this repository, then open a terminal in its folder.
3. Run:

   ```sh
   npm ci
   npm run lan:package
   ```

4. The command builds the app and creates **`.build/lan-kit`**. This contains the app, the local server, its launcher, this guide, font licences, and a copy of the Windows Node runtime and its licence. Supabase environment variables are **not needed** for LAN preparation.
5. Copy the **whole `lan-kit` folder** onto the Windows computer that will host the game, for example using a USB drive. You can zip the folder for transport, but **extract it before launching**. The target computer does not need Node, npm, or the repository installed. Use a computer compatible with the architecture of the Node runtime used to prepare the package (normally Windows x64).

The package does not include existing rooms or personal game data. Do not distribute a used kit's `.lan` folder. If `.build/lan-kit` already contains game data, the packaging command stops: move the used kit to a backup location, then prepare a fresh package. Packaging clears the hosted URL and Supabase build configuration, including when your source folder has a usual `.env`. The Windows kit includes the fonts' SIL Open Font Licences and Node's licence. Character artwork retains the project's existing private, non-commercial terms.

On Windows with x64 Node, **`npm run lan:release`** prepares the kit and creates the ready-to-play ZIP plus a SHA-256 file in `.build/release`. Upload those two files as GitHub release assets; players should download that ZIP rather than GitHub's automatically generated source archives. See the [maintainer release instructions](development.md#publishing-the-windows-lan-download) for automatic release builds.

## Every game: launch and join

1. Connect the host computer and all phones to the **same Wi-Fi/router**. A router does not need an internet/WAN connection. A computer hotspot can also work if it lets connected devices reach the host; test your particular hotspot before the event.
2. Double-click **`Start LAN Game.cmd`**. Keep the resulting server window open throughout the game.
3. If Windows Firewall asks, allow Node on your **private network**. A prepared kit uses its own `node.exe`, so an exception for a different Node installation might not cover it.
4. The GM browser opens at **`http://localhost:8080`**. The home screen shows **“Offline LAN · same network”** and a **“Start LAN game”** button (also translated into Portuguese and French).
5. Choose the game language and press **Start LAN game**. Run the lobby and assignment normally.
6. Open the GM's QR/join popup. Its address automatically uses the computer's network IP, for example **`http://192.168.1.25:8080/join?room=ABCDE`**. Players scan it, enter their names, and keep that browser open. Alternatively, they open the **Players** address printed in the server window and enter the room code.
7. Play normally. Keep the host powered, awake, and connected to the network. At the end, press **Ctrl+C** in the server window to save and stop the server.

**Phones must use the network address, never `localhost`.** On a phone, `localhost` means that phone. A room code belongs to the server that created it: a LAN code will not work on the public website, and a hosted code will not work locally.

To verify that the game is truly offline, disconnect the router's internet cable or WAN connection while keeping Wi-Fi running. On phones you can use airplane mode and then re-enable Wi-Fi. The home screen, artwork, rulebook, role distribution, and actions should continue to work. Links to external sites still require internet.

## Host from a second device

The local host computer automatically has GM access when using `localhost`. Phones and other computers get player access by default.

To use a tablet or another computer as the GM screen, open the printed **Players** address. Enter the **GM PIN** from the server window in the home screen's GM field, then press **Enable GM access**. You can now create a LAN game and use its GM screen. The server computer still must stay on.

The PIN changes each time the server starts. After a restart, a remote GM needs to unlock access again. Use **one active GM browser per room**: two simultaneous GMs can overwrite each other's local game decisions and backups.

## Use the repository without making a package

With Node.js 20 or 22 installed, prepare the app once:

```sh
npm ci
npm run lan:prepare
```

Then start each offline session with either the Windows launcher or:

```sh
npm run lan
```

You can also run `node scripts/lan.mjs`. Once `.build/app` exists, the LAN server needs **only Node and the prepared files**; it does not import npm packages at runtime. After changing the application's source, run `npm run lan:prepare` again before playing. The prepared kit never downloads packages or rebuilds on launch. The source launcher prepares missing files on its first online launch; once `.build/app` exists, it reuses it. Prepare a fresh source download before going offline after an app update.

`npm run dev:lan` and `npm run preview:lan` remain development/preview commands for the **hosted Supabase backend**. Use `npm run lan` or the launcher for fully offline play.

On macOS/Linux, the same preparation and `node scripts/lan.mjs` work with Node installed. `npm run lan:package` creates a kit on those systems too, but it does not bundle a non-Windows Node runtime or create a native double-click launcher.

## Choose the right network address or port

The launcher prints all detected IPv4 addresses and prefers a private-network address. Computers with Ethernet, Wi-Fi, VPNs, or virtual-machine adapters can have several, so automatic selection may pick the wrong one.

Stop the server and explicitly choose an address printed by the launcher:

```sh
npm run lan -- --ip 192.168.1.25
```

From a portable kit, use its included runtime:

```sh
.\node.exe scripts/lan.mjs --ip 192.168.1.25
```

This selects the address used in QR codes. If port 8080 is busy:

```sh
npm run lan -- --port 8081
```

The page and QR links then use 8081. `--no-open` suppresses automatic browser opening. Advanced options also accept `LAN_IP`, `LAN_PORT`, and `LAN_DATA_DIR` environment variables, or `--data PATH` for a different game-data directory.

Keep the same IP and port between sessions if you want phones to reuse their browser identity. A router reservation for the host's IP can help. If the address changes, have players join using the new QR and **the same name** to recover their existing seat, including after the game has started.

## Saving, restarting, and backups

- Shared rooms, players, assigned cards, alive state, phase/timer state, pending day actions, and the latest GM broadcasts are saved to **`.lan/games.json`** next to the prepared app. The server creates this folder automatically. Writes replace the file through a temporary file; a malformed existing save makes startup fail rather than silently replacing it.
- The GM's detailed rules state and log continue to use the browser's `localStorage`. In LAN mode, GM snapshots, phone-action snapshots, and game-runtime snapshots are also backed up to the local server every **two seconds** while the GM page is open. Player identity is never copied into these host backups.
- On launch/page reload, an authorised GM restores server backups for game-storage keys missing from that browser. Existing browser state takes priority. Use the same GM browser for the smoothest recovery. A sudden process/power failure can lose the most recent changes since the last backup; this is recovery support, not transactional saving of every UI action.
- After stopping and restarting the server, open the **same GM room URL** from browser history to continue; pressing Start LAN game creates a new room. Save/bookmark the GM URL before playing. GM snapshots expire under the application's existing retention policy; this is intended for short-term recovery, not indefinite archives.
- Phones reconnect automatically when the server is available again. A refresh can recover the current phase, role and action state. The latest reveal is replayed when its channel reconnects; legacy reveal caches are cleared when the phase changes. If a device was asleep during an action, reopen the action from the GM if necessary.
- To make a complete manual backup, **stop the server**, then copy `.lan` somewhere safe. Keep the GM browser profile as well. To move a running game's saved data to another prepared host, copy `.lan` into that kit and use the old room URL on the new host address; a freshly authorised GM browser can restore the backed-up snapshots.
- To reset everything, stop the server and move `.lan` out of the kit. Starting again creates an empty data folder. The GM's existing old-room cleanup button also works locally and leaves active games alone.

Do not edit `games.json` during play. It contains hidden cards, tokens and private GM data. The backup interval saves only the room currently open in an authorised GM game page; leave that page open for reliable saving.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Launcher says the app has not been prepared | Run `npm ci` and `npm run lan:prepare` with internet, or copy/extract the whole prepared kit. |
| Windows says Node is missing | Use the Windows portable kit, or install Node 22. Do not copy only the launcher. |
| Phone cannot open the page | Same network, correct IP and port, server window still open, firewall allows inbound traffic. Disable VPN temporarily if it routes LAN traffic away. |
| The GM computer works but every phone fails | Check router **AP/client isolation** or guest Wi-Fi isolation. Use a private Wi-Fi network that permits devices to talk to each other. |
| QR uses a VPN or virtual-adapter address | Restart using `--ip` with the host's Wi-Fi/Ethernet address. LAN ignores hosted URL overrides so stale cloud settings cannot redirect players. |
| Page asks for Supabase or shows no LAN label | You opened the hosted site, Vite, or the HTML file directly. Use the URL from the LAN launcher's window. |
| Remote GM actions fail after a restart | Reload the local home screen and enter the new GM PIN, then reopen the room URL. |
| Player seems disconnected after locking the phone | Unlock it, return to the game tab, and refresh if necessary. Keep phones from changing to mobile data. |
| Old data fails to load | Stop the server and preserve `.lan` before investigating; restore a known-good backup. Never delete the only copy to “fix” it. |

Local HTTP is used so phones do not need certificates. Browser features requiring HTTPS, especially PWA installation on phones, are unavailable in this mode; the game runs in the normal browser tab. Audio alarms can require a tap first under the browser's autoplay rules. The LAN home screen hides the PWA installation button.

## Scope and network trust

This server is for a **private, trusted local network**. It checks same-origin writes, keeps GM changes behind local-computer access or the GM PIN, and binds phone commands to the player's session/token. It intentionally preserves the hosted app's name-based rejoining and room-readable data model; it does not prevent a technically skilled participant from inspecting hidden role data or impersonating a name. HTTP traffic is not encrypted. Do not port-forward this server, expose it to the public internet, or use it as a public hosted backend.

The server caps rooms at 100 players and incoming JSON bodies at 4 MB; those are protective limits, not a claim that 100 phones have been tested. Before an important game, rehearse with the expected number of devices on the actual router: join everyone, assign/send cards, use Werewolf hunt votes, Monkey Tamer reveals, poison/protection actions, Colossus approval, phase/timer changes, refresh/reconnect, and game over. Automated tests cover the transport and existing game mechanics; they cannot reproduce the radio conditions or sleep behaviour of every phone.

## Implementation notes for maintainers

- `server/lan/server.mjs` implements local `rooms`/`players` queries, cleanup, broadcast relaying, snapshot storage, and static SPA hosting using Node's built-in HTTP/filesystem modules.
- The server embeds LAN configuration in the HTML before the built app's module script, so a missing network configuration request cannot accidentally fall back to the cloud. `src/integrations/supabase/client.ts` chooses the local transport when that configuration exists; otherwise the hosted Supabase client behaves as before. LAN builds need no Supabase credentials.
- `src/integrations/lan/client.ts` implements the database/broadcast subset used by this app. Each browser tab has one shared EventSource stream, with channel filtering in the client. Fetch POSTs send commands; reconnection triggers the existing subscription recovery hooks. The approach uses standard [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).
- Mutations in the LAN adapter execute once even if callers discard their query builder, after synchronous filters have been chained. This ensures the existing fire-and-forget phase, timer, readiness and action-state writes are saved locally. Unchanged updates emit no database event, preventing phase/state feedback loops.
- Concurrent phone day requests merge into the latest server state; players cannot replace another player's request or change GM charge counts. Role legality, poison effects, first-night protection, copying, and GM approval continue to be decided by the existing game code.
- Fonts are bundled using pinned Fontsource packages. Assets and rulebook content are included in the Vite build. LAN API routes bypass the service-worker cache, and LAN does not register a new service worker.
- Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run lan:package` when changing this mode. Integration tests are in `src/test/server`; browser-adapter tests are in `src/test/integrations`.
- After building, `npm run test:lan-browser` runs the real UI in isolated headless Edge browser contexts, blocks external app requests, and checks creation, joining, assignment, private Monkey reveals, recovery, timers and game over. It uses installed Windows Edge by default; set `LAN_BROWSER` to an Edge/Chrome/Chromium executable elsewhere. The optional test uses Node's built-in WebSocket, so use Node 22. Its temporary server/profile/data are removed afterward.
