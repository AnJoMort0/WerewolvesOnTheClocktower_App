import { describe, expect, it } from "vitest";
import { ALL_ROLE_IDS } from "@/lib/roles";
import { getRulebookHtml, RULEBOOK_SUMMARY_ID } from "@/lib/rulebook";
import { RULEBOOK_CHARACTERS, RULEBOOK_CHARACTER_ORDER, RULEBOOK_TEXT, type RulebookCharacter, type RulebookSectionBlock } from "@/lib/rulebookContent";

describe("in-app rulebook rendering", () => {
  it("renders the full rulebook from structured local content with styled character rows", () => {
    const html = getRulebookHtml("pt");

    expect(html).toContain(`id="${RULEBOOK_SUMMARY_ID}"`);
    expect(html).toContain('class="role-row faction-evil" id="e01"');
    expect(html).toContain("rule-red");
    expect(html).toContain("x.as01b.1_card.webp");
    expect(html).toContain('class="rulebook-night-script-link" href="#rulebook-night-script"');
    expect(html).toContain("Ir para os guiões da noite");
    expect(html).toContain('id="rulebook-night-script"');
    expect(html).toContain('id="normal-v20"');
    expect(html.match(/id="rulebook-night-script"/g)).toHaveLength(1);
    expect(html).toContain('draggable="false"');
    expect(html).toContain('href="#e01" draggable="false"');
    expect(html).toContain('data-rulebook-role-image="a02"');
    expect(html).toContain('data-rulebook-skin-select="a02"');
    expect(html).toContain('data-preview-image="');
    expect(html).not.toContain("Rulebook_PT.md");
  });

  it("can render a single character entry without the rest of the book", () => {
    const html = getRulebookHtml("fr", "v01");

    expect(html).toContain('id="v01"');
    expect(html).toContain("character-table-single");
    expect(html).not.toContain('id="e01"');
  });

  it("keeps every playable role represented in the rulebook order", () => {
    const orderedIds = new Set(RULEBOOK_CHARACTER_ORDER);

    expect(orderedIds.size).toBe(RULEBOOK_CHARACTER_ORDER.length);

    for (const roleId of ALL_ROLE_IDS) {
      expect(RULEBOOK_CHARACTERS).toHaveProperty(roleId);
      expect(orderedIds.has(roleId)).toBe(true);
    }
  });

  it("separates story passages from rules and only offers lore where available", () => {
    const witch = document.createElement("article");
    witch.innerHTML = getRulebookHtml("en", "e02");
    const lore = witch.querySelector<HTMLDetailsElement>("details[data-character-lore]")!;
    expect(lore.open).toBe(false);
    expect(lore.querySelector("summary")).toHaveTextContent("Lore");
    expect(lore.querySelector("button[data-lore-explanation]")).toHaveTextContent("killed a little girl");
    expect(lore.querySelector("button")?.dataset.loreExplanation).toContain("die immediately");
    expect(witch.querySelector(".role-text-cell details")).toBeNull();
    expect(getRulebookHtml("en", "v26")).not.toContain("data-character-lore");
    expect(getRulebookHtml("en")).toContain('class="rulebook-story"');

    const charactersWithLore = (Object.values(RULEBOOK_CHARACTERS) as RulebookCharacter[]).filter((character) => character.lore);
    expect(charactersWithLore).toHaveLength(29);
    for (const character of charactersWithLore) {
      for (const passage of character.lore!) {
        for (const language of ["pt", "fr", "en"] as const) expect(passage.text[language]).toBeTruthy();
      }
    }
  });

  it("supports inline story tags, English lore fallback, and safely escaped explanations", () => {
    const paragraph = { type: "p" as const, text: 'A rule. [lore]An **old** tale.[/lore] Another rule. <script>bad()</script>' };
    const sections = RULEBOOK_TEXT.sections.en as unknown as RulebookSectionBlock[];
    sections.push(paragraph);
    const character = RULEBOOK_CHARACTERS.v26 as RulebookCharacter;
    const originalLore = character.lore;
    character.lore = [{ text: { en: "An English-only story." }, explanation: { en: 'A "quote" <script>bad()</script>' } }];
    try {
      const html = getRulebookHtml("en");
      expect(html).toContain('<span class="rule-lore">An <strong>old</strong> tale.</span> Another rule.');
      expect(html).not.toContain("<script>");
      const card = document.createElement("article");
      card.innerHTML = getRulebookHtml("pt", "v26");
      expect(card.querySelector(".role-lore-body")).toHaveTextContent("An English-only story.");
      expect(card.querySelector<HTMLButtonElement>("button[data-lore-explanation]")?.dataset.loreExplanation).toBe('A "quote" <script>bad()</script>');
      expect(card.querySelector("script")).toBeNull();
    } finally {
      sections.pop();
      character.lore = originalLore;
    }
  });
});
