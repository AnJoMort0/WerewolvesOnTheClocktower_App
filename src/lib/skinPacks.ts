import { EVIL_ROLES, ROLES, WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import type { Language } from "@/lib/i18n";

export type SkinPackId = "seasonal" | "default" | "thiercelieux";
export type SeasonalEventId = "carnival" | "christmas" | "easter" | "halloween" | "new_years";
export type FlexibleSkinVariant = "good" | "evil" | "solo";
export type RulebookSkinPreviewValue =
  | "device"
  | "default"
  | "thiercelieux"
  | `seasonal:${SeasonalEventId}`
  | `dynamic:${FlexibleSkinVariant}`;

type RoleImageMap = Partial<Record<RoleId, string>>;
type SeasonalRoleImageMap = Record<SeasonalEventId, RoleImageMap>;
type FlexibleRoleImageMap = Partial<Record<RoleId, Partial<Record<FlexibleSkinVariant, string>>>>;

export interface ResolvedRoleImage {
  src: string;
  source: "default" | "seasonal" | "skinpack" | "dynamic";
  variant?: string;
}

export interface ResolveRoleImageOptions {
  skinPackId?: SkinPackId;
  date?: Date;
  flexible?: {
    objectiveRoleId?: RoleId | null;
    effects?: Iterable<string> | null;
  };
}

export const SKIN_PACK_STORAGE_KEY = "preferred_skin_pack";
export const DEFAULT_GM_SKIN_PACK: SkinPackId = "default";
export const DEFAULT_PLAYER_SKIN_PACK: SkinPackId = "seasonal";

export const SKIN_PACK_ORDER: SkinPackId[] = ["seasonal", "default", "thiercelieux"];

export const SEASONAL_EVENT_ORDER: SeasonalEventId[] = [
  "new_years",
  "christmas",
  "easter",
  "halloween",
  "carnival",
];

const SKIN_PACK_IMAGE_MODULES = import.meta.glob<string>(
  "/src/assets/roles/skin_packs/**/*.png",
  { eager: true, import: "default" },
);

const seasonalImages: SeasonalRoleImageMap = {
  carnival: {},
  christmas: {},
  easter: {},
  halloween: {},
  new_years: {},
};
const thiercelieuxImages: RoleImageMap = {};
const flexibleImages: FlexibleRoleImageMap = {};

for (const [path, src] of Object.entries(SKIN_PACK_IMAGE_MODULES)) {
  const parts = path.split("/");
  const folder = parts.at(-2);
  const filename = parts.at(-1)?.replace(/\.png$/, "") ?? "";
  const separatorIndex = filename.indexOf("_");
  if (!folder || separatorIndex < 0) continue;

  const roleId = filename.slice(0, separatorIndex) as RoleId;
  const variant = filename.slice(separatorIndex + 1);
  if (!ROLES[roleId]) continue;

  if (folder === "thiercelieux") {
    thiercelieuxImages[roleId] = src;
  } else if (folder === "dynamic_flexibles") {
    const flexibleVariant = variant as FlexibleSkinVariant;
    if (flexibleVariant === "good" || flexibleVariant === "evil" || flexibleVariant === "solo") {
      flexibleImages[roleId] = { ...flexibleImages[roleId], [flexibleVariant]: src };
    }
  } else if (isSeasonalEventId(folder)) {
    seasonalImages[folder][roleId] = src;
  }
}

const SKIN_PACK_LABELS: Record<SkinPackId, Record<Language, string>> = {
  seasonal: {
    pt: "Default (com sazonais)",
    fr: "Défaut (saisonnier)",
  },
  default: {
    pt: "Default",
    fr: "Défaut",
  },
  thiercelieux: {
    pt: "Aldeia Velha / Thiercelieux",
    fr: "Thiercelieux",
  },
};

const SEASONAL_LABELS: Record<SeasonalEventId, Record<Language, string>> = {
  carnival: { pt: "Carnaval", fr: "Carnaval" },
  christmas: { pt: "Natal", fr: "Noël" },
  easter: { pt: "Páscoa", fr: "Pâques" },
  halloween: { pt: "Halloween", fr: "Halloween" },
  new_years: { pt: "Ano Novo", fr: "Nouvel An" },
};

const FLEXIBLE_LABELS: Record<FlexibleSkinVariant, Record<Language, string>> = {
  good: { pt: "Flexível: aldeia", fr: "Flexible : village" },
  evil: { pt: "Flexível: mal", fr: "Flexible : mal" },
  solo: { pt: "Flexível: solo", fr: "Flexible : solo" },
};

export function isSkinPackId(value: string | null | undefined): value is SkinPackId {
  return value === "seasonal" || value === "default" || value === "thiercelieux";
}

function isSeasonalEventId(value: string): value is SeasonalEventId {
  return value === "carnival" || value === "christmas" || value === "easter" || value === "halloween" || value === "new_years";
}

export function getSkinPackLabel(skinPackId: SkinPackId, language: Language): string {
  return SKIN_PACK_LABELS[skinPackId][language];
}

export function getSkinPackIcon(skinPackId: SkinPackId): string {
  if (skinPackId === "seasonal") return seasonalImages.halloween.e04 ?? ROLES.e04.image;
  if (skinPackId === "thiercelieux") return thiercelieuxImages.e04 ?? ROLES.e04.image;
  return ROLES.e04.image;
}

export function getDefaultSkinPackForPath(pathname: string): SkinPackId {
  return pathname.startsWith("/gm/") || pathname.startsWith("/host/")
    ? DEFAULT_GM_SKIN_PACK
    : DEFAULT_PLAYER_SKIN_PACK;
}

export function getActiveSeasonalEvents(date: Date = new Date()): SeasonalEventId[] {
  const day = startOfDay(date);
  const year = day.getFullYear();
  const events: SeasonalEventId[] = [];

  if (isNewYearsSeason(day)) events.push("new_years");
  if (isChristmasSeason(day)) events.push("christmas");
  if (isWithinDays(day, new Date(year, 9, 31), 7, 7)) events.push("halloween");
  if (isWithinDays(day, addDays(getEasterSunday(year), -7), 0, 56)) events.push("easter");
  if (isWithinDays(day, addDays(getEasterSunday(year), -47), 7, 7)) events.push("carnival");

  return SEASONAL_EVENT_ORDER.filter((eventId) => events.includes(eventId));
}

export function hasActiveSeasonalSkins(date: Date = new Date()): boolean {
  return getActiveSeasonalEvents(date).some((eventId) => Object.keys(seasonalImages[eventId]).length > 0);
}

export function resolveRoleImage(roleId: RoleId, options: ResolveRoleImageOptions = {}): ResolvedRoleImage {
  const skinPackId = options.skinPackId ?? "default";
  const fallback = ROLES[roleId].image;

  if (skinPackId === "thiercelieux") {
    const image = thiercelieuxImages[roleId];
    return image
      ? { src: image, source: "skinpack", variant: "thiercelieux" }
      : { src: fallback, source: "default" };
  }

  if (skinPackId === "seasonal") {
    for (const eventId of getActiveSeasonalEvents(options.date)) {
      const image = seasonalImages[eventId][roleId];
      if (image) return { src: image, source: "seasonal", variant: eventId };
    }
  }

  const flexibleVariant = resolveFlexibleVariant(roleId, options.flexible);
  if (flexibleVariant) {
    const image = flexibleImages[roleId]?.[flexibleVariant];
    if (image) return { src: image, source: "dynamic", variant: flexibleVariant };
  }

  return { src: fallback, source: "default" };
}

export function resolveRulebookRoleImage(
  roleId: RoleId,
  skinPackId: SkinPackId,
  previewValue: RulebookSkinPreviewValue = "device",
): ResolvedRoleImage {
  if (previewValue === "device") return resolveRoleImage(roleId, { skinPackId });
  if (previewValue === "default") return { src: ROLES[roleId].image, source: "default" };
  if (previewValue === "thiercelieux") {
    return thiercelieuxImages[roleId]
      ? { src: thiercelieuxImages[roleId]!, source: "skinpack", variant: "thiercelieux" }
      : { src: ROLES[roleId].image, source: "default" };
  }
  if (previewValue.startsWith("seasonal:")) {
    const eventId = previewValue.slice("seasonal:".length) as SeasonalEventId;
    return seasonalImages[eventId]?.[roleId]
      ? { src: seasonalImages[eventId][roleId]!, source: "seasonal", variant: eventId }
      : { src: ROLES[roleId].image, source: "default" };
  }
  const flexibleVariant = previewValue.slice("dynamic:".length) as FlexibleSkinVariant;
  return flexibleImages[roleId]?.[flexibleVariant]
    ? { src: flexibleImages[roleId]![flexibleVariant]!, source: "dynamic", variant: flexibleVariant }
    : { src: ROLES[roleId].image, source: "default" };
}

export function getRulebookSkinOptions(
  roleId: RoleId,
  language: Language,
): Array<{ value: RulebookSkinPreviewValue; label: string }> {
  const seasonalOptions = SEASONAL_EVENT_ORDER
    .filter((eventId) => !!seasonalImages[eventId][roleId])
    .map((eventId) => ({
      value: `seasonal:${eventId}` as RulebookSkinPreviewValue,
      label: SEASONAL_LABELS[eventId][language],
    }));
  const flexibleOptions = (Object.keys(flexibleImages[roleId] ?? {}) as FlexibleSkinVariant[])
    .map((variant) => ({
      value: `dynamic:${variant}` as RulebookSkinPreviewValue,
      label: FLEXIBLE_LABELS[variant][language],
    }));
  const hasThiercelieux = !!thiercelieuxImages[roleId];
  const alternatives = [
    ...seasonalOptions,
    ...(hasThiercelieux ? [{ value: "thiercelieux" as RulebookSkinPreviewValue, label: SKIN_PACK_LABELS.thiercelieux[language] }] : []),
    ...flexibleOptions,
  ];

  if (alternatives.length === 0) return [];
  return [
    { value: "device", label: language === "fr" ? "Skin actuelle" : "Skin atual" },
    { value: "default", label: SKIN_PACK_LABELS.default[language] },
    ...alternatives,
  ];
}

function resolveFlexibleVariant(
  roleId: RoleId,
  flexible: ResolveRoleImageOptions["flexible"],
): FlexibleSkinVariant | null {
  if (!flexible || !flexibleImages[roleId]) return null;
  const effects = new Set(flexible?.effects ?? []);
  const objectiveRoleId = flexible?.objectiveRoleId ?? null;
  const isWerewolfObjective = !!objectiveRoleId && WEREWOLF_ROLES.includes(objectiveRoleId);
  const isEvilObjective = !!objectiveRoleId && EVIL_ROLES.includes(objectiveRoleId);

  if (roleId === "a02") {
    if (objectiveRoleId === "s02") return "solo";
    if (isWerewolfObjective || isEvilObjective || effects.has("werewolf_turned") || effects.has("evil_being")) return "evil";
    return "good";
  }

  if (roleId === "f01" || roleId === "f02") {
    return isWerewolfObjective || isEvilObjective || effects.has("werewolf_turned") || effects.has("evil_being")
      ? "evil"
      : "good";
  }

  if (roleId === "l03") {
    return isWerewolfObjective || isEvilObjective || effects.has("werewolf_turned") || effects.has("evil_being")
      ? "evil"
      : null;
  }

  return null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

function isWithinDays(day: Date, center: Date, daysBefore: number, daysAfter: number): boolean {
  return day >= addDays(center, -daysBefore) && day <= addDays(center, daysAfter);
}

function isNewYearsSeason(day: Date): boolean {
  return (day.getMonth() === 11 && day.getDate() >= 25) || (day.getMonth() === 0 && day.getDate() <= 8);
}

function isChristmasSeason(day: Date): boolean {
  if (day.getMonth() === 0 && day.getDate() <= 6) return true;
  if (day.getMonth() !== 11) return false;
  return day >= getAdventStart(day.getFullYear());
}

function getAdventStart(year: number): Date {
  const christmas = new Date(year, 11, 25);
  const lastSundayBeforeChristmas = addDays(christmas, -christmas.getDay());
  return addDays(lastSundayBeforeChristmas, -21);
}

function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}
