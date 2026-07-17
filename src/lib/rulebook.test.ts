import { describe, expect, it } from "vitest";
import { ALL_ROLE_IDS } from "@/lib/roles";
import { getRulebookHtml, RULEBOOK_SUMMARY_ID } from "@/lib/rulebook";
import { RULEBOOK_CHARACTERS, RULEBOOK_CHARACTER_ORDER } from "@/lib/rulebookContent";

describe("in-app rulebook rendering", () => {
  it("renders the full rulebook from structured local content with styled character rows", () => {
    const html = getRulebookHtml("pt");

    expect(html).toContain(`id="${RULEBOOK_SUMMARY_ID}"`);
    expect(html).toContain('class="role-row faction-evil" id="e01"');
    expect(html).toContain("rule-red");
    expect(html).toContain("x.as01b.1_card.png");
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
});
