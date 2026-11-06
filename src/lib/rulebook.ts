import { ROLES, WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import { BEGINNER_CHARACTER_IDS } from "@/lib/beginnerMode";
import { getTranslation, type Language } from "@/lib/i18n";
import {
  getRulebookSkinOptions,
  resolveRulebookRoleImage,
  type RulebookSkinPreviewValue,
  type SkinPackId,
} from "@/lib/skinPacks";
import villagerCard from "@/assets/display/extras/villager_card.webp";
import evilBeingCard from "@/assets/display/extras/evil_being_card.webp";
import werewolfCard from "@/assets/display/extras/werewolf_card.webp";
import travellerCard from "@/assets/display/extras/traveller_card.webp";
import loverCard from "@/assets/display/extras/lover_card.webp";
import traitorCard from "@/assets/display/extras/traitor_card.webp";
import betrayedCard from "@/assets/display/extras/betrayed_card.webp";
import enemyCard from "@/assets/display/extras/enemy_card.webp";
import soldierCard from "@/assets/display/extras/soldier_card.webp";
import {
  RULEBOOK_CHARACTERS,
  RULEBOOK_CHARACTER_TYPES,
  RULEBOOK_CHARACTER_ORDER,
  RULEBOOK_NIGHT_SCRIPT,
  RULEBOOK_TEXT,
  type RulebookCharacter,
  type RulebookCharacterId,
  type RulebookCharacterTypeId,
  type RulebookGroupId,
  type RulebookSectionBlock,
  type RulebookTeam,
} from "@/lib/rulebookContent";

export const RULEBOOK_TOP_ID = "rulebook-top";
export const RULEBOOK_SUMMARY_ID = "rulebook-summary";

export interface RulebookRenderOptions {
  beginnerMode?: boolean;
  skinPackId?: SkinPackId;
  skinPreviewOverrides?: Partial<Record<RulebookCharacterId, RulebookSkinPreviewValue>>;
}

const CHARACTER_TYPE_IMAGES: Record<RulebookCharacterTypeId, string> = {
  villager: villagerCard,
  evilBeing: evilBeingCard,
  werewolf: werewolfCard,
  traveller: travellerCard,
  lover: loverCard,
  traitor: traitorCard,
  betrayed: betrayedCard,
  enemy: enemyCard,
  soldier: soldierCard,
};

const TEAM_FACTION_CLASS: Record<RulebookTeam, string> = {
  villagers: "faction-good",
  evilBeing: "faction-evil",
  solo: "faction-independent",
  flexible: "faction-flex",
  villagersFlex: "faction-shifting",
  traveller: "faction-traveller",
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
    .replace(/\[lore\]([\s\S]*?)(?:\[\/lore\]|$)/g, '<span class="rule-lore">$1</span>')
    .replace(/&lt;red&gt;([\s\S]*?)&lt;\/red&gt;/g, '<span class="rule-red">$1</span>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<![\p{L}\p{N}])_([^_\n]+)_(?![\p{L}\p{N}])/gu, "<em>$1</em>")
    .replace(/(?<![\p{L}\p{N}*])\*([^*\n]+)\*(?![\p{L}\p{N}*])/gu, "<em>$1</em>")
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
  if (value.trim().startsWith("[lore]") && !value.includes("[/lore]")) {
    return `<div class="rulebook-story">${renderTextBlock(value.replace("[lore]", ""))}</div>`;
  }
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
  return undefined;
}

function roleAlt(character: RulebookCharacter, lang: Language): string {
  return character.name[lang];
}

function characterIdsForGroup(groupId: RulebookGroupId, beginnerMode = false): RulebookCharacterId[] {
  return RULEBOOK_CHARACTER_ORDER.filter((characterId) => RULEBOOK_CHARACTERS[characterId].group === groupId
    && (!beginnerMode || BEGINNER_CHARACTER_IDS.has(characterId)));
}

function renderSectionBlocks(blocks: readonly RulebookSectionBlock[]): string {
  return blocks.map((block) => renderSectionBlock(block)).join("\n");
}

function renderCharacterTypes(lang: Language, beginnerMode = false): string {
  const alignmentTypes: RulebookCharacterTypeId[] = beginnerMode
    ? ["villager", "evilBeing", "werewolf"]
    : ["villager", "evilBeing", "werewolf", "traveller"];
  const createdTypes: RulebookCharacterTypeId[] = beginnerMode
    ? ["lover"]
    : ["lover", "traitor", "betrayed", "enemy", "soldier"];
  const renderType = (id: RulebookCharacterTypeId) => {
    const type = RULEBOOK_CHARACTER_TYPES[id];
    return `<article class="rulebook-type" id="character-type-${id}">
      <img src="${escapeAttribute(CHARACTER_TYPE_IMAGES[id])}" alt="" loading="lazy" draggable="false" />
      <div><h4>${renderInline(type.name[lang])}</h4>
        ${renderParagraphs(type.mainDescription[lang])}
        ${type.details.map((detail) => `<p><strong>${renderInline(detail.title[lang])}</strong> ${renderInline(detail.description[lang])}</p>`).join("")}
        ${type.objective ? `<p><strong>${renderInline(getTranslation(lang).ui.rulebookUi.objectiveLabel)}</strong> ${renderInline(type.objective[lang])}</p>` : ""}
      </div>
    </article>`;
  };
  return `<section class="rulebook-character-types" aria-labelledby="character-types">
    <h3 id="character-types">${renderInline(RULEBOOK_TEXT.characterTypes.heading[lang])}</h3>
    <h4>${renderInline(RULEBOOK_TEXT.characterTypes.alignments[lang])}</h4>
    ${alignmentTypes.map(renderType).join("")}
    <h4>${renderInline(RULEBOOK_TEXT.characterTypes.created[lang])}</h4>
    ${createdTypes.map(renderType).join("")}
  </section>`;
}

function renderSectionBlock(block: RulebookSectionBlock): string {
  if (block.type === "p" || block.type === "lore") {
    if (block.type === "lore") return `<div class="rulebook-story">${renderTextBlock(block.text)}</div>`;
    return renderTextBlock(block.text);
  }

  if (block.type === "note") {
    return `<blockquote>${block.lines.map((line) => `<p>${renderInline(line)}</p>`).join("")}</blockquote>`;
  }

  if (block.type === "list") {
    const tag = block.ordered ? "ol" : "ul";
    return `<${tag}>${block.items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${tag}>`;
  }

  if (block.type === "h2" || block.type === "h3" || block.type === "h4") {
    return `<${block.type} id="${escapeAttribute(block.id)}">${renderInline(block.text)}</${block.type}>`;
  }
  return "";
}

function renderNightScript(lang: Language, beginnerMode = false): string {
  const labels = getTranslation(lang).ui.rulebookUi.nightScript;
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
          .filter((line) => !beginnerMode || line.refs.some((ref) => ref === "general" || BEGINNER_CHARACTER_IDS.has(ref)))
          .map((line) => `<li id="${escapeAttribute(line.id)}">${renderInline(line.text[lang])}</li>`)
          .join("")}
      </ul>
    `).join("")}
  `;
}

function renderCharacterIndex(lang: Language, options: RulebookRenderOptions = {}): string {
  const groups = RULEBOOK_TEXT.groups
    .map((group) => {
      const characterIds = characterIdsForGroup(group.id, options.beginnerMode);
      if (characterIds.length === 0) return "";

      const renderLinks = (ids: RulebookCharacterId[]) => ids
        .map((characterId) => {
          const character = RULEBOOK_CHARACTERS[characterId];
          const image = roleImage(characterId, options);
          const imageHtml = image
            ? `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(roleAlt(character, lang))}" loading="lazy" draggable="false" />`
            : "";

          return `
            <a class="rulebook-index-link ${TEAM_FACTION_CLASS[character.team]}" href="#${escapeAttribute(characterId)}" draggable="false">
              ${imageHtml}
              <span class="rulebook-index-id">${escapeHtml(characterId)}</span>
              <strong>${renderInline(character.name[lang])}</strong>
            </a>
          `;
        })
        .join("");

      const links = group.id === "evil"
        ? ([
            ["werewolves", characterIds.filter((id) => id in ROLES && WEREWOLF_ROLES.includes(id as RoleId))],
            ["allies", characterIds.filter((id) => !(id in ROLES && WEREWOLF_ROLES.includes(id as RoleId)))],
          ] as const).map(([subgroup, ids]) => ids.length > 0 ? `
            <div class="rulebook-evil-subgroup">
              <h4>${renderInline(RULEBOOK_TEXT.evilSubgroups[subgroup][lang])}</h4>
              <div class="rulebook-index-grid">${renderLinks([...ids])}</div>
            </div>
          ` : "").join("")
        : `<div class="rulebook-index-grid">${renderLinks(characterIds)}</div>`;

      return `
        <section class="rulebook-index-group">
          <h3>${renderInline(group.label[lang])}</h3>
          ${links}
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
      const characters = characterIdsForGroup(group.id, options.beginnerMode).map((characterId) => RULEBOOK_CHARACTERS[characterId]);
      if (characters.length === 0) return "";

      const rows = group.id === "evil"
        ? ([
            ["werewolves", characters.filter((character) => character.id in ROLES && WEREWOLF_ROLES.includes(character.id as RoleId))],
            ["allies", characters.filter((character) => !(character.id in ROLES && WEREWOLF_ROLES.includes(character.id as RoleId)))],
          ] as const).map(([subgroup, subgroupCharacters]) => subgroupCharacters.length > 0 ? `
            <h3 class="rulebook-evil-subgroup-heading">${renderInline(RULEBOOK_TEXT.evilSubgroups[subgroup][lang])}</h3>
            <div class="character-table">${subgroupCharacters.map((character) => renderCharacterRow(character, lang, options)).join("")}</div>
          ` : "").join("")
        : `<div class="character-table">${characters.map((character) => renderCharacterRow(character, lang, options)).join("")}</div>`;

      return `
        <section class="rulebook-character-group">
          <h2 class="rulebook-group-heading">${renderInline(group.label[lang])}</h2>
          ${rows}
        </section>
      `;
    })
    .join("");
}

function renderCharacterRow(character: RulebookCharacter, lang: Language, options: RulebookRenderOptions = {}): string {
  const image = roleImage(character.id, options);
  const imageHtml = image
    ? `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(roleAlt(character, lang))}" loading="lazy" draggable="false" data-rulebook-role-image="${escapeAttribute(character.id)}" />${renderSkinPreviewSelect(character.id, lang, options)}`
    : "";
  const detailsHtml = character.details
    .map((detail) => {
      const title = detail.title[lang];
      const description = detail.description[lang];
      if (/^\d+\s*[—-]/.test(title) && description.trimStart().startsWith("- ")) {
        const items = description.split("\n").map((line) => `<p>${renderInline(line.trim())}</p>`).join("");
        return `<div class="role-detail-group"><p class="role-detail-heading"><strong>${renderInline(title)}</strong></p><div class="role-detail-items">${items}</div></div>`;
      }
      return `<p><strong>${renderInline(title)}</strong> ${renderInline(description)}</p>`;
    })
    .join("");
  const objectiveHtml = character.objective
    ? `<p class="role-objective"><strong>${renderInline(getTranslation(lang).ui.rulebookUi.objectiveLabel)}</strong> ${renderInline(character.objective[lang])}</p>`
    : "";

  return `
    <article class="role-row ${TEAM_FACTION_CLASS[character.team]}" id="${escapeAttribute(character.id)}">
      <div class="role-image-cell">${imageHtml}</div>
      <div class="role-text-cell">
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
      </div>
      ${renderCharacterMeta(character, lang)}
    </article>
  `;
}

function renderCharacterMeta(character: RulebookCharacter, lang: Language): string {
  const lore = renderCharacterLore(character, lang);
  const origin = renderCharacterOrigin(character, lang);
  if (!lore && !origin) return "";
  return `<div class="role-meta">${lore}${origin}</div>`;
}

function renderCharacterOrigin(character: RulebookCharacter, lang: Language): string {
  const localizedOrigin = character.origin?.[lang];
  if (!localizedOrigin) return "";
  if (typeof localizedOrigin === "string") {
    return `<span class="role-origin">${renderInline(localizedOrigin)}</span>`;
  }

  const inspirations: string[] = [];
  for (let index = 0; index < localizedOrigin.length; index += 1) {
    const item = localizedOrigin[index];
    if (typeof item === "string") {
      const source = localizedOrigin[index + 1];
      if (source && typeof source !== "string") {
        inspirations.push(`${renderInline(item)} (${renderInline(source[lang])})`);
        index += 1;
      } else {
        inspirations.push(renderInline(item));
      }
    } else {
      inspirations.push(renderInline(item[lang]));
    }
  }

  return `<span class="role-origin">${renderInline(RULEBOOK_TEXT.basedOnLabel[lang])}: ${inspirations.join(" / ")}</span>`;
}

function renderCharacterLore(character: RulebookCharacter, lang: Language): string {
  const passages = character.lore?.flatMap((passage) => {
    const text = passage.text[lang] ?? passage.text.en;
    if (!text?.trim()) return [];
    const explanation = passage.explanation?.[lang] ?? passage.explanation?.en;
    const sentence = explanation
      ? `<button type="button" class="rulebook-lore-sentence" data-lore-explanation="${escapeAttribute(explanation)}" aria-haspopup="dialog" aria-expanded="false">${renderInline(text)}</button>`
      : renderInline(text);
    return [`<p>${sentence}</p>`];
  }) ?? [];
  if (passages.length === 0) return "";
  return `<details class="role-lore" data-character-lore="${escapeAttribute(character.id)}">
    <summary>${renderInline(RULEBOOK_TEXT.loreLabel[lang])}<span aria-hidden="true" class="lore-chevron">⌄</span></summary>
    <div class="role-lore-body">${passages.join("")}</div>
  </details>`;
}

function renderSkinPreviewSelect(characterId: RulebookCharacterId, lang: Language, options: RulebookRenderOptions): string {
  if (!(characterId in ROLES)) return "";
  const roleId = characterId as RoleId;
  const skinOptions = getRulebookSkinOptions(roleId, lang, options.skinPackId ?? "default");
  if (skinOptions.length === 0) return "";
  const value = options.skinPreviewOverrides?.[characterId] ?? "device";

  return `
    <label class="rulebook-skin-preview">
      <span>${renderInline(getTranslation(lang).ui.rulebookUi.skinPreviewLabel)}</span>
      <select data-rulebook-skin-select="${escapeAttribute(characterId)}">
        ${skinOptions.map((skinOption) => `
          <option value="${escapeAttribute(skinOption.value)}" data-preview-image="${escapeAttribute(resolveRulebookRoleImage(roleId, options.skinPackId ?? "default", skinOption.value).src)}"${skinOption.value === value ? " selected" : ""}>
            ${renderInline(skinOption.label)}
          </option>
        `).join("")}
      </select>
    </label>
  `;
}

function renderFullRulebook(lang: Language, options: RulebookRenderOptions = {}): string {
  const generalRules = RULEBOOK_TEXT.sections[lang];
  const phaseIndex = generalRules.findIndex((block) => block.type === "h3" && block.id === "phases");
  return `
    <h1 id="${RULEBOOK_TOP_ID}">${renderInline(RULEBOOK_TEXT.title[lang])}</h1>
    ${renderCharacterIndex(lang, options)}
    <section class="rulebook-basics">${renderSectionBlocks(generalRules.slice(0, phaseIndex))}
      ${renderCharacterTypes(lang, options.beginnerMode)}
      ${renderSectionBlocks(generalRules.slice(phaseIndex))}</section>
    ${renderCharacterTables(lang, options)}
    ${renderNightScript(lang, options.beginnerMode)}
  `;
}

function renderCharacterRulebook(lang: Language, characterId: RulebookCharacterId, options: RulebookRenderOptions = {}): string {
  const character = RULEBOOK_CHARACTERS[characterId];
  if (!character) {
    return `<p>${getTranslation(lang).ui.rulebookUi.fallbackMessage}</p>`;
  }

  return `
    <div class="character-table character-table-single">${renderCharacterRow(character, lang, options)}</div>
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
