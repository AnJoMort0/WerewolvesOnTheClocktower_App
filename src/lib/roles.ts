import e01Img from "@/assets/display/roles/e01.webp";
import e02Img from "@/assets/display/roles/e02.webp";
import e03Img from "@/assets/display/roles/e03.webp";
import e04Img from "@/assets/display/roles/e04.webp";
import v01Img from "@/assets/display/roles/v01.webp";
import v02Img from "@/assets/display/roles/v02.webp";
import v03Img from "@/assets/display/roles/v03.webp";
import v04Img from "@/assets/display/roles/v04.webp";
import v05Img from "@/assets/display/roles/v05.webp";
import v26Img from "@/assets/display/roles/v26.webp";
import v06Img from "@/assets/display/roles/v06.webp";
import v07Img from "@/assets/display/roles/v07.webp";
import v08Img from "@/assets/display/roles/v08.webp";
import v08bImg from "@/assets/display/roles/v08b.webp";
import v09Img from "@/assets/display/roles/v09.webp";
import v10Img from "@/assets/display/roles/v10.webp";
import v11Img from "@/assets/display/roles/v11.webp";
import v12Img from "@/assets/display/roles/v12.webp";
import v13Img from "@/assets/display/roles/v13.webp";
import v14Img from "@/assets/display/roles/v14.webp";
import v15Img from "@/assets/display/roles/v15.webp";
import v16Img from "@/assets/display/roles/v16.webp";
import v17Img from "@/assets/display/roles/v17.webp";
import v18Img from "@/assets/display/roles/v18.webp";
import v19Img from "@/assets/display/roles/v19.webp";
import v20Img from "@/assets/display/roles/v20.webp";
import v21Img from "@/assets/display/roles/v21.webp";
import v22Img from "@/assets/display/roles/v22.webp";
import v23Img from "@/assets/display/roles/v23.webp";
import v24Img from "@/assets/display/roles/v24.webp";
import v25Img from "@/assets/display/roles/v25.webp";
import l01Img from "@/assets/display/roles/l01.webp";
import l02Img from "@/assets/display/roles/l02.webp";
import l03Img from "@/assets/display/roles/l03.webp";
import l04Img from "@/assets/display/roles/l04.webp";
import l05Img from "@/assets/display/roles/l05.webp";
import l06Img from "@/assets/display/roles/l06.webp";
import m01Img from "@/assets/display/roles/m01.webp";
import m02Img from "@/assets/display/roles/m02.webp";
import m03Img from "@/assets/display/roles/m03.webp";
import m04Img from "@/assets/display/roles/m04.webp";
import m05Img from "@/assets/display/roles/m05.webp";
import m06Img from "@/assets/display/roles/m06.webp";
import s01Img from "@/assets/display/roles/s01.webp";
import s02Img from "@/assets/display/roles/s02.webp";
import f01Img from "@/assets/display/roles/f01.webp";
import f02Img from "@/assets/display/roles/f02.webp";
import a01Img from "@/assets/display/roles/a01.webp";
import a02Img from "@/assets/display/roles/a02.webp";
import a03Img from "@/assets/display/roles/a03.webp";
import a04Img from "@/assets/display/roles/a04.webp";
import a05Img from "@/assets/display/roles/a05.webp";
import a06Img from "@/assets/display/roles/a06.webp";
import as01bImg from "@/assets/display/roles/as01b.webp";

export type RoleCategory = "e" | "v" | "m" | "s" | "f" | "a" | "l";

type RoleDefinition = {
  id: string;
  label: string;
  image: string;
  category: RoleCategory;
  requires?: string;
  groupSize?: number;
};

