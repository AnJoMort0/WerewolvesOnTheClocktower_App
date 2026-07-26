import type { RoleId } from "@/lib/roles";

export type Language = "pt" | "fr" | "en";

export const SUPPORTED_LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export interface ScriptLine {
  text: string;
  requires?: RoleId[];
  conditionKey?: string;
}

/** All status effect IDs known to the app. */
export type EffectKey =
  | "soldado"
  | "vote_against"
  | "vote_double"
  | "inocentado"
  | "hospede"
  | "immunity_full"
  | "profecia"
  | "acusado"
  | "acusado_next"
  | "werewolf_turned"
  | "enemy"
  | "immunity_onetime"
  | "namorado"
  | "immunity_cupid"
  | "evil_being"
  | "vote_revoked"
  | "adoptive_dad"
  | "incendiado"
  | "immunity_werewolf"
  | "tetanus"
  | "webbed"
  | "caught"
  | "spied_on"
  | "dug_up"
  | "idol"
  | "idol_dog"
  | "adoptive_dad_dog"
  | "enemy_dog"
  | "dug_up_dog"
  | "dug_up_mime"
  | "owner";

export type WinKind = "village" | "werewolves" | "lovers" | "whiteWolf" | "secretLover" | "tie";

export interface ToastStrings {
  /** Templates support {name}, {n} */
  errAddPlayer: string;
  errRemovePlayer: string;
  okPlayerRemoved: string;
  okRolesAssigned: string;
  okRolesSent: string;
  okChangesSent: string;
  okNightEnded: string;        // "Noite {n} terminada. Amanheceu!"
  errAllSeated: string;
  errMinPlayers: string;
  warnDuplicateName: string;
  genericError: string;
  warnHunterMissing: string;
  warnSecretLoverMissing: string;
  warnLittleRedWithoutHunter: string;
  warnSecretLoverWithoutCupid: string;
  warnWitchPoisonedImmune: string;
  warnWolvesPoisoned: string;
  warnShamanPoisoned: string;
  warnShamanUsedAll: string;
  warnAngelUsedAll: string;
  warnParanoidUsedAll: string;
  warnLittleRedImmune: string;
  warnImmune: string;          // "{name} está imune!"
  infoUsedOnetime: string;     // "{name} usou a Imunidade Única!"
  warn2Lovers: string;
  warn2Enemies: string;
  warnCupidPoisoned: string;
  warnThiefPoisoned: string;
  warnProphetPoisoned: string;
  warnShamanOnlyDead: string;
  warnDevoutServantPoisoned: string;
  infoKnightPoisoned: string;  // "...{name} foi infetado com Tétano."
  infoKnightDied: string;
  infoKnightExecuted: string;
  infoExecuted: string;           // "{name} foi executado!"
  infoSleepwalkerPoisoned: string;  // "O Sonâmbulo está envenenado. Hóspede aplicado a {name}."
  infoSaviourPoisoned: string;
  infoPiromaniacPoisoned: string;
  infoAngelPoisoned: string;
  infoParanoidPoisoned: string;
  infoVintnerPoisoned: string;
  infoBornFireWolf: string;       // "{name} (Lobisomem) foi incendiado e morreu!"
  infoAdoptiveDadDied: string;
  infoBrothersSaved: string;
  okGraveRobber: string;
  errGraveRobberOnlyRedX: string;
  warnGraveRobberPoisoned: string;
  warnAllSpied: string;
  warnNoLimitedRoles: string;
  warnNoTargets: string;
  okShamanRessurected: string;
  errShamanDragOnlyDead: string;
  okDevoutServantRessurected: string;
  errDevoutServantDragOnlyDead: string;
  okJoinLinkCopied: string;
  okRoomReset: string;
  okRoomEnded: string;
  okCleanupOldRooms: string;
  errRoomAction: string;
  errGraveRobberOnlyGhost: string;
}

export interface ValidationWarningStrings {
  essentialMissing: string;     // "{label} em falta!"
  fewWerewolves: string;        // "Poucos Lobisomens ({n}/{expected})"
  duplicateRole: string;
  littleRedNeedsHunter: string;
  secretLoverNeedsCupid: string;
  sistersCount: string;           // "Irmãs precisam de exatamente 2 jogadoras (tem {n})!"
  brothersCount: string;
  tooManyEnemies: string;
  tooManyLovers: string;
}

export interface WinLabelStrings {
  village: string;
  werewolves: string;
  lovers: string;
  whiteWolf: string;
  secretLover: string;
  tie: string;
}

export interface GameOverStrings {
  victory: string;
  defeat: string;
  winTitle: string;          // "Fim de Jogo"
  winSubtitlePrefix: string; // "Vitória de: "
  confirmEndGame: string;
  endGameQuestion: string;   // "A condição '{label}' foi atingida. Terminar o jogo?"
  accept: string;
  decline: string;
  manualGameOver: string;
  selectWinCondition: string;
  selectTieWinners: string;
  dismiss: string;
}

