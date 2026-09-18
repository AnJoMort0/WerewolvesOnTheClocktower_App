import { describe, expect, it } from "vitest";
import { getToast, getTranslation, SUPPORTED_LANGUAGES } from "@/lib/i18n";

const languageCodes = SUPPORTED_LANGUAGES.map(({ code }) => code);

describe("i18n keys", () => {
  it.each(languageCodes)("has no blank %s toast messages", (language) => {
    for (const [key, value] of Object.entries(getTranslation(language).ui.toasts)) {
      expect(value, key).toBeTypeOf("string");
      expect(value.trim(), key).not.toBe("");
    }
  });

  it.each(languageCodes)("resolves the poisoned-werewolves warning in %s", (language) => {
    expect(getToast("warnWolvesPoisoned", language).trim()).not.toBe("");
  });

  it.each(languageCodes)("has no blank grouped UI copy in %s", (language) => {
    const ui = getTranslation(language).ui;
    const groupedValues = [
      ui.characterGenerator.title,
      ui.characterGenerator.ready,
      ui.gameLog.title,
      ui.gameLog.gypsyPoisonStolen,
      ui.roomDisplay.title,
      ui.skinPacks.notice.title,
      ui.skinPacks.packs.default,
      ui.rulebookUi.fallbackMessage,
      ui.nightScript.dogHousemaidDistance,
      ui.gmRoom.gameLog,
    ];

    groupedValues.forEach((value) => expect(value.trim()).not.toBe(""));
  });
});
