export const STATUS_EFFECTS = [
  "soldier",
  "vote_against",
  "vote_double",
  "acquitted",
  "host",
  "immunity_full",
  "prophecy",
  "accused",
  "accused_next",
  "werewolf_turned",
  "enemy",
  "immunity_onetime",
  "lover",
  "immunity_cupid",
  "evil_being",
  "vote_revoked",
  "adoptive_dad",
  "burned",
  "immunity_werewolf",
  "tetanus",
  "webbed",
  "caught",
  "spied_on",
  "dug_up",
  "idol",
  "idol_dog",
  "adoptive_dad_dog",
  "enemy_dog",
  "dug_up_dog",
  "dug_up_mime",
  "owner",
] as const;

export type StatusEffect = typeof STATUS_EFFECTS[number];

const STATUS_EFFECT_SET = new Set<string>(STATUS_EFFECTS);

const LEGACY_STATUS_EFFECT_ALIASES: Record<string, StatusEffect> = {
  soldado: "soldier",
  inocentado: "acquitted",
  anfitrião: "host",
  profecia: "prophecy",
  acusado: "accused",
  acusado_next: "accused_next",
  namorado: "lover",
  incendiado: "burned",
};

export function normalizeStatusEffect(value: unknown): StatusEffect | null {
  if (typeof value !== "string") return null;
  const normalized = LEGACY_STATUS_EFFECT_ALIASES[value] ?? value;
  return STATUS_EFFECT_SET.has(normalized) ? normalized as StatusEffect : null;
}

export function normalizeStatusEffectSet(values: Iterable<unknown> | null | undefined): Set<StatusEffect> {
  const normalized = new Set<StatusEffect>();
  if (!values) return normalized;
  for (const value of values) {
    const effect = normalizeStatusEffect(value);
    if (effect) normalized.add(effect);
  }
  return normalized;
}
