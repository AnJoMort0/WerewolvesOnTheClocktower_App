import e01Img from "@/assets/roles/e01.png";
import e02Img from "@/assets/roles/e02.png";
import e03Img from "@/assets/roles/e03.png";
import e04Img from "@/assets/roles/e04.png";
import v01Img from "@/assets/roles/v01.png";
import v02Img from "@/assets/roles/v02.png";
import v03Img from "@/assets/roles/v03.png";
import v04Img from "@/assets/roles/v04.png";
import v05Img from "@/assets/roles/v05.png";
import v06Img from "@/assets/roles/v06.png";
import v07Img from "@/assets/roles/v07.png";
import v08Img from "@/assets/roles/v08.png";
import v08bImg from "@/assets/roles/v08b.png";
import v09Img from "@/assets/roles/v09.png";
import v10Img from "@/assets/roles/v10.png";
import v11Img from "@/assets/roles/v11.png";
import v12Img from "@/assets/roles/v12.png";
import v13Img from "@/assets/roles/v13.png";
import v14Img from "@/assets/roles/v14.png";
import v15Img from "@/assets/roles/v15.png";
import v16Img from "@/assets/roles/v16.png";
import v17Img from "@/assets/roles/v17.png";
import v18Img from "@/assets/roles/v18.png";
import v19Img from "@/assets/roles/v19.png";
import v20Img from "@/assets/roles/v20.png";
import v21Img from "@/assets/roles/v21.png";
import v22Img from "@/assets/roles/v22.png";
import v23Img from "@/assets/roles/v23.png";
import l01Img from "@/assets/roles/l01.png";
import l02Img from "@/assets/roles/l02.png";
import l03Img from "@/assets/roles/l03.png";
import l04Img from "@/assets/roles/l04.png";
import m01Img from "@/assets/roles/m01.png";
import m02Img from "@/assets/roles/m02.png";
import m03Img from "@/assets/roles/m03.png";
import m04Img from "@/assets/roles/m04.png";
import m05Img from "@/assets/roles/m05.png";
import s01Img from "@/assets/roles/s01.png";
import s02Img from "@/assets/roles/s02.png";
import f01Img from "@/assets/roles/f01.png";
import f02Img from "@/assets/roles/f02.png";
import a01Img from "@/assets/roles/a01.png";
import a02Img from "@/assets/roles/a02.png";
import a03Img from "@/assets/roles/a03.png";
import a04Img from "@/assets/roles/a04.png";
import a05Img from "@/assets/roles/a05.png";
import a06Img from "@/assets/roles/a06.png";
import as01bImg from "@/assets/roles/as01b.png";

export type RoleId =
  | "e01" | "e02" | "e03" | "e04"
  | "v01" | "v02" | "v03" | "v04" | "v05" | "v06" | "v07" | "v08" | "v08b" | "v09" | "v10"
  | "v11" | "v12" | "v13" | "v14" | "v15" | "v16" | "v17" | "v18" | "v19" | "v20" | "v21" | "v22" | "v23"
  | "m01" | "m02" | "m03" | "m04" | "m05"
  | "s01" | "s02"
  | "f01" | "f02"
  | "a01" | "a02" | "a03" | "a04" | "a05" | "a06" | "as01b"
  | "l01" | "l02" | "l03" | "l04";

export type RoleCategory = "e" | "v" | "m" | "s" | "f" | "a" | "l";

export interface RoleDef {
  id: RoleId;
  label: string;
  image: string;
  category: RoleCategory;
  requires?: RoleId;
  groupSize?: number;
}

