import { ROLES, type RoleId } from "@/lib/roles";
import type { Language } from "@/lib/i18n";
import {
  getRulebookSkinOptions,
  resolveRulebookRoleImage,
  type RulebookSkinPreviewValue,
  type SkinPackId,
} from "@/lib/skinPacks";
import x01Card from "@/assets/extras/x01_card.png";
import x02Card from "@/assets/extras/x02_card.png";
import x021Card from "@/assets/extras/x021_card.png";
import x03Card from "@/assets/extras/x03_card.png";
import xv09Card from "@/assets/extras/xv09_card.png";
import xs01Card from "@/assets/extras/xs01_card.png";
import xAs01b1Card from "@/assets/extras/x.as01b.1_card.png";
import xAs01b2Card from "@/assets/extras/x.as01b.2_card.png";
import xm05Card from "@/assets/extras/xm05_card.png";
import {
  RULEBOOK_CHARACTERS,
  RULEBOOK_CHARACTER_ORDER,
  RULEBOOK_NIGHT_SCRIPT,
  RULEBOOK_TEXT,
  type RulebookCharacter,
  type RulebookCharacterId,
  type RulebookGroupId,
  type RulebookSectionBlock,
  type RulebookTeam,
} from "@/lib/rulebookContent";

export const RULEBOOK_TOP_ID = "rulebook-top";
export const RULEBOOK_SUMMARY_ID = "rulebook-summary";

export interface RulebookRenderOptions {
  skinPackId?: SkinPackId;
  skinPreviewOverrides?: Partial<Record<RulebookCharacterId, RulebookSkinPreviewValue>>;
}

const FALLBACK_MESSAGE: Record<Language, string> = {
  pt: "Ficha nao encontrada.",
  fr: "Fiche introuvable.",
};

const EXTRA_CARD_IMAGES: Partial<Record<RulebookCharacterId, string>> = {
  x01: x01Card,
  x02: x02Card,
  "x02.1": x021Card,
  x03: x03Card,
  "x.v09": xv09Card,
  "x.s01": xs01Card,
  "x.as01b.1": xAs01b1Card,
  "x.as01b.2": xAs01b2Card,
  "x.m05": xm05Card,
};

const TEAM_FACTION_CLASS: Record<RulebookTeam, string> = {
  villagers: "faction-good",
  evilBeing: "faction-evil",
  solo: "faction-independent",
  flexible: "faction-flex",
  villagersFlex: "faction-shifting",
  extra: "faction-extra",
};

