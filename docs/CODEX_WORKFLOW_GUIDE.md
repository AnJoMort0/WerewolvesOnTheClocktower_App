# Codex usage guide for Werewolves on the Clocktower

_Recommended starting policy, checked against OpenAI guidance on 27 October 2026. This is a guide for the project owner, **not** a file Codex needs to ingest on every prompt. Put `AGENTS.md` in the **repository root**; optionally keep this guide locally or under `docs/`._

## The shortest decision rule

1. **Small and fully specified → GPT-6 Luna, Low**, direct implementation.
2. **Contained feature with existing patterns → GPT-6 Luna Medium or GPT-6.1 Terra Medium**, direct implementation. If the first pass struggles, use **GPT-6 Sol / GPT-6.1 Sol Medium**.
3. **Multiple interacting rules, state, or screens → GPT-6.1 Sol Medium**, preferably **Plan Mode first**, then implementation in bounded steps. Use High when interactions are genuinely hard.
4. **Subtle race, security, authoritative state, or stubborn nondeterministic bug → GPT-6.1 Sol High** for investigation, **Astra High** only if lower tiers cannot produce a convincing diagnosis or the design is exceptionally high risk.
5. **Never use Astra by default**, and almost never choose Extra High/Max merely because a task is long. Split it first.

If the picker lacks GPT-6.1 Sol, use **GPT-6 Sol**; if it lacks GPT-6.1 Terra, use **Luna** for narrow edits or **Sol** for medium complexity. Your actual Codex model picker governs availability. These labels refer to **Codex/Work**, not the separate ordinary ChatGPT conversation model picker. `Low`, `Medium`, `High`, `Extra High (xhigh)` and `Max` are not all offered on every model/interface.

## Why this saves the Plus allowance

OpenAI says Codex and ChatGPT Work share the plan's allowance; usage is **not** one fixed message cost. Size of context/diffs, model, reasoning level, cloud vs local execution, follow-up work and speed mode all matter. Check **Settings → Usage** for current remaining allowance and reset times. In OpenAI's 27 October 2026 guidance, **illustrative** Plus local-message ranges per five-hour window are Astra **5–45**, GPT-6.1 Sol **15–160**, GPT-6 Sol **15–150**, and GPT-6 Luna **350–3,000**. Those are *not quotas or guarantees*, and a weekly limit may also apply. Faster/stronger is not automatically cheaper in effective total usage if it needs many retries; choose the lowest tier that reliably completes the job.

- **Low:** mechanical or tightly defined edits, isolated tests, simple investigation.
- **Medium:** normal feature implementation, multiple-file coordination with clear requirements.
- **High:** uncertainty, complex role interactions, synchronization bugs, or architecture trade-offs.
- **Extra High / Max:** rare difficult reasoning after evidence shows High isn't enough; do not use as a routine safety margin.