export const ROLES: Record<RoleId, RoleDef> = {
  e01: { id: "e01", label: "Lobisomem", image: e01Img, category: "e" },
  e02: { id: "e02", label: "Bruxa Malvada", image: e02Img, category: "e" },
  e03: { id: "e03", label: "Chaman", image: e03Img, category: "e" },
  e04: { id: "e04", label: "Vidente", image: e04Img, category: "e" },
  v01: { id: "v01", label: "Menina", image: v01Img, category: "v" },
  v02: { id: "v02", label: "Domador do Urso", image: v02Img, category: "v" },
  v03: { id: "v03", label: "Domador do Corvo", image: v03Img, category: "v" },
  v04: { id: "v04", label: "Domador da Raposa", image: v04Img, category: "v" },
  v05: { id: "v05", label: "Domador dos Coelhos", image: v05Img, category: "v" },
  v06: { id: "v06", label: "Marionetista", image: v06Img, category: "v" },
  v07: { id: "v07", label: "Cavaleiro Enferrujado", image: v07Img, category: "v" },
  v08: { id: "v08", label: "Caçador", image: v08Img, category: "v" },
  v08b: { id: "v08b", label: "Capuchinho Vermelho", image: v08bImg, category: "v", requires: "v08" },
  v09: { id: "v09", label: "Capitão", image: v09Img, category: "v" },
  v10: { id: "v10", label: "Paranoico", image: v10Img, category: "v" },
  v11: { id: "v11", label: "Chefe da Aldeia", image: v11Img, category: "v" },
  v12: { id: "v12", label: "Cigana", image: v12Img, category: "v" },
  v13: { id: "v13", label: "Juiz", image: v13Img, category: "v" },
  v14: { id: "v14", label: "Acusador", image: v14Img, category: "v" },
  v15: { id: "v15", label: "Piromaníaco", image: v15Img, category: "v" },
  v16: { id: "v16", label: "Sonâmbulo", image: v16Img, category: "v" },
  v17: { id: "v17", label: "Salvador", image: v17Img, category: "v" },
  v18: { id: "v18", label: "Anjo", image: v18Img, category: "v" },
  v19: { id: "v19", label: "Profeta", image: v19Img, category: "v" },
  v20: { id: "v20", label: "Empregada", image: v20Img, category: "v" },
  v21: { id: "v21", label: "Faroleiro", image: v21Img, category: "v" },
  v22: { id: "v22", label: "Pedro", image: v22Img, category: "v" },
  v23: { id: "v23", label: "Domador da Aranha", image: v23Img, category: "v" },
  m01: { id: "m01", label: "Lobisomem Mau", image: m01Img, category: "m" },
  m02: { id: "m02", label: "Lobisomem Vidente", image: m02Img, category: "m" },
  m03: { id: "m03", label: "Lobisomem Vampiro", image: m03Img, category: "m" },
  m04: { id: "m04", label: "Ankou", image: m04Img, category: "m" },
  m05: { id: "m05", label: "Cupido Malvado", image: m05Img, category: "m" },
  s01: { id: "s01", label: "Cupido", image: s01Img, category: "s" },
  s02: { id: "s02", label: "Lobisomem Branco", image: s02Img, category: "s" },
  f01: { id: "f01", label: "Ladrão", image: f01Img, category: "f" },
  f02: { id: "f02", label: "Espião", image: f02Img, category: "f" },
  a01: { id: "a01", label: "Bêbado", image: a01Img, category: "a" },
  a02: { id: "a02", label: "Cão-Lobo", image: a02Img, category: "a" },
  a03: { id: "a03", label: "Mimo", image: a03Img, category: "a" },
  a04: { id: "a04", label: "Ator", image: a04Img, category: "a" },
  a05: { id: "a05", label: "Rouba-Túmulos", image: a05Img, category: "a" },
  a06: { id: "a06", label: "Ilusionista", image: a06Img, category: "a" },
  as01b: { id: "as01b", label: "Amante Secreto", image: as01bImg, category: "a", requires: "s01" },
  l01: { id: "l01", label: "Aldeão Triste", image: l01Img, category: "l" },
  l02: { id: "l02", label: "Criança Selvagem", image: l02Img, category: "l" },
  l03: { id: "l03", label: "Irmãs", image: l03Img, category: "l", groupSize: 2 },
  l04: { id: "l04", label: "Irmãos", image: l04Img, category: "l", groupSize: 3 },
};

export const ALL_ROLE_IDS: RoleId[] = Object.keys(ROLES) as RoleId[];

export function isUniqueRole(id: RoleId): boolean {
  return id !== "e01" && id !== "l01";
}

export const EVIL_ROLES: RoleId[] = ["e01", "e02", "s02", "a06", "m01", "m02", "m03", "m04", "m05"];

