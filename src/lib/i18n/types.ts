import type { RoleId } from "@/lib/roles";

export type Language = "pt" | "fr";

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
  | "spied_on";

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
  warnAmanteMissing: string;
  warnCapuchinhoWithoutHunter: string;
  warnAmanteWithoutCupido: string;
  warnBruxaPoisonedImmune: string;
  warnLobosPoisoned: string;
  warnChamanPoisoned: string;
  warnChamanUsedAll: string;
  warnAnjoUsedAll: string;
  warnParanoicoUsedAll: string;
  warnCapuchinhoImmune: string;
  warnImmune: string;          // "{name} está imune!"
  infoUsedOnetime: string;     // "{name} usou a Imunidade Única!"
  warn2Namorados: string;
  warn2Inimigos: string;
  warnCupidoPoisoned: string;
  warnLadraoPoisoned: string;
  warnProfetaPoisoned: string;
  warnChamanOnlyDead: string;
  infoCavaleiroPoisoned: string;  // "...{name} foi infetado com Tétano."
  infoCavaleiroDied: string;
  infoCavaleiroExecuted: string;
  infoExecuted: string;           // "{name} foi executado!"
  infoSonambuloPoisoned: string;  // "O Sonâmbulo está envenenado. Hóspede aplicado a {name}."
  infoSalvadorPoisoned: string;
  infoPiromaniacoPoisoned: string;
  infoAnjoPoisoned: string;
  infoParanoicoPoisoned: string;
  infoBornFireWolf: string;       // "{name} (Lobisomem) foi incendiado e morreu!"
  infoPaiAdotivoDied: string;
  infoIrmaoSaved: string;
  okRoubaTumulos: string;
  errRoubaOnlyRedX: string;
  warnRoubaPoisoned: string;
  warnAllSpied: string;
  warnNoLimitedRoles: string;
  warnNoTargets: string;
  okChamanRessurected: string;
  errChamanDragOnlyDead: string;
}

export interface ValidationWarningStrings {
  essentialMissing: string;     // "{label} em falta!"
  fewWerewolves: string;        // "Poucos Lobisomens ({n}/{expected})"
  capuchinhoNeedsHunter: string;
  amanteNeedsCupido: string;
  irmasCount: string;           // "Irmãs precisam de exatamente 2 jogadoras (tem {n})!"
  irmaosCount: string;
  tooManyInimigos: string;
  tooManyNamorados: string;
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
  revealLVTitle: string;
  revealLVSubtitle: string;
  revealMeninaTitle: string;
  revealMeninaSubtitle: string;
  revealFaroleiroTitle: string;
  revealFaroleiroSubtitle: string;
  revealVidenteTitle: string;
  revealVidenteSubtitle: string;
  revealManual: string;
  unknown: string;
  execution: string;
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
  amanteCheckboxLabel: string;
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