const NIGHT_SCRIPT_LABELS: Record<Language, {
  title: string;
  firstNight: string;
  secondNight: string;
  normalNight: string;
}> = {
  pt: {
    title: "A Noite",
    firstNight: "Primeira Noite",
    secondNight: "Início da Segunda Noite",
    normalNight: "Noite Normal",
  },
  fr: {
    title: "La Nuit",
    firstNight: "Première Nuit",
    secondNight: "Début de la Deuxième Nuit",
    normalNight: "Nuit Normale",
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function renderInline(value: string): string {
  return escapeHtml(value)
    .replace(/&lt;red&gt;([\s\S]*?)&lt;\/red&gt;/g, '<span class="rule-red">$1</span>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /&lt;(https?:\/\/[^&\s]+)&gt;/g,
      (_match, href: string) => `<a href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">${href}</a>`,
    )
    .replace(/\n/g, "<br />");
}

function renderParagraphs(lines: readonly string[]): string {
  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p>${renderInline(line)}</p>`)
    .join("");
}

function renderTextBlock(value: string): string {
  return value
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${renderInline(paragraph)}</p>`)
    .join("");
}

function roleImage(characterId: RulebookCharacterId, options: RulebookRenderOptions = {}): string | undefined {
  const role = ROLES[characterId as RoleId];
  if (role) {
    return resolveRulebookRoleImage(
      role.id,
      options.skinPackId ?? "default",
      options.skinPreviewOverrides?.[characterId] ?? "device",
    ).src;
  }
  return EXTRA_CARD_IMAGES[characterId];
}

function roleAlt(character: RulebookCharacter, lang: Language): string {
  return character.name[lang];
}

function characterIdsForGroup(groupId: RulebookGroupId): RulebookCharacterId[] {
  return RULEBOOK_CHARACTER_ORDER.filter((characterId) => RULEBOOK_CHARACTERS[characterId].group === groupId);
}

function renderSectionBlocks(blocks: readonly RulebookSectionBlock[]): string {
  return blocks.map((block) => renderSectionBlock(block)).join("\n");
}

function renderSectionBlock(block: RulebookSectionBlock): string {
  if (block.type === "p") {
    return renderTextBlock(block.text);
  }

  if (block.type === "note") {
    return `<blockquote>${block.lines.map((line) => `<p>${renderInline(line)}</p>`).join("")}</blockquote>`;
  }

  if (block.type === "list") {
    const tag = block.ordered ? "ol" : "ul";
    return `<${tag}>${block.items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${tag}>`;
  }

  return `<${block.type} id="${escapeAttribute(block.id)}">${renderInline(block.text)}</${block.type}>`;
}

function renderNightScript(lang: Language): string {
  const labels = NIGHT_SCRIPT_LABELS[lang];
  const phases = [
    ["firstNight", labels.firstNight],
    ["secondNight", labels.secondNight],
    ["normalNight", labels.normalNight],
  ] as const;
  return `
    <h2 id="rulebook-night-script">${renderInline(labels.title)}</h2>
    ${phases.map(([phase, label]) => `
      <h3 id="rulebook-${phase}">${renderInline(label)}</h3>
      <ul class="rulebook-night-script-list">
        ${RULEBOOK_NIGHT_SCRIPT[phase]
          .map((line) => `<li id="${escapeAttribute(line.id)}">${renderInline(line.text[lang])}</li>`)
          .join("")}
      </ul>
    `).join("")}
  `;
}

function renderCharacterIndex(lang: Language, options: RulebookRenderOptions = {}): string {
  const groups = RULEBOOK_TEXT.groups
    .map((group) => {
      const characterIds = characterIdsForGroup(group.id);
      if (characterIds.length === 0) return "";

      const links = characterIds
        .map((characterId) => {
          const character = RULEBOOK_CHARACTERS[characterId];
          const image = roleImage(characterId, options);
          const imageHtml = image
            ? `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(roleAlt(character, lang))}" loading="lazy" />`
            : "";

          return `
            <a class="rulebook-index-link ${TEAM_FACTION_CLASS[character.team]}" href="#${escapeAttribute(characterId)}">
              ${imageHtml}
              <span class="rulebook-index-id">${escapeHtml(characterId)}</span>
              <strong>${renderInline(character.name[lang])}</strong>
            </a>
          `;
        })
        .join("");

      return `
        <section class="rulebook-index-group">
          <h3>${renderInline(group.label[lang])}</h3>
          <div class="rulebook-index-grid">${links}</div>
        </section>
      `;
    })
    .join("");

  return `
    <section class="rulebook-character-index" id="${RULEBOOK_SUMMARY_ID}">
      <h2>${renderInline(RULEBOOK_TEXT.quickListTitle[lang])}</h2>
      <p>${renderInline(RULEBOOK_TEXT.quickListIntro[lang])}</p>
      ${groups}
      <div class="rulebook-night-script-jump">
        <a class="rulebook-night-script-link" href="#rulebook-night-script">
          ${renderInline(RULEBOOK_TEXT.nightScriptJump[lang])}
        </a>
      </div>
    </section>
  `;
}

function renderCharacterTables(lang: Language, options: RulebookRenderOptions = {}): string {
  return RULEBOOK_TEXT.groups
    .map((group) => {
      const characters = characterIdsForGroup(group.id).map((characterId) => RULEBOOK_CHARACTERS[characterId]);
      if (characters.length === 0) return "";

      return `
        <section class="rulebook-character-group">
          <h2 class="rulebook-group-heading">${renderInline(group.label[lang])}</h2>
          <table class="character-table">
          <tbody>${characters.map((character) => renderCharacterRow(character, lang, options)).join("")}</tbody>
          </table>
        </section>
      `;
    })
    .join("");
}

function renderCharacterRow(character: RulebookCharacter, lang: Language, options: RulebookRenderOptions = {}): string {
  const image = roleImage(character.id, options);
  const imageHtml = image
    ? `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(roleAlt(character, lang))}" loading="lazy" />${renderSkinPreviewSelect(character.id, lang, options)}`
    : "";
  const detailsHtml = character.details
    .map((detail) => {
      const title = detail.title[lang];
      const description = detail.description[lang];
      return `<p><strong>${renderInline(title)}</strong> ${renderInline(description)}</p>`;
    })
    .join("");
  const objectiveHtml = character.objective
    ? `<p><strong>${lang === "fr" ? "Objectif :" : "Objetivo:"}</strong> ${renderInline(character.objective[lang])}</p>`
    : "";

  return `
    <tr class="role-row ${TEAM_FACTION_CLASS[character.team]}" id="${escapeAttribute(character.id)}">
      <td class="role-image-cell">${imageHtml}</td>
      <td class="role-text-cell">
        <h3 class="role-title">
          <code>${escapeHtml(character.id)}</code>
          ${renderInline(character.name[lang])}
          <span class="role-badge">${renderInline(RULEBOOK_TEXT.teamLabels[character.team][lang])}</span>
        </h3>
        <div class="role-description">
          ${renderParagraphs(character.mainDescription[lang])}
          ${detailsHtml}
          ${objectiveHtml}
        </div>
      </td>
    </tr>
  `;
}

function renderSkinPreviewSelect(characterId: RulebookCharacterId, lang: Language, options: RulebookRenderOptions): string {
  if (!(characterId in ROLES)) return "";
  const roleId = characterId as RoleId;
  const skinOptions = getRulebookSkinOptions(roleId, lang);
  if (skinOptions.length === 0) return "";
  const value = options.skinPreviewOverrides?.[characterId] ?? "device";

  return `
    <label class="rulebook-skin-preview">
      <span>Skin</span>
      <select data-rulebook-skin-select="${escapeAttribute(characterId)}">
        ${skinOptions.map((skinOption) => `
          <option value="${escapeAttribute(skinOption.value)}"${skinOption.value === value ? " selected" : ""}>
            ${renderInline(skinOption.label)}
          </option>
        `).join("")}
      </select>
    </label>
  `;
}

function renderFullRulebook(lang: Language, options: RulebookRenderOptions = {}): string {
  return `
    <h1 id="${RULEBOOK_TOP_ID}">${renderInline(RULEBOOK_TEXT.title[lang])}</h1>
    ${renderCharacterIndex(lang, options)}
    ${renderSectionBlocks(RULEBOOK_TEXT.sections[lang])}
    ${renderCharacterTables(lang, options)}
    ${renderNightScript(lang)}
  `;
}

function renderCharacterRulebook(lang: Language, characterId: RulebookCharacterId, options: RulebookRenderOptions = {}): string {
  const character = RULEBOOK_CHARACTERS[characterId];
  if (!character) {
    return `<p>${FALLBACK_MESSAGE[lang]}</p>`;
  }

  return `
    <table class="character-table character-table-single">
      <tbody>${renderCharacterRow(character, lang, options)}</tbody>
    </table>
  `;
}

export function isRulebookCharacterId(value: string): value is RulebookCharacterId {
  return value in RULEBOOK_CHARACTERS;
}

export function getRulebookHtml(
  lang: Language,
  characterId?: RulebookCharacterId | null,
  options: RulebookRenderOptions = {},
): string {
  return characterId ? renderCharacterRulebook(lang, characterId, options) : renderFullRulebook(lang, options);
}
