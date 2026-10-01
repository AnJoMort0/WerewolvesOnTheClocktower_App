import { describe, expect, it } from "vitest";
import { getScripts } from "@/lib/i18n";
import type { ScriptLine } from "@/lib/i18n/types";
import { RULEBOOK_NIGHT_SCRIPT, type RulebookNightPhase } from "@/lib/rulebookContent";

const PHASES = ["firstNight", "secondNight", "normalNight"] as const satisfies readonly RulebookNightPhase[];

function appSignature(lines: ScriptLine[]) {
  return lines.map((line) => line.conditionKey === "soldierDied"
    ? "v09"
    : line.requires?.join(",") ?? "general");
}

function rulebookSignature(phase: RulebookNightPhase) {
  return RULEBOOK_NIGHT_SCRIPT[phase]
    // These are analog bookkeeping reminders. The app resolves them from its
    // day/tribunal state instead of showing an actionable night line.
    .filter((line) => phase !== "normalNight" || (line.refs[0] !== "v18" && line.refs[0] !== "v07"))
    .map((line) => (line.refs as readonly string[]).includes("v08")
      ? "v08"
      : (line.refs as readonly string[]).filter((ref) => ref !== "general").join(",") || "general");
}

describe("night script parity", () => {
  it("keeps the same lines and order in every app language", () => {
    for (const phase of PHASES) {
      expect(appSignature(getScripts("pt")[phase])).toEqual(appSignature(getScripts("en")[phase]));
      expect(appSignature(getScripts("fr")[phase])).toEqual(appSignature(getScripts("en")[phase]));
    }
  });

  it("keeps the app scripts aligned with the rulebook scripts", () => {
    for (const phase of PHASES) {
      expect(appSignature(getScripts("en")[phase]), phase).toEqual(rulebookSignature(phase));
    }
  });
});
