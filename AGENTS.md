# Codex instructions — Werewolves on the Clocktower

Applies to this repository. Keep work focused: inspect only the files and documentation relevant to the request; do not read the entire repository or run every test for a trivial edit.

## Project and architecture

This is a private, non-commercial React/TypeScript/Vite hidden-role game companion for one Game Master (GM) and players on phones. The GM manages rooms, roles, night scripts, day/Tribunal phases, timers, actions and private reveals. Preserve the GM-led rules and the narrow player view: players should only be shown information intended for them.

Two multiplayer paths must remain usable:
- **Hosted:** Cloudflare Pages static frontend + Supabase database/Realtime (`src/integrations/supabase`, migrations).
- **Fully offline LAN:** local Node server (`server/lan`, `scripts/lan.mjs`) and prepared app, without Supabase or internet during play. `npm run dev:lan` is **not** offline mode.

See `docs/development.md` for architecture, commands and deployment; `docs/offline-lan.md` for LAN/recovery; `docs/releasing-lan.md` for releases; and `docs/free-tier-audit.md` when changing network traffic, persistence or permissions. The audit is a dated analysis with a section documenting subsequent fixes: verify current code before assuming an issue is still present.

## Where to work

- `src/pages/GMRoom.tsx`, `PlayerView.tsx`, `JoinRoom.tsx`, `Index.tsx`: room and player flows.
- `src/components/game`: game screens, shared dialogs and reveals.
- `src/hooks`: runtime and GM/phone synchronization.
- `src/lib`: rules, role registry, phone action modes, game mechanics and translations.
- `src/lib/roles.ts`: playable role registration; `src/lib/phoneActionModes.ts`: stable phone action identifiers.
- `src/lib/rulebookContent.ts`: rulebook/analog scripts, including its character-adding checklist.
- `src/lib/i18n/{en,pt,fr}.ts`: in-app text and night scripts; preserve English, European Portuguese and French.
- `src/test`: Vitest tests mirroring source paths; `src/test/e2e`: optional browser smoke tests.

## Implementation rules

- Respect the human owner's game design. The ROADMAP describes ideas, **not** approval to choose between alternative mechanics, rebalance roles, or implement every proposed feature. When a choice affects rules, present options and request the owner's decision; proceed with noncontroversial analysis/tests if useful.
- For new playable roles, follow the checklist at the top of `src/lib/rulebookContent.ts`: unique ID, human-provided artwork and optimized asset, registry, all three translations, rulebook order/content, relevant analog and in-app night scripts, action/state implementation and tests. Do not invent artwork. Rulebook-only extra cards must not become playable roles by accident.
- Keep role identities, alignments, limited-use powers, night order, death/resurrection/poisoning effects and win conditions consistent. Preserve the distinction between analog rulebook text and implemented digital interactions; do not claim an action is automated when it is only narrated.
- Preserve phone secrecy and GM approval flows. On synchronization changes, test missed events, reconnection/refresh, phone sleep, duplicate actions, concurrent messages and different GM/player screens. Do not add high-frequency polling/broadcasts or assume one backend's behavior proves the other works.
- Use existing patterns and dependencies where possible; make the smallest maintainable change. Avoid unrelated refactors, new dependencies and speculative abstractions. In UI work, check phone/touch accessibility and keep private reveal dialogs fully opaque.
- No production Supabase writes, migrations pushed to live projects, deployments, published releases, destructive cleanup, git push or merge unless explicitly requested. Never commit secrets, `.env`, saved `.lan` data, or generated `.build` artifacts. Treat `VITE_` variables as public. Do not change original human artwork except when explicitly instructed.

## ROADMAP ownership

`docs/ROADMAP.md` is human-owned. Codex may add notes, reorganize existing material or add entries in ordinary implementation sections when asked. **Never remove existing items or playtest notes without direct owner confirmation.** Only the human owner adds entries to `Human Tests to Do`, `Other changes Outside of the Repo`, and `Future Plans`. Do not silently mark unchecked items completed merely because code or automated tests pass; report evidence and leave owner-controlled playtest decisions intact.

## Scope, verification and handoff

For a clearly scoped task, implement and verify it without an elaborate planning phase. For ambiguous mechanics, cross-cutting architecture, schema/authority changes or risky sync work, inspect first and propose a short phased plan with acceptance criteria before making major changes; Plan Mode is appropriate. When the user asks for planning only, do not edit application code.

Use the least expensive relevant checks, escalating with impact:
- Focused test: `npm test -- src/test/<matching-path>.test.ts[x]`.
- Broad code changes: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` as appropriate.
- Rulebook changes: `npm run rulebook:build`; run `npm run test:rulebook-browser` when supported.
- LAN-sensitive changes: `npm run lan:prepare`, then relevant LAN/browser tests when supported; physical multi-device testing must be reported as **not performed** unless actually performed.
- Artwork added/changed by the owner: `npm run assets:optimize` and include generated display copies.

At completion, briefly report: files changed, actual behavior, tests run with results, tests not run and why, remaining risks, and any human playtests needed. Never claim a test, deployment, physical-device check or bug fix succeeded without evidence.