Official reference: [Work/Codex usage](https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex), [Work/Codex model selection](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex), [reasoning guidance](https://developers.openai.com/api/docs/guides/reasoning), [AGENTS.md and efficient context](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra).

## ROADMAP: choose a model by implementation type

These are **estimated task complexities**, not statements that any feature is already fully specified. For speculative role descriptions, settle the mechanics before coding.

| ROADMAP example / implementation type | Recommended Codex tier + reasoning | Plan Mode? | Efficient scope and verification |
| --- | --- | --- | --- |
| Find out what **“Clear previous rooms”** actually does | **Luna Low** | **No**; request read-only investigation | Trace button → RPC/LAN handler; explain impact before any destructive test. Don't press it against production. |
| **Touch screen compatibility**, diagnosing a specific drag issue | **Luna Medium / Terra Medium** | Only if widespread | Reproduce on the touch test harness (`npm run test:touch-browser`); repair one component; check desktop mouse regression. Real phones still need human confirmation. |
| Fix one translation, a rulebook label, or typo | **Luna Low** | No | Exact string/entry, other language parity as relevant; focused checks only. |
| Register a **Marionnettiste** card once the artwork and decided rules exist | **Luna Medium**, or **Sol Medium** for full gameplay | For full playable role, yes | First handle registry/asset/rulebook; implement phone effects only when approved. Use checklist in `rulebookContent.ts`. |
| Add **Swan Tamer** (counts adjacent evil pairs) | **Sol Medium** | Short plan helpful | Define wraparound seating, groups of 3+, what counts as evil; pure counting helper/tests first, then script/reveal/3 languages. |
| Add **Werewolf cub** (extra kill following execution) | **Sol Medium / High** | **Yes** | Confirm whether kills stack, duration/expiry and no-kill cases. Phase/next-night state, hunt flow and regression tests. |
| Add **Werewolf Herald** (missing role information) | **Sol Medium** | **Yes** | Define which roles qualify and uniqueness/randomness; implement information reveal without exposing role lists elsewhere. |
| Add **Evil Twin** or **Martyr Werewolf** | **Sol High** | **Yes** | Formalize transformation/death/retwinning and victory rules; implement isolated state transitions before UI, with multi-night tests. |
| Add **Teacher** (a character acts twice) | **Sol High**, **Astra Medium/High** if architecture conflicts | **Yes, mandatory** | Catalogue every compatible action, charges, approvals and idempotency; limit first phase to design + test cases. |
| Add **Slanderer** or **Mathematician** (changes/observes other abilities) | **Sol High** for design; **Astra High** if system-wide interaction analysis remains uncertain | **Yes, mandatory** | Map information/effect pipelines and define what counts as abnormal. Do not patch each UI reveal ad hoc. |
| **Gluttonous Werewolf** (deferred 3 deaths) or **Cannibal** (copies executed role) | **Sol High**; selectively Astra High | Yes | Persistence across nights, poison/protection, solo victory, missing targets, replay/reconnect; implement stages with explicit rules. |
| **Dynamic day/Tribunal/night theme** across GM and players | **Sol Medium** for architecture, **Terra/Luna Medium** for per-screen edits | **Yes, short** | Define shared phase design tokens first; then one screen, then others; treat future weather/death reactions as a later feature. |
| **Timers disappear after reload / randomly** | **Sol High**; **Astra High** after disciplined diagnosis fails | **Yes, investigation first** | Reproduce hosted vs LAN separately; trace timer authority, subscriptions, persisted vs local state, refresh/sleep. Fix one verified cause, add regression tests; avoid more 1-second fanout. |
| **Player reconnect across iPhone browser contexts** | **Sol High** | Yes | Compare join/session identity in hosted and LAN, propose bounded recovery without leaking tokens or allowing impersonation. Requires device test. |
| **“Should the Vampire Werewolf be webbed?”** / unbalanced Harlot mechanic | **Luna Medium** for trade-off memo | **Yes, decision only** | Present clear rule options and gameplay consequences; **owner chooses** before code. |
| Supabase **authorization, GM authority, atomic durable state** from audit | **Astra High** for design review; **Sol High** for each approved implementation phase | **Yes, mandatory** | Threat model, schema/migration plan, LAN parity boundaries, rollback, separate test backend, concurrency tests. Never experiment on production. |
| LAN release packaging or CI failures | **Luna Medium** for explicit log fix; **Sol High** for cross-platform failure | Usually no | Use failing job logs and specific script; tests/checksum/smoke test. Publishing tags/releases is separate and owner-controlled. |

### Don't let “simple sounding” gameplay requests fool you

Changing a sentence in the rulebook is cheap. Adding a *playable* role usually is not: it can require the role registry, assets, labels in **EN/PT/FR**, analog and app night scripts, phone action identifiers, GM/player state and tests. A role altering **all other roles** (Teacher, Slanderer, Mathematician) is an architecture task even if its description is one line.

## How to use Planning Mode efficiently

**Skip Plan Mode** for a typo, one localized UI fix, a read-only code trace, or a change with exact scope/acceptance criteria. Do not burn a powerful planning pass on a task that already has a clear implementation.

Use **Plan Mode** when the owner must choose a game rule, when the likely fix spans many modules, when changes alter synchronization/persistence, or when you cannot yet define “done.” Use a **medium/high Sol planning pass** instead of immediately giving Astra an entire ROADMAP section. Ask for a plan that is small enough to implement in separate runs. Native Plan Mode is available in Codex app/CLI/IDE (availability and exact UI vary).

A good two-stage flow:

1. **Plan only (Sol Medium; High for concurrency):** ask Codex to inspect relevant paths, list unresolved owner decisions, propose 2–5 bounded milestones, state acceptance tests and LAN/hosted risks. Explicitly **no code changes**. Reject overengineered plans and settle game-mechanic choices yourself.
2. **Implement one approved milestone (Luna/Terra/Sol as appropriate):** reference the approved plan but restrict edits to that milestone. Ask it to run focused tests, fix failures attributable to the change, and stop without advancing to the next milestone. Preserve a compact written plan or issue for future sessions.
3. **Targeted review:** run tests and ask Luna Medium to compare the diff against acceptance criteria. Escalate to Sol High/Astra only for subtle interaction, security, or data-loss risks, not for boilerplate.
4. **Human physical playtest:** record what really worked on phones, then the owner decides which ROADMAP item can be checked off/removed. Automated green tests are not a substitute.

**Separate “understand and propose” from “edit and deploy.”** One giant prompt containing the full game history, roadmap and all future ideas often generates unnecessary work and costs more to correct. `AGENTS.md` provides persistent guardrails; the per-task prompt should contain **goal, exact scope, non-goals, decision status, evidence and acceptance criteria**, not copied repo docs.

## Ready-to-copy prompts

### A. Tiny task — direct, Luna Low

> In this repository, find the code behind the “Clear previous rooms” button. Read-only investigation: explain what it does in hosted Supabase and offline LAN, which rooms it targets, whether it is destructive, and any known discrepancy. Give file/function references. Do not run cleanup, make changes, or edit the ROADMAP.

### B. Add Swan Tamer — planning, Sol Medium

> Plan only; do not edit files. For the ROADMAP Swan Tamer, inspect the existing role registration, role checks, seating-order helper(s), GM/player reveals, night scripts, localization and tests. List rule questions for the owner (including circle wraparound and what counts as an evil pair), then propose at most 3 implementation milestones with concrete acceptance tests in both LAN and hosted mode. Do not assume unanswered mechanics.

### C. Execute one approved milestone — cheaper model

> Implement **Milestone 1 only** of the approved Swan Tamer plan: a pure adjacency-counting helper and its edge-case tests. Do not add the UI or translations yet. Reuse existing types, use focused Vitest tests, and report exact test results plus the remaining milestones. Do not modify `docs/ROADMAP.md`.

### D. Investigate timer reliability — Sol High Plan Mode

> Investigation and plan only. Player timers disappear after reload or intermittently. Compare the hosted Supabase path and fully offline LAN path; trace who owns timer state, what is broadcast, what survives refresh, and what resynchronizes on reconnect. Reproduce with existing tests when possible. Identify the most likely causes **with evidence**, then propose a minimal staged fix and failure-mode tests. Do not enable high-frequency database writes or change production schema.

### E. Implement timer fix — Sol Medium/High, bounded

> Implement only the approved root-cause fix from the timer plan. Preserve player/GM behavior in both backends, avoid per-second database fanout, and test refresh, late join, pause/resume, zero, and reconnect as applicable. Run focused tests and typecheck; report whether LAN browser/device and hosted testing were actually performed. Do not alter unrelated sync code.

### F. Review an implementation — Luna Medium, escalate only if needed

> Review the current diff against the approved task's acceptance criteria and `AGENTS.md`. Look for regressions in private information, multiple languages, state recovery, LAN/hosted parity and untested edge cases. Report concrete findings with file paths and impact, not stylistic suggestions. Do not change code in this review.

## Additional ways to stretch Plus usage

- **Investigate narrowly first.** Ask for `file:line`, root cause and minimal fix. Don't let a bug hunt become an unsolicited refactor.
- **Hand a weak model an excellent spec.** Spending one Sol planning pass to settle interfaces and acceptance tests can let Luna implement safe pieces; it is not always economical to switch models in the middle of one ambiguous run.
- **Limit context deliberately.** Refer to a roadmap entry and the appropriate documentation rather than pasting seven lengthy files into every prompt. Avoid requiring all documents to be reread on each turn.
- **Use focused verification during iteration.** Run the affected Vitest file first; broader test/typecheck/lint/build for completed multi-file changes. Real LAN and touch/browser tests should match the risk of the change.
- **One bug or coherent milestone per thread.** Start a fresh thread with a short handoff when context becomes dominated by abandoned approaches or irrelevant logs.
- **Don't pay for fake certainty.** Even Astra cannot validate a phone sleeping, iPhone Camera browser context, real LAN routing or production behavior unless those conditions were actually tested.
- **Keep the ROADMAP human-owned.** Codex can make suggestions, but only you decide mechanics, visual art, priorities, and whether playtest items are complete.

## Sources and maintenance

The project-specific examples come from the supplied `docs/ROADMAP.md`, `docs/development.md`, `docs/offline-lan.md`, `docs/releasing-lan.md`, `docs/free-tier-audit.md`, `src/lib/i18n/en.ts`, `src/lib/rulebookContent.ts`, and repository inspection. The free-tier audit explicitly distinguishes its original findings from subsequent fixes, and its capacity estimates are not guarantees. This model advice may age quickly: recheck the Codex picker, **Settings → Usage**, and the OpenAI links above when models or allowances change. No production environment was inspected or modified to prepare this guide.
