import { describe, expect, it } from "vitest";
import { getRulebookHtml, RULEBOOK_SUMMARY_ID } from "@/lib/rulebook";

describe("in-app rulebook rendering", () => {
  it("renders the full rulebook from structured local content with styled character rows", () => {
    const html = getRulebookHtml("pt");

    expect(html).toContain(`id="${RULEBOOK_SUMMARY_ID}"`);
    expect(html).toContain('class="role-row faction-evil" id="e01"');
    expect(html).toContain("rule-red");
    expect(html).toContain("x.as01b.1_card.png");
    expect(html).not.toContain("Rulebook_PT.md");
  });

  it("can render a single character entry without the rest of the book", () => {
    const html = getRulebookHtml("fr", "v01");

    expect(html).toContain('id="v01"');
    expect(html).toContain("character-table-single");
    expect(html).not.toContain('id="e01"');
  });
});
