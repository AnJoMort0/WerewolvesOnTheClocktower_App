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
});
