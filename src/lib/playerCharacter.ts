import { ROLES, type RoleId } from "@/lib/roles";
import { normalizeStatusEffect } from "@/lib/effects";

const METADATA_SEPARATOR = "|";
const OWNER_ROLE_KEY = "owner";
const OWNER_PLAYER_KEY = "ownerPlayer";
const OBJECTIVE_ROLE_KEY = "objectiveRole";
const OBJECTIVE_EFFECTS_KEY = "objectives";
const DOG_ACTOR_COPY_KEY = "dogActorCopy";
const MIME_COPY_KEY = "mimeCopy";

export const OBJECTIVE_EFFECT_IDS = ["lover", "evil_being", "werewolf_turned"] as const;
export type ObjectiveEffectId = typeof OBJECTIVE_EFFECT_IDS[number];

export type PlayerCharacterMetadata = {
  ownerRole: RoleId | null;
  ownerPlayerId: string | null;
  objectiveRole: RoleId | null;
  objectiveEffects: ObjectiveEffectId[];
  dogActorCopiedRole: RoleId | null;
  mimeCopiedRole?: RoleId | null;
};

export function stripPlayerCharacterMetadata(character: string | null | undefined): string | null {
  if (!character) return null;
  return character.split(METADATA_SEPARATOR, 1)[0] || null;
}

export function parsePlayerCharacterMetadata(character: string | null | undefined): PlayerCharacterMetadata {
  const metadata: PlayerCharacterMetadata = {
    ownerRole: null,
    ownerPlayerId: null,
    objectiveRole: null,
    objectiveEffects: [],
    dogActorCopiedRole: null,
  };
  if (!character?.includes(METADATA_SEPARATOR)) return metadata;
  const rawMetadata = character.slice(character.indexOf(METADATA_SEPARATOR) + 1);
  const params = new URLSearchParams(rawMetadata);
  const ownerRole = params.get(OWNER_ROLE_KEY) as RoleId | null;
  if (ownerRole && ROLES[ownerRole]) metadata.ownerRole = ownerRole;
  metadata.ownerPlayerId = params.get(OWNER_PLAYER_KEY);
  const objectiveRole = params.get(OBJECTIVE_ROLE_KEY) as RoleId | null;
  if (objectiveRole && ROLES[objectiveRole]) metadata.objectiveRole = objectiveRole;
  const objectiveEffects = params.get(OBJECTIVE_EFFECTS_KEY)?.split(",") ?? [];
  metadata.objectiveEffects = objectiveEffects
    .map((effect) => normalizeStatusEffect(effect))
    .filter((effect): effect is ObjectiveEffectId => (
      !!effect && OBJECTIVE_EFFECT_IDS.includes(effect as ObjectiveEffectId)
    ));
  const dogActorCopiedRole = params.get(DOG_ACTOR_COPY_KEY) as RoleId | null;
  if (dogActorCopiedRole && ROLES[dogActorCopiedRole]) metadata.dogActorCopiedRole = dogActorCopiedRole;
  const mimeCopiedRole = params.get(MIME_COPY_KEY) as RoleId | null;
  if (mimeCopiedRole && ROLES[mimeCopiedRole]) metadata.mimeCopiedRole = mimeCopiedRole;
  return metadata;
}

export function encodePlayerCharacterMetadata(
  identity: string,
  metadata: Partial<PlayerCharacterMetadata>,
): string {
  const params = new URLSearchParams();
  if (metadata.ownerRole) params.set(OWNER_ROLE_KEY, metadata.ownerRole);
  if (metadata.ownerPlayerId) params.set(OWNER_PLAYER_KEY, metadata.ownerPlayerId);
  if (metadata.objectiveRole) params.set(OBJECTIVE_ROLE_KEY, metadata.objectiveRole);
  if (metadata.dogActorCopiedRole) params.set(DOG_ACTOR_COPY_KEY, metadata.dogActorCopiedRole);
  if (metadata.mimeCopiedRole) params.set(MIME_COPY_KEY, metadata.mimeCopiedRole);
  const objectiveEffects = metadata.objectiveEffects?.filter(
    (effect): effect is ObjectiveEffectId => OBJECTIVE_EFFECT_IDS.includes(effect),
  );
  if (objectiveEffects?.length) params.set(OBJECTIVE_EFFECTS_KEY, [...new Set(objectiveEffects)].join(","));
  const encoded = params.toString();
  return encoded ? `${identity}${METADATA_SEPARATOR}${encoded}` : identity;
}