const ROLE_DEFINITIONS = {
  e01: { id: "e01", label: "Werewolf", image: e01Img, category: "e" },
  e02: { id: "e02", label: "Evil Witch", image: e02Img, category: "e" },
  e03: { id: "e03", label: "Shaman", image: e03Img, category: "e" },
  e04: { id: "e04", label: "Fortune Teller", image: e04Img, category: "e" },
  v01: { id: "v01", label: "Little Girl", image: v01Img, category: "v" },
  v02: { id: "v02", label: "Bear Tamer", image: v02Img, category: "v" },
  v03: { id: "v03", label: "Raven Tamer", image: v03Img, category: "v" },
  v04: { id: "v04", label: "Fox Tamer", image: v04Img, category: "v" },
  v05: { id: "v05", label: "Bunny Tamer", image: v05Img, category: "v" },
  v26: { id: "v26", label: "Monkey Tamer", image: v26Img, category: "v" },
  v06: { id: "v06", label: "Puppeteer", image: v06Img, category: "v" },
  v07: { id: "v07", label: "Rusted Knight", image: v07Img, category: "v" },
  v08: { id: "v08", label: "Hunter", image: v08Img, category: "v" },
  v08b: { id: "v08b", label: "Little Red Riding Hood", image: v08bImg, category: "v", requires: "v08" },
  v09: { id: "v09", label: "Captain", image: v09Img, category: "v" },
  v10: { id: "v10", label: "Paranoid", image: v10Img, category: "v" },
  v11: { id: "v11", label: "Village Elder", image: v11Img, category: "v" },
  v12: { id: "v12", label: "Gypsy", image: v12Img, category: "v" },
  v13: { id: "v13", label: "Judge", image: v13Img, category: "v" },
  v14: { id: "v14", label: "Accuser", image: v14Img, category: "v" },
  v15: { id: "v15", label: "Pyromaniac", image: v15Img, category: "v" },
  v16: { id: "v16", label: "Sleepwalker", image: v16Img, category: "v" },
  v17: { id: "v17", label: "Saviour", image: v17Img, category: "v" },
  v18: { id: "v18", label: "Angel", image: v18Img, category: "v" },
  v19: { id: "v19", label: "Prophet", image: v19Img, category: "v" },
  v20: { id: "v20", label: "Housemaid", image: v20Img, category: "v" },
  v21: { id: "v21", label: "Lamplighter", image: v21Img, category: "v" },
  v22: { id: "v22", label: "Boy", image: v22Img, category: "v" },
  v23: { id: "v23", label: "Spider Tamer", image: v23Img, category: "v" },
  v24: { id: "v24", label: "Vintner", image: v24Img, category: "v" },
  v25: { id: "v25", label: "Priest", image: v25Img, category: "v" },
  m01: { id: "m01", label: "Big Bad Werewolf", image: m01Img, category: "m" },
  m02: { id: "m02", label: "Werewolf Seer", image: m02Img, category: "m" },
  m03: { id: "m03", label: "Vampire Werewolf", image: m03Img, category: "m" },
  m04: { id: "m04", label: "Ankou", image: m04Img, category: "m" },
  m05: { id: "m05", label: "Evil Cupid", image: m05Img, category: "m" },
  m06: { id: "m06", label: "(Were)wolf Tamer", image: m06Img, category: "m" },
  s01: { id: "s01", label: "Cupid", image: s01Img, category: "s" },
  s02: { id: "s02", label: "White Werewolf", image: s02Img, category: "s" },
  f01: { id: "f01", label: "Thief", image: f01Img, category: "f" },
  f02: { id: "f02", label: "Spy", image: f02Img, category: "f" },
  a01: { id: "a01", label: "Drunkard", image: a01Img, category: "a" },
  a02: { id: "a02", label: "Wolf-Dog", image: a02Img, category: "a" },
  a03: { id: "a03", label: "Mime", image: a03Img, category: "a" },
  a04: { id: "a04", label: "Actor", image: a04Img, category: "a" },
  a05: { id: "a05", label: "Grave Robber", image: a05Img, category: "a" },
  a06: { id: "a06", label: "Illusionist", image: a06Img, category: "a" },
  as01b: { id: "as01b", label: "Secret Lover", image: as01bImg, category: "a", requires: "s01" },
  l01: { id: "l01", label: "Ordinary Townsfolk", image: l01Img, category: "l" },
  l02: { id: "l02", label: "Wild Child", image: l02Img, category: "l" },
  l03: { id: "l03", label: "Sisters", image: l03Img, category: "l", groupSize: 2 },
  l04: { id: "l04", label: "Brothers", image: l04Img, category: "l", groupSize: 3 },
  l05: { id: "l05", label: "Astronomer", image: l05Img, category: "l" },
  l06: { id: "l06", label: "Devout Servant", image: l06Img, category: "l" },
} as const satisfies Record<string, RoleDefinition>;

/** Playable role IDs are derived from the registry so a new role is declared only once. */
export type RoleId = keyof typeof ROLE_DEFINITIONS;

export interface RoleDef {
  id: RoleId;
  label: string;
  image: string;
  category: RoleCategory;
  requires?: RoleId;
  groupSize?: number;
}

export const ROLES: Record<RoleId, RoleDef> = ROLE_DEFINITIONS;

export const ALL_ROLE_IDS: RoleId[] = Object.keys(ROLES) as RoleId[];

export function isUniqueRole(id: RoleId): boolean {
  return id !== "e01" && id !== "l01";
}

export const EVIL_ROLES: RoleId[] = ["e01", "e02", "s02", "a06", "m01", "m02", "m03", "m04", "m05"];

export const WEREWOLF_ROLES: RoleId[] = ["e01", "m01", "m02", "m03", "m06", "s02"];

export const HIDDEN_WEREWOLF_ROLES: RoleId[] = ["m06"];