export const WEREWOLF_ROLES: RoleId[] = ["e01", "m01", "m02", "m03", "s02"];

/** Information characters — randomizer tries to include at least one of these. */
export const INFO_ROLES: RoleId[] = ["v02", "v03", "v04", "v05", "v06", "v22", "v23", "f02"];

const ESSENTIAL_SINGLES: RoleId[] = ["e02", "e03", "e04"];
const SPECIAL_WEREWOLVES: RoleId[] = ["m01", "m02", "m03", "s02"];
const VILLAGER_UNIQUE: RoleId[] = [
  "v01", "v02", "v03", "v04", "v05", "v06", "v07", "v08", "v08b", "v09", "v10",
  "v11", "v12", "v13", "v14", "v15", "v16", "v17", "v18", "v19", "v20", "v21", "v22", "v23",
];
const ADVANCED_ROLES: RoleId[] = ["a01", "a02", "a03", "a04", "a05", "a06", "as01b"];
const OTHER_UNIQUE: RoleId[] = ["m04", "m05", "s01", "f01", "f02"];
const LAME_SINGLES: RoleId[] = ["l02"];

function getWerewolfCount(playerCount: number): number {
  // 1 werewolf per 4 players; under 12 players, always exactly 2 wolves.
  if (playerCount < 12) return 2;
  return Math.ceil(playerCount / 4);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function assignRoles(playerCount: number, advancedEnabled: boolean = false): RoleId[] {
  const roles: RoleId[] = [];
  roles.push(...ESSENTIAL_SINGLES);

  const wwCount = getWerewolfCount(playerCount);
  // Balance: <12 players → only plain e01 (no specials)
  if (playerCount < 12) {
    for (let i = 0; i < wwCount; i++) roles.push("e01");
  } else {
    roles.push("e01");
    const remainingWW = wwCount - 1;
    const shuffledSpecialWW = shuffle(SPECIAL_WEREWOLVES);
    let specialUsed = 0;
    for (let i = 0; i < remainingWW; i++) {
      if (specialUsed < shuffledSpecialWW.length) {
        roles.push(shuffledSpecialWW[specialUsed]);
        specialUsed++;
      } else {
        roles.push("e01");
      }
    }
  }

  const assigned = new Set<RoleId>(roles);

  // Balance: ensure at least one INFO character is in the villager pool.
  // Force-include one random INFO role first (if there's room).
  if (roles.length < playerCount) {
    const shuffledInfo = shuffle(INFO_ROLES);
    for (const id of shuffledInfo) {
      if (!assigned.has(id)) {
        roles.push(id);
        assigned.add(id);
        break;
      }
    }
  }

  const shuffledVillagers = shuffle(VILLAGER_UNIQUE);
  for (const id of shuffledVillagers) {
    if (roles.length >= playerCount) break;
    const def = ROLES[id];
    if (def.requires && !assigned.has(def.requires)) continue;
    if (assigned.has(id)) continue;
    roles.push(id);
    assigned.add(id);
  }

  if (advancedEnabled) {
    const shuffledAdvanced = shuffle(ADVANCED_ROLES);
    for (const id of shuffledAdvanced) {
      if (roles.length >= playerCount) break;
      const def = ROLES[id];
      if (def.requires && !assigned.has(def.requires)) continue;
      if (assigned.has(id)) continue;
      roles.push(id);
      assigned.add(id);
    }
  }

  const shuffledOther = shuffle(OTHER_UNIQUE);
  for (const id of shuffledOther) {
    if (roles.length >= playerCount) break;
    if (assigned.has(id)) continue;
    roles.push(id);
    assigned.add(id);
  }

  for (const lameId of LAME_SINGLES) {
    if (roles.length >= playerCount) break;
    if (!assigned.has(lameId)) {
      roles.push(lameId);
      assigned.add(lameId);
    }
  }

  if (roles.length + 2 <= playerCount && !assigned.has("l03")) {
    roles.push("l03", "l03");
    assigned.add("l03");
  }

  if (roles.length + 3 <= playerCount && !assigned.has("l04")) {
    roles.push("l04", "l04", "l04");
    assigned.add("l04");
  }

  while (roles.length < playerCount) {
    roles.push("l01");
  }

  return shuffle(roles);
}