/** Static translatable UI strings. */
export interface UIStrings {
  appTitle: string;
  appTagline: string;
  byline: string;
  createRoom: string;
  orJoin: string;
  roomCode: string;
  language: string;
  loading: string;
  players: string;
  night: string;
  day: string;
  tribunal: string;
  nightFalls: string;
  scriptOfNight: string;
  endNight: string;
  nextNight: string;
  startTribunal: string;
  firstNight: string;
  secondNightStart: string;
  yourRole: string;
  keepSecret: string;
  showRole: string;
  hideRole: string;
  assassinate: string;
  resurrectPlayer: string;
  changeWeb: string;
  assassinationMode: string;
  resurrectionMode: string;
  webMode: string;
  assassinationChooseTarget: string;
  resurrectionChooseTarget: string;
  webChooseTarget: string;
  assassinationConfirm: string;
  assassinationExit: string;
  assassinationRequestPending: string;
  assassinationRequestError: string;
  gmPlayerActionTitle: string;
  gmV10AssassinationRequest: string;
  gmV18ResurrectionRequest: string;
  gmV23WebRequest: string;
  gmAcceptAction: string;
  gmDenyAction: string;
  sessionEnded: string;
  sessionEndedDesc: string;
  backHome: string;
  waitingGame: string;
  gmAssigning: string;
  diedTonightSingular: string;
  diedTonightPlural: string;
  votesNeeded: string;
  alivePlayers: string;
  dayTimerEnded: string;
  tribunalTimerEnded: string;
  timeUp: string;
  startTimer: string;
  pauseTimer: string;
  resetTimer: string;
  addMinute: string;
  subtractMinute: string;
  completeScriptLine: string;
  revealVampireWolfTitle: string;
  revealVampireWolfSubtitle: string;
  revealLittleGirlTitle: string;
  revealLittleGirlSubtitle: string;
  revealLamplighterTitle: string;
  revealLamplighterSubtitle: string;
  revealFortuneTellerTitle: string;
  revealFortuneTellerSubtitle: string;
  revealManual: string;
  unknown: string;
  execution: string;
  littleGirlSoldier: string;
  littleGirlSuicide: string;
  littleGirlWerewolves: string;
  gameMaster: string;
  playersInRoom: string;
  playersHeader: string;
  rolesAssignmentHeader: string;
  gameInProgress: string;
  gameInProgressDesc: string;
  confirmAndAssign: string;
  sendRolesToPlayers: string;
  confirmChanges: string;
  advancedMode: string;
  devTestPlayers: string;
  waitingForPlayers: string;
  devTestPlayersAdded: string;
  rulebook: string;
  spiderEyeReveal: string;
  spyEyeReveal: string;
  secretLoverCheckboxLabel: string;
  spiderConfused: string;       // "A {Aranha} está confusa." / "L'{Araignée} est confuse."
  shareCodeOrAdd: string;
  allSeated: string;
  showQR: string;
  close: string;
  roomLabel: string;
  yourName: string;
  enter: string;
  roomNotFound: string;
  gameAlreadyStarted: string;
  copyJoinLink: string;
  resetRoom: string;
  resetRoomConfirm: string;
  endRoom: string;
  endRoomConfirm: string;
  cleanupOldRooms: string;
  hideScreen: string;
  showSensitiveScreen: string;
  ready: string;
  connected: string;
  disconnected: string;
  addPlayerPlaceholder: string;
  actionPoison: string;
  actionKill: string;
  actionExecute: string;
  actionIllusion: string;
  actionPermaDeath: string;
  actionResurrect: string;
  removePrefix: string;
  removePoison: string;
  removeIllusion: string;
  /** Status effect labels */
  effectLabels: Record<EffectKey, string>;
  toasts: ToastStrings;
  validations: ValidationWarningStrings;
  winLabels: WinLabelStrings;
  gameOver: GameOverStrings;
  uses: string;             // "Usos:" / "Utilisations :"
  powerExhausted: string;   // "Poder esgotado" / "Pouvoir épuisé"
  keepsPowers: string;      // "Mantém os poderes"
  diedOfTetanus: string;    // "morreu de Tétano." (used in tribunal lines)
  diedSimple: string;       // "morreu."
  has2VotesAgainst: string; // "tem 2 votos contra."
  votesDouble: string;      // "vota a dobrar."
  noVote: string;           // "não tem voto."
  currentObjective: string;
  objectiveLovers: string;
  objectiveEvilBeing: string;
  objectiveWerewolf: string;
  objectiveVillage: string;
  objectiveWhiteWolf: string;
  objectiveSecretLover: string;
  dogCopyLabel: string;
  dogActorChooseIdolNotice: string;
}

export interface ScriptDynamicStrings {
  bearGrowl: string;
  bearSilent: string;
  bearConfused: string;
  crowReveal: string;
  crowConfused: string;
  rabbitHeard: string;
  rabbitNothing: string;
  rabbitConfused: string;
  werewolvesAsleep: string;
  whiteWolfSoloKill: string;
  priestAsleep: string;
}

export interface Translation {
  roleLabels: Record<RoleId, string>;
  scripts: {
    firstNight: ScriptLine[];
    secondNight: ScriptLine[];
    normalNight: ScriptLine[];
  };
  scriptDynamic: ScriptDynamicStrings;
  ui: UIStrings;
}