export const DETECTABLE_WEREWOLF_ROLES: RoleId[] = WEREWOLF_ROLES.filter(
  (roleId) => !HIDDEN_WEREWOLF_ROLES.includes(roleId),
);

export function isWerewolfRole(roleId: RoleId): boolean {
  return WEREWOLF_ROLES.includes(roleId);
}

export function isDetectableWerewolfRole(roleId: RoleId): boolean {
  return DETECTABLE_WEREWOLF_ROLES.includes(roleId);
}

export const WEB_IMMUNE_ROLES: RoleId[] = ["v10", "v18", "v22"];

export const MIME_COPY_ROLES: RoleId[] = [
  "e01",  "e02",  "e03",  "e04",  "v01",  "v02",  "v03",  "v04",  "v05", "v26",  "v08",  "v09",  "v10",  "v11",  "v12",  "v15",  "v17",  "v18",  "v20",  "v21",  "v24",  "m01",  "m02",  "f01",  "f02",  "s01",  "a01",  "a02",  "a05",  "a06",  "l06"
];

/** Information characters — randomizer tries to include at least one of these. */
export const INFO_ROLES: RoleId[] = ["v02", "v03", "v04", "v05", "v26", "v06", "v22", "v23", "v25"];

const ESSENTIAL_SINGLES: RoleId[] = ["e02", "e03", "e04"];
const SPECIAL_WEREWOLVES: RoleId[] = ["m01", "m02", "m03", "m06", "s02"];
const VILLAGER_UNIQUE: RoleId[] = [
  "v01", "v02", "v03", "v04", "v05", "v26", "v06", "v07", "v08", "v08b", "v09", "v10", "v11", "v12", "v13", "v14", "v15", "v16", "v17", "v18", "v19", "v20", "v21", "v22", "v23", "v24", "v25"
];
const ADVANCED_ROLES: RoleId[] = ["a01", "a02", "a03", "a04", "a05", "a06", "as01b"];
const OTHER_UNIQUE: RoleId[] = ["m04", "m05", "s01", "f01", "f02"];
const LAME_SINGLES: RoleId[] = ["l02", "l05", "l06"];

/** Alternate deaths: tetanus, Hunter/Soldier revenge, Paranoid assassination,
 * Lovers' suicide, White Wolf's solo kill, and the Servant's sacrifice.
 * Poison and burning suppress powers; they do not directly kill. */
export const EXTRA_DEATH_ROLES: RoleId[] = ["v07", "v08", "v09", "v10", "s01", "s02", "l06"];

/** Keep this shared with the Lamplighter reveal: these powers have finite uses. */
export const LIMITED_USE_ROLES: RoleId[] = ["e03", "v10", "v18", "m01", "s01", "m03", "v13", "v14", "v23"];

/** Roles with no unconditional recurring night line. First-night introductions
 * do not expose them throughout the game; conditional wakeups remain hidden. */
export const NO_UNCONDITIONAL_SCRIPT_ROLES: RoleId[] = [
  "e03", "v01", "v07", "v08", "v08b", "v10", "v12", "v13", "v14", "v15", "v18", "v19", "v20", "v23",
  "m04", "m05", "s01", "l01", "l02", "l03", "l04", "l05", "l06", "a01", "a02", "a05",
];

/** Eligibility depends on the lot already selected, so dependent roles are
 * reconsidered after each draw rather than silently skipped forever. */
export function canRandomlyAssignRole(id: RoleId, roles: readonly RoleId[], playerCount: number): boolean {
  const prerequisite = ROLES[id].requires;
  // Linked cards must have their parent: Red Hood/Hunter and Secret Lover/Cupid.
  if (prerequisite && !roles.includes(prerequisite)) return false;
  // Little Girl needs two distinct extra characters that can explain a death.
  if (id === "v01") return roles.filter((role) => EXTRA_DEATH_ROLES.includes(role)).length >= 2;
  // Puppeteer's false pack identity needs a village of at least twelve.
  if (id === "v06") return playerCount >= 12;
  // Lamplighter needs at least three finite-use powers to inspect.
  if (id === "v21") return roles.filter((role) => LIMITED_USE_ROLES.includes(role)).length >= 3;
  // White Wolf needs at least four wolves, including himself (16+ players).
  if (id === "s02") return getExpectedWerewolfCount(playerCount) >= 4;
  // Spy needs at least two characters whose recurring script does not expose them.
  if (id === "f02") return roles.filter((role) => NO_UNCONDITIONAL_SCRIPT_ROLES.includes(role)).length >= 2;
  // Retain a separate INFO character regardless of the Drunkard's replacement.
  // The replacement pool is unchanged and need not itself be an INFO role.
  if (id === "a01") return roles.some((role) => INFO_ROLES.includes(role));
  return true;
}

export function getExpectedWerewolfCount(playerCount: number): number {
  // 1 werewolf per 4 players; under 12 players, always exactly 2 wolves.
  if (playerCount < 12) return 2;
  return Math.floor(playerCount / 4);
}

function getWerewolfRoles(playerCount: number, preferredRoles: ReadonlySet<RoleId>): RoleId[] {
  const wwCount = getExpectedWerewolfCount(playerCount);
  if (playerCount < 12) {
    return Array.from({ length: wwCount }, () => "e01" as RoleId);
  }

  // Keep at least one ordinary wolf; special wolves are unique and eligible only.
  const eligibleSpecials = SPECIAL_WEREWOLVES.filter((id) => canRandomlyAssignRole(id, [], playerCount));
  const normalCount = Math.max(1, wwCount - eligibleSpecials.length);
  const specialCount = wwCount - normalCount;
  const specialRoles = weightedShuffle(eligibleSpecials, (id) => preferredRoles.has(id) ? 1.25 : 1).slice(0, specialCount);
  const normalRoles = Array.from({ length: normalCount }, () => "e01" as RoleId);
  return [...specialRoles, ...normalRoles];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedShuffle<T>(items: T[], weight: (item: T) => number): T[] {
  // Exponential draws implement weighted sampling without replacement. Positive
  // weights increase odds without reserving a slot or guaranteeing inclusion.
  return items.map((item) => ({ item, priority: -Math.log(1 - Math.random()) / weight(item) }))
    .sort((a, b) => a.priority - b.priority).map(({ item }) => item);
}

export function assignRoles(playerCount: number, advancedEnabled: boolean = false, preferredRoleIds: readonly RoleId[] = []): RoleId[] {
  if (!Number.isInteger(playerCount) || playerCount < 8) throw new RangeError("Random assignment requires at least 8 players.");
  const preferredRoles = new Set(preferredRoleIds);
  const roles: RoleId[] = [];
  // Witch, Shaman, and Fortune Teller anchor every automatically generated game.
  roles.push(...ESSENTIAL_SINGLES);

  roles.push(...getWerewolfRoles(playerCount, preferredRoles));

  const assigned = new Set<RoleId>(roles);

  // Balance: ensure at least one INFO character is in the villager pool.
  // Force-include one random INFO role first (if there's room).
  if (roles.length < playerCount) {
    const shuffledInfo = weightedShuffle(INFO_ROLES.filter((id) => canRandomlyAssignRole(id, roles, playerCount)), (id) => preferredRoles.has(id) ? 1.25 : 1);
    for (const id of shuffledInfo) {
      if (!assigned.has(id)) {
        roles.push(id);
        assigned.add(id);
        break;
      }
    }
  }

  // Mix villagers, flexible/solo/evil support, and enabled advanced characters
  // in one draw. Previously villagers consumed every slot before advanced mode.
  // Simple roles and complete families have a smaller base weight, but remain
  // available in ordinary games (including the seasonal Christmas Brothers).
  const pool: RoleId[] = [...VILLAGER_UNIQUE, ...OTHER_UNIQUE, ...LAME_SINGLES, "l03", "l04", ...(advancedEnabled ? ADVANCED_ROLES : [])];
  const weight = (id: RoleId) => (ADVANCED_ROLES.includes(id) ? 2 : ROLES[id].category === "l" ? 0.6 : 1)
    * (preferredRoles.has(id) ? 1.25 : 1);
  while (roles.length < playerCount) {
    const eligible = pool.filter((id) => !assigned.has(id)
      && roles.length + (ROLES[id].groupSize ?? 1) <= playerCount
      && canRandomlyAssignRole(id, roles, playerCount));
    if (eligible.length === 0) break;
    const id = weightedShuffle(eligible, weight)[0];
    // A group is drawn as one character option, then occupies all of its seats.
    roles.push(...Array.from({ length: ROLES[id].groupSize ?? 1 }, () => id));
    assigned.add(id);
  }

  // Use simple singletons once the eligible main pool is exhausted.
  for (const lameId of LAME_SINGLES) {
    if (roles.length >= playerCount) break;
    if (!assigned.has(lameId)) {
      roles.push(lameId);
      assigned.add(lameId);
    }
  }

  if (roles.length + 2 <= playerCount && !assigned.has("l03")) {
    // Sisters occupy exactly two seats; never generate a partial family.
    roles.push("l03", "l03");
    assigned.add("l03");
  }

  if (roles.length + 3 <= playerCount && !assigned.has("l04")) {
    // Brothers occupy exactly three seats.
    roles.push("l04", "l04", "l04");
    assigned.add("l04");
  }

  while (roles.length < playerCount) {
    // Ordinary Townsfolk may repeat to fill any remaining seats.
    roles.push("l01");
  }

  return shuffle(roles);
}
