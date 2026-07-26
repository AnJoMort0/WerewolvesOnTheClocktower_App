import { WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import type { Language } from "@/lib/i18n";
/*
  Rulebook editing and character-adding guide:

  To add a playable character:
  1. Choose a unique id. Existing prefixes are e (essential), v (villager),
     m (evil), s (solo), f (flexible), a (advanced), and l (lame/simple).
  2. Add the card image as src/assets/roles/<id>.png.
  3. In src/lib/roles.ts, import that image and add one ROLE_DEFINITIONS entry.
     RoleId is derived automatically. Add the id to EVIL_ROLES, WEREWOLF_ROLES,
     WEB_IMMUNE_ROLES, or INFO_ROLES only when its rules require that behavior.
     New roles are manually selectable as soon as they are registered. Add them
     to an assignment pool only when they are ready for automatic random games.
  4. Add the Portuguese and French display names to roleLabels in
     src/lib/i18n/pt.ts and src/lib/i18n/fr.ts.
  5. Add the full card to RULEBOOK_CHARACTERS below. Its key and id must match
     the playable id, then add that id to RULEBOOK_CHARACTER_ORDER.
  6. If the character wakes at night, add its printed/analog instructions to
     RULEBOOK_NIGHT_SCRIPT. Add the same playable behavior to the in-app scripts
     in both i18n files only when its game functionality is being implemented.
  7. Add role-specific state or interactions in the relevant game modules and
     cover them with focused tests. Run: npm test, npx tsc --noEmit, npm run lint,
     and npm run build.

  To add a rulebook-only extra card:
  - Use an x-prefixed RulebookCharacterId, add its image import and mapping in
    src/lib/rulebook.ts, then add its card and display order here. Do not add it
    to src/lib/roles.ts unless players can actually be assigned that card.

  Content field notes:
  - Edit RULEBOOK_TEXT.sections for general rulebook text.
  - Use <red>...</red> inside text when a word should render red.
  - The team field controls the in-app rulebook background color.
  - Blank lines inside a section text template string create paragraphs.
  - RULEBOOK_NIGHT_SCRIPT feeds the analog character generator's filtered script.
  - Night-script ids use phase + role id; repeated role lines use .1, .2, etc.
  - Keep night-script wording in RULEBOOK_NIGHT_SCRIPT, not RULEBOOK_TEXT.sections.
*/
export type RulebookCharacterId = RoleId | "x01" | "x02" | "x02.1" | "x03" | "x.v09" | "x.s01" | "x.as01b.1" | "x.as01b.2" | "x.m05";
export type RulebookGroupId = "essential" | "villager" | "evil" | "solo" | "flexible" | "complex" | "lame" | "extra";
export type RulebookTeam = "villagers" | "evilBeing" | "solo" | "flexible" | "villagersFlex" | "extra";
export type LocalizedText = Record<Language, string>;
export type RulebookSectionBlock = {
    type: "h2" | "h3" | "h4";
    id: string;
    text: string;
} | {
    type: "p";
    text: string;
} | {
    type: "note";
    lines: readonly string[];
} | {
    type: "list";
    ordered?: boolean;
    items: readonly string[];
};
export type RulebookNightPhase = "firstNight" | "secondNight" | "normalNight";
export type RulebookScriptRef = "general" | RoleId;
export type RulebookNightScriptLine = {
    id: string;
    refs: RulebookScriptRef[];
    text: LocalizedText;
};
export type RulebookCharacter = {
    id: RulebookCharacterId;
    group: RulebookGroupId;
    team: RulebookTeam;
    name: LocalizedText;
    mainDescription: Record<Language, string[]>;
    details: Array<{
        title: LocalizedText;
        description: LocalizedText;
    }>;
    objective?: LocalizedText;
};
export const RULEBOOK_TEXT = {
    title: { pt: `Lobisomens da Torre Sangrenta`, fr: `Loups-garous de la Tour Sanglante`, en: `Werewolves of the Clocktower` },
    quickListTitle: { pt: `Lista rápida de personagens`, fr: `Liste rapide de personnages`, en: `Quick character list` },
    quickListIntro: { pt: `Usa esta lista como mapa de navegação para saltar diretamente para uma ficha na tabela.`, fr: `Utilises cette liste comme carte de navigation pour sauter directement à une fiche dans le tableau.`, en: `Use this list as a navigation map to jump directly to a character card in the table.` },
    nightScriptJump: { pt: `Ir para os guiões da noite`, fr: `Aller aux scripts de nuit`, en: `Go to the night scripts` },
    singleCardAllCharacters: { pt: `Ver todas as personagens`, fr: `Voir tous les personnages`, en: `View all characters` },
    backToIndex: { pt: `Voltar à lista`, fr: `Retour à la liste`, en: `Back to the list` },
    groups: [
        { id: "essential", label: { pt: `Essenciais`, fr: `Essentiels`, en: `Essential` } },
        { id: "villager", label: { pt: `Aldeões`, fr: `Villageois`, en: `Villagers` } },
        { id: "evil", label: { pt: `Personagens malvados`, fr: `Créatures Maléfiques`, en: `Evil characters` } },
        { id: "solo", label: { pt: `Personagens independentes`, fr: `Personnages indépendants`, en: `Independent characters` } },
        { id: "flexible", label: { pt: `Personagens flexíveis`, fr: `Personnages flexibles`, en: `Flexible characters` } },
        { id: "complex", label: { pt: `Personagens complexos`, fr: `Personnages complexes`, en: `Complex characters` } },
        { id: "lame", label: { pt: `Personagens forretas`, fr: `Personnages nuls`, en: `Simple characters` } },
        { id: "extra", label: { pt: `Extras`, fr: `Extras`, en: `Extras` } }
    ],
    teamLabels: {
        villagers: { pt: `Aldeões`, fr: `Villageois`, en: `Villagers` },
        evilBeing: { pt: `Criaturas Malvadas`, fr: `Créatures Maléfiques`, en: `Evil Beings` },
        solo: { pt: `Solo`, fr: `Solo`, en: `Solo` },
        flexible: { pt: `Flexível`, fr: `Flexible`, en: `Flexible` },
        villagersFlex: { pt: `Aldeões / Flexível`, fr: `Villageois / Flexible`, en: `Villagers / Flexible` },
        extra: { pt: `Extra`, fr: `Extra`, en: `Extra` }
    },
    sections: {
        pt: [
            { type: "h2", id: "base", text: `Base` },
            { type: "h3", id: "contexto", text: `Contexto` },
            { type: "p", text: `A aldeia tem um problema com Criaturas Malvadas: os Lobisomens e os seus Aliados! Os Lobisomens matando todas as noites, os Aldeões têm que executar essas Criaturas Malvadas. Mas como é que os Aldeões vão escolher quem executar?` },
            { type: "h3", id: "decorrer-do-dia", text: `Decorrer do dia` },
            { type: "p", text: `Durante o dia (5 minutos), os jogadores andam livremente pelos diferentes lugares na aldeia (a sala ou o edifício), mas como estão todos a suspeitar uns dos outros, podem dizer qualquer coisa (incluindo revelar ou mentir sobre o seu papel e o que sabe sobre os outros), o objetivo é convencer os outros, criar alianças, planejar assassinatos, etc. No fim do dia (3 minutos) toda a aldeia se encontra no tribunal (centro da sala) para decidir quem irão executar. É importante que todos os jogadores guardem sempre os mesmos lugares!` },
            { type: "h3", id: "tribunal", text: `Tribunal` },
            { type: "p", text: `No tribunal, nenhuma informação específica pode ser divulgada por um jogador que não esteja num processo (podem simplesmente dizer se estão a suspeitar de alguém, não o porquê). Um jogador pode nomear um outro para um interrogatório.` },
            { type: "list", ordered: true, items: [
                    `O jogador que nomeia se posiciona no lugar de Prosecutor, o nomeado se posiciona no lugar do Acusado.`,
                    `O Prosecutor pode então explicar a sua acusação.`,
                    `Em seguida, o Acusado pode se defender.`,
                    `Finalmente, a aldeia pode questionar o Acusado.`,
                    `Uma vez o questionário terminado, a aldeia vota se querem executar o acusado.`,
                    `No mínimo metade da aldeia tem que votar SIM para o acusado ser executado.`,
                ] },
            { type: "note", lines: [
                    `PODE HAVER VÁRIAS NOMEAÇÕES POR DIA.`,
                ] },
            { type: "h3", id: "noite", text: `Noite` },
            { type: "p", text: `Após o tribunal, toda a aldeia vai dormir (fechar os olhos no tribunal). É importante que os jogadores guardem sempre os mesmos lugares! Durante a noite, o Narrador guia toda a aldeia a cumprir as suas funções de personagem.` },
            { type: "h3", id: "fantasmas", text: `Fantasmas` },
            {
                type: "p",
                text: `Há dois tipos de morte: EXECUÇÃO (condenados pela aldeia) ou ASSASSINATO (mortos pelo poder de um personagem).

Quando um jogador é morto durante a noite, só morre mesmo de manhã, ao acordar, assim durante aquela noite podem continuar a usar os seus poderes.

Os jogadores mortos transformam-se em fantasmas, que podem continuar a comunicar com a aldeia durante o dia, mas não podem falar ou votar no tribunal, e perdem qualquer poder que tinham (a não ser que esteja escrito o contrário na ficha de personagem.) Fantasmas guardam o mesmo objetivo que enquanto vivos. Os Fantasmas TAMBÉM DORMEM À NOITE.`,
            },
            { type: "h3", id: "objetivos-de-vitoria", text: `Objetivos de vitória` },
            { type: "list", ordered: false, items: [
                    `**Aldeões:** Matar todos os Lobisomens`,
                    `**Criaturas Malvadas:** Matar todos os Aldeões`,
                    `**Namorados e Cupido:** Os Namorados serem os únicos sobreviventes`,
                    `**Amante Secreto:** Ser o único sobrevivente com um dos Namorados`,
                    `**Lobisomem branco:** Ser o único sobrevivente`,
                ] },
        ],
        fr: [
            { type: "h2", id: "base", text: `Base` },
            { type: "h3", id: "contexte", text: `Contexte` },
            { type: "p", text: `Le village a un problème avec les Créatures Maléfiques : les Loups-garous et leurs Alliés ! Les Loups-garous tuent toutes les nuits, les Villageois doivent donc exécuter ces Créatures Maléfiques. Mais comment les Villageois vont-ils choisir qui exécuter ?` },
            { type: "h3", id: "deroulement-de-la-journee", text: `Déroulement de la journée` },
            { type: "p", text: `Pendant la journée (5 minutes), les joueurs se déplacent librement dans les différents endroits du village (la salle ou le bâtiment), mais comme ils se soupçonnent tous les uns les autres, ils peuvent dire n'importe quoi (y compris révéler ou mentir sur leur rôle et ce qu'ils savent des autres), l'objectif étant de convaincre les autres, de créer des alliances, de planifier des assassinats, etc. À la fin de la journée (3 minutes), tout le village se réunit au tribunal (au centre de la pièce) pour décider qui sera exécuté. Il est important que tous les joueurs gardent toujours les mêmes places !` },
            { type: "h3", id: "tribunal", text: `Tribunal` },
            { type: "p", text: `Au tribunal, aucune information spécifique ne peut être divulguée par un joueur qui n'est pas impliqué dans une procédure (ils peuvent simplement dire s'ils soupçonnent quelqu'un, mais pas pourquoi). Un joueur peut désigner un autre joueur pour être interrogé.` },
            { type: "list", ordered: true, items: [
                    `Le joueur qui désigne prend la place du Procureur, tandis que le joueur désigné prend la place de l'Accusé.`,
                    `Le Procureur peut alors expliquer son accusation.`,
                    `Ensuite, l'Accusé peut se défendre.`,
                    `Enfin, le village peut interroger l'accusé.`,
                    `Une fois l'interrogatoire terminé, le village vote pour décider s'il souhaite exécuter l’accusé.`,
                    `Au moins la moitié du village doit voter OUI pour que l'accusé soit exécuté.`,
                ] },
            { type: "note", lines: [
                    `IL PEUT Y AVOIR PLUSIEURS NOMINATIONS PAR JOUR.`,
                ] },
            { type: "h3", id: "nuit", text: `Nuit` },
            { type: "p", text: `Après le tribunal, tout le village va dormir (fermer les yeux au tribunal). Il est important que les joueurs gardent toujours les mêmes places ! Pendant la nuit, le Meneur guide tout le village pour qu'il remplisse ses fonctions de personnage.` },
            { type: "h3", id: "fantomes", text: `Fantômes` },
            {
                type: "p",
                text: `Il existe deux types de mort : EXÉCUTION (condamnés par le village) ou ASSASSINAT (tués par le pouvoir d'un personnage).

Lorsqu'un joueur est tué pendant la nuit, il ne meurt réellement que le matin, au réveil, et peut donc continuer à utiliser ses pouvoirs pendant la nuit.

Les joueurs morts se transforment en fantômes, qui peuvent continuer à communiquer avec le village pendant la journée, mais ne peuvent ni parler ni voter au tribunal, et perdent tous les pouvoirs qu'ils avaient (sauf indication contraire dans la fiche de personnage). Les fantômes gardent le même objectif que lorsqu'ils étaient vivants. Les fantômes DORMENT ÉGALEMENT LA NUIT.`,
            },
            { type: "h3", id: "objectifs-de-victoire", text: `Objectifs de victoire` },
            { type: "list", ordered: false, items: [
                    `**Villageois :** tuer tous les Loups-garous.`,
                    `**Créatures Maléfiques :** tuer tous les Villageois.`,
                    `**Amoureux et Cupidon :** les amoureux doivent être les seuls survivants.`,
                    `**Amant secret :** être le seul survivant avec l'un des amoureux.`,
                    `**Loup-garou blanc :** être le seul survivant.`,
                ] },
        ],
        en: [
            {
                type: `h2`,
                id: `base`,
                text: `Basics`
            },
            {
                type: `h3`,
                id: `context`,
                text: `Context`
            },
            {
                type: `p`,
                text: `The village has a problem with Evil Beings: the Werewolves and their Allies! The Werewolves kill every night, so the Villagers must execute these Evil Beings. But how will the Villagers decide whom to execute?`
            },
            {
                type: `h3`,
                id: `course-of-the-day`,
                text: `Course of the day`
            },
            {
                type: `p`,
                text: `During the day (5 minutes), players move freely through the different places in the village (the room or building). Because everyone suspects everyone else, players may say anything, including revealing or lying about their role and what they know about others. The goal is to persuade others, create alliances, plan assassinations, and so on. At the end of the day (3 minutes), the whole village gathers at the Tribunal (the center of the room) to decide whom to execute. It is important that every player always keeps the same seat!`
            },
            {
                type: `h3`,
                id: `tribunal`,
                text: `Tribunal`
            },
            {
                type: `p`,
                text: `At the Tribunal, a player who is not involved in a proceeding may not reveal specific information. They may only say whether they suspect someone, not why. A player may nominate another player for questioning.`
            },
            {
                type: `list`,
                ordered: true,
                items: [
                    `The nominating player takes the Prosecutor’s place, while the nominated player takes the Accused’s place.`,
                    `The Prosecutor may then explain the accusation.`,
                    `Next, the Accused may defend themself.`,
                    `Finally, the village may question the Accused.`,
                    `Once the questioning is over, the village votes on whether to execute the Accused.`,
                    `At least half of the village must vote YES for the Accused to be executed.`
                ]
            },
            {
                type: `note`,
                lines: [
                    `THERE MAY BE SEVERAL NOMINATIONS PER DAY.`
                ]
            },
            {
                type: `h3`,
                id: `night`,
                text: `Night`
            },
            {
                type: `p`,
                text: `After the Tribunal, the whole village goes to sleep by closing their eyes in the Tribunal. It is important that players always keep the same seats! During the night, the Narrator guides the whole village through each character’s duties.`
            },
            {
                type: `h3`,
                id: `ghosts`,
                text: `Ghosts`
            },
            {
                type: `p`,
                text: `There are two kinds of death: EXECUTION (condemned by the village) and ASSASSINATION (killed by a character’s power).

When a player is killed during the night, they do not truly die until morning, when the village wakes up. They may therefore continue using their powers during that night.

Dead players become Ghosts. They may continue communicating with the village during the day, but they may not speak or vote at the Tribunal and they lose every power they had, unless their character card says otherwise. Ghosts keep the same objective they had while alive. GHOSTS ALSO SLEEP AT NIGHT.`
            },
            {
                type: `h3`,
                id: `victory-objectives`,
                text: `Victory objectives`
            },
            {
                type: `list`,
                ordered: false,
                items: [
                    `**Villagers:** Kill all Werewolves`,
                    `**Evil Beings:** Kill all Villagers`,
                    `**Lovers and Cupid:** The Lovers must be the only survivors`,
                    `**Secret Lover:** Be the only survivor together with one of the Lovers`,
                    `**White Werewolf:** Be the only survivor`
                ]
            }
        ]
    }
} as const;
export const RULEBOOK_CHARACTERS = {
    "e01": {
        id: "e01",
        group: "essential",
        team: "evilBeing",
        name: {
            pt: `Lobisomem`,
            fr: `Loup-garou`,
            en: `Werewolf`
        },
        mainDescription: {
            pt: [
                `<red>Cada noite</red>, escolhe com os outros Lobisomens quem vão assassinar.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, il choisit, avec les autres Loups-garous, qui ils assassineront.`,
            ],
            en: [
                `<red>Each night</red>, chooses with the other Werewolves whom they will assassinate.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se qualquer Lobisomem estiver envenenado:`,
                    fr: `Si n’importe quel Loup-garou est empoisonné :`,
                    en: `If any Werewolf is poisoned:`
                },
                description: {
                    pt: `Não podem matar.`,
                    fr: `Ils ne peuvent pas tuer.`,
                    en: `They cannot kill.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Aldeões.`,
            fr: `Tuer tous les Villageois.`,
            en: `Kill all Villagers.`
        }
    },
    "e02": {
        id: "e02",
        group: "essential",
        team: "evilBeing",
        name: {
            pt: `Bruxa Malvada`,
            fr: `Méchante Sorcière`,
            en: `Evil Witch`
        },
        mainDescription: {
            pt: [
                `<red>NÃO</red> ACORDA COM OS LOBISOMENS.`,
                `<red>Cada noite</red>, a Bruxa pode envenenar um jogador.`,
                `O jogador afetado terá problemas ao usar os seus poderes (receberá informações erradas).`,
            ],
            fr: [
                `<red>NE</red> SE RÉVEILLE <red>PAS</red> AVEC LES LOUPS-GAROUS.`,
                `<red>Chaque nuit</red>, la sorcière peut empoisonner un personnage.`,
                `Le joueur affecté aura de la difficulté à contrôler ses pouvoirs (recevra de fausses informations).`,
            ],
            en: [
                `<red>DOES NOT</red> WAKE UP WITH THE WEREWOLVES.`,
                `<red>Each night</red>, the Witch may poison one player.`,
                `The affected player will have trouble using their powers and will receive incorrect information.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenada:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `É imune a todos os ataques.`,
                    fr: `Est immune à tout attaque.`,
                    en: `Is immune to all attacks.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Aldeões.`,
            fr: `Tuer tous les Villageois.`,
            en: `Kill all Villagers.`
        }
    },
    "e03": {
        id: "e03",
        group: "essential",
        team: "villagers",
        name: {
            pt: `Chaman`,
            fr: `Chaman`,
            en: `Shaman`
        },
        mainDescription: {
            pt: [
                `<red>Cada noite</red> é avisado sobre os jogadores <red>assassinados</red> e pode escolher salvá-los.`,
                `O Chaman pode salvar (👍) <red>dois</red> jogadores <red>durante todo o jogo</red>.`,
            ],
            fr: [
                `<red>Chaque nuit</red> est montré les joueurs  <red>assassinés</red> et peut choisir de les sauver.`,
                `Le Chaman peut sauver (👍) <red>deux</red> joueurs <red>pendant tout le jeu</red>.`,
            ],
            en: [
                `<red>Each night</red>, is shown the players who were <red>assassinated</red> and may choose to save them.`,
                `The Shaman may save (👍) <red>two</red> players <red>during the entire game</red>.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Não salva o jogador.`,
                    fr: `Ne sauve pas le joueur.`,
                    en: `Does not save the player.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "e04": {
        id: "e04",
        group: "essential",
        team: "villagers",
        name: {
            pt: `Vidente`,
            fr: `Voyante`,
            en: `Fortune Teller`
        },
        mainDescription: {
            pt: [
                `<red>Cada vez que um jogador é morto</red>, a Vidente descobre qual era o seu poder <red>(será informada na próxima noite)</red>.`,
            ],
            fr: [
                `<red>Chaque fois qu’un joueur meurt</red>, la Voyante découvre son pouvoir <red>(elle sera informée la nuit suivante)</red>.`,
            ],
            en: [
                `<red>Whenever a player dies</red>, the Fortune Teller learns what their power was <red>(the information is given the following night)</red>.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenada:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Não receberá a informação correta.`,
                    fr: `Recevra de fausses informations.`,
                    en: `Receives incorrect information.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v01": {
        id: "v01",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Menina`,
            fr: `Petite Fille`,
            en: `Little Girl`
        },
        mainDescription: {
            pt: [
                `<red>Cada noite</red> é avisada sobre os jogadores <red>assassinados</red> e vê como eles morreram.`,
                `O Narrador mostrará o papel cujo o poder assassinou a vítima.`,
                `Se for um Namorado que se suicidou, é-lhe mostrado o papel do Cupido.`,
                `Se o assassino era um Soldado, é-lhe mostrado o papel do Capitão.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, les joueurs  <red>assassinés</red> lui sont montrés et elle découvre comment ils sont morts.`,
                `Le Meneur lui montrera le rôle dont le pouvoir l’a tué.`,
                `S’il s'agit d’un Amoureux s’étant suicidé, le carte de Cupidon lui sera montrée.`,
                `Si l’assassin était un Soldat, la carte du Capitaine lui sera montrée.`,
            ],
            en: [
                `<red>Each night</red>, is shown the players who were <red>assassinated</red> and learns how they died.`,
                `The Narrator shows the role whose power assassinated the victim.`,
                `If a Lover committed suicide, the Cupid card is shown.`,
                `If the killer was a Soldier, the Captain card is shown.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Receberá a informação errada.`,
                    fr: `Recevra de fausses informations.`,
                    en: `Receives incorrect information.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v02": {
        id: "v02",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Domador do Urso`,
            fr: `Maître de l’Ours`,
            en: `Bear Tamer`
        },
        mainDescription: {
            pt: [
                `<red>A cada noite</red>, se um dos seus vizinhos for uma Criatura Malvada, o Urso rosna.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, si un de ces voisins s’agit d’une Créature Maléfique, l’Ours grogne.`,
            ],
            en: [
                `<red>Each night</red>, if one of the Bear Tamer’s neighbors is an Evil Being, the Bear growls.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Receberá a informação errada.`,
                    fr: `Recevra de fausses informations.`,
                    en: `Receives incorrect information.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v03": {
        id: "v03",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Domador do Corvo`,
            fr: `Maître du Corbeau`,
            en: `Raven Tamer`
        },
        mainDescription: {
            pt: [
                `<red>A cada noite</red>, é-lhe revelado silenciosamente quantas Criaturas Malvadas vivas estão em jogo.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, le Meneur lui révèle silencieusement le nombre de Créatures Maléfiques vivantes en jeu.`,
            ],
            en: [
                `<red>Each night</red>, the Narrator silently reveals how many living Evil Beings are in play.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Receberá a informação errada.`,
                    fr: `Recevra de fausses informations.`,
                    en: `Receives incorrect information.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v04": {
        id: "v04",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Domador da Raposa`,
            fr: `Maître du Renard`,
            en: `Fox Tamer`
        },
        mainDescription: {
            pt: [
                `<red>A cada noite</red>, escolhe um jogador e o Narrador revela-lhe se entre ele e os 2 vizinhos há uma Criatura Malvada (👍) ou não (👎).`,
                `<red>A partir da segunda noite</red>, se os três forem Aldeões, a Raposa foge e o Domador da Raposa perde o seu poder.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, il choisit un joueur et le Meneur lui révèle si entre lui et ses voisins il y a une Créature Maléfique (👍) ou pas (👎).`,
                `<red>Dès la deuxième nuit</red>, si tous les trois sont des Villageois, le Renard fuit et le Maître du Renard perd son pouvoir.`,
            ],
            en: [
                `<red>Each night</red>, chooses a player, and the Narrator reveals whether that player or either of their two neighbors is an Evil Being (👍) or not (👎).`,
                `<red>Starting on the second night</red>, if all three are Villagers, the Fox runs away and the Fox Tamer loses their power.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Receberá a informação errada.`,
                    fr: `Recevra de fausses informations.`,
                    en: `Receives incorrect information.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v05": {
        id: "v05",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Domador dos Coelhos`,
            fr: `Maître des Lapins`,
            en: `Rabbit Tamer`
        },
        mainDescription: {
            pt: [
                `<red>A cada noite</red>, se um dos vizinhos ou ele próprio foi atacado pelos Lobisomens ou envenenado pela Bruxa, os coelhos assustam-se.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, si un de ces voisins ou soi-même est attaqué par les Loups-garous ou empoisonné par la Sorcière, les lapins auront peur.`,
            ],
            en: [
                `<red>Each night</red>, if the Rabbit Tamer or either neighbor was attacked by the Werewolves or poisoned by the Witch, the rabbits become frightened.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Receberá a informação errada.`,
                    fr: `Recevra de fausses informations.`,
                    en: `Receives incorrect information.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v06": {
        id: "v06",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Marionetista`,
            fr: `Marionnettiste`,
            en: `Puppeteer`
        },
        mainDescription: {
            pt: [
                `Faz de conta que é um Lobisomem.`, `<red>Acorda ao mesmo tempo que os Lobisomens</red> e vota com eles.`,
            ],
            fr: [
                `Il fait semblant d’être un Loup-garou.`,
                `<red>Il se réveille en même temps que les Loups-garous</red> et vote avec eux.`,
            ],
            en: [
                `Pretends to be a Werewolf.`,
                `<red>Wakes up at the same time as the Werewolves</red> and votes with them.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Não acorda; será tocado pelo Narrador uma vez que a Bruxa Malvada adormeça.`,
                    fr: `Ne se réveille pas ; sera touché une fois que la Méchante Sorcière s’endorme.`,
                    en: `Does not wake up; the Narrator touches the Puppeteer after the Evil Witch goes back to sleep.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v07": {
        id: "v07",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Cavaleiro Enferrujado`,
            fr: `Chevalier Rouillé`,
            en: `Rusted Knight`
        },
        mainDescription: {
            pt: [
                `<red>Quando morre</red>, o Lobisomem mais próximo morrerá <red>durante o próximo dia</red>. A morte será anunciada no início do Tribunal.`,
            ],
            fr: [
                `<red>Une fois mort</red>, le Loup-garou le plus proche mourra durant la prochaine journée. Sa mort sera annoncée au début du Tribunal.`,
            ],
            en: [
                `<red>When the Rusted Knight dies</red>, the nearest Werewolf dies <red>during the following day</red>. The death is announced at the start of the Tribunal.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado quando morto:`,
                    fr: `Si empoisonné quand il meurt :`,
                    en: `If poisoned when killed:`
                },
                description: {
                    pt: `Assassina o jogador errado.`,
                    fr: `Assassine le mauvais joueur.`,
                    en: `Assassinates the wrong player.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v08": {
        id: "v08",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Caçador`,
            fr: `Chasseur`,
            en: `Hunter`
        },
        mainDescription: {
            pt: [
                `<red>Uma vez morto</red>, será acordado na próxima noite para escolher <red>um</red> jogador que deverá assassinar.`,
                `<red>Se o Capuchinho Vermelho foi executado</red>, será acordado na próxima noite para escolher <red>um</red> jogador que deverá ser assassinado (Poderá na mesma usar o seu poder quando morrer).`,
            ],
            fr: [
                `<red>Une fois mort</red>, sera réveillé la prochaine nuit et choisira <red>un</red> joueur qui sera assassiné.`,
                `<red>Si le Petit Chaperon Rouge est exécuté</red>, il sera réveillé la nuit suivante et choisira <red>un</red> joueur qui sera assassiné. (Pourra tout de même tuer un joueur quand il meurt).`,
            ],
            en: [
                `<red>After dying</red>, wakes up the following night and chooses <red>one</red> player to assassinate.`,
                `<red>If Little Red Riding Hood was executed</red>, wakes up the following night and chooses <red>one</red> player to assassinate. The Hunter may still use the normal death power later.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado no momento da morte:`,
                    fr: `Si empoisonné quand il meurt :`,
                    en: `If poisoned at the time of death:`
                },
                description: {
                    pt: `Assassina o jogador errado.`,
                    fr: `Assassine le mauvais joueur.`,
                    en: `Assassinates the wrong player.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v08b": {
        id: "v08b",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Capuchinho Vermelho`,
            fr: `Petit Chaperon Rouge`,
            en: `Little Red Riding Hood`
        },
        mainDescription: {
            pt: [
                `É imune aos <red>assassinatos dos Lobisomens</red> enquanto o <red>Caçador estiver vivo</red>.`,
                `Se for <red>executada enquanto o Caçador estiver vivo</red>, o Caçador pode matar alguém na próxima noite.`,
            ],
            fr: [
                `Est immune aux <red>assassinats des Loups-garous</red> tant que le Chasseur soit en vie.`,
                `Si <red>exécuté pendant que le Chasseur est vivant</red>, le Chasseur peut tuer quelqu’un la nuit suivante.`,
            ],
            en: [
                `Is immune to <red>Werewolf assassinations</red> while the <red>Hunter is alive</red>.`,
                `If <red>executed while the Hunter is alive</red>, the Hunter may kill someone the following night.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Perde a imunidade essa noite.`,
                    fr: `Perd son immunité cette nuit-là.`,
                    en: `Loses immunity for that night.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v09": {
        id: "v09",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Capitão`,
            fr: `Capitaine`,
            en: `Captain`
        },
        mainDescription: {
            pt: [
                `<red>Cada noite</red>, escolhe um jogador que será um Soldado durante essa noite e dia. O Soldado será tocado pelo Narrador.`,
                `Se o Soldado morrer, poderá matar alguém na noite seguinte.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, choisit un Soldat pour une nuit et un jour. Le Soldat sera touché par le Meneur.`,
                `Si le Soldat meurt, il pourra tuer quelqu’un la nuit suivante.`,
            ],
            en: [
                `<red>Each night</red>, chooses a player who will be a Soldier for that night and the following day. The Narrator touches the Soldier.`,
                `If the Soldier dies, they may kill someone the following night.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `O poder afeta o jogador errado.`,
                    fr: `Le pouvoir affecte le mauvais joueur.`,
                    en: `The power affects the wrong player.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v10": {
        id: "v10",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Paranoico`,
            fr: `Paranoïaque`,
            en: `Paranoid`
        },
        mainDescription: {
            pt: [
                `<red>Duas vezes</red> no jogo, <red>durante o dia</red>, pode dizer <red>discretamente</red> ao Narrador para <red>assassinar</red> uma pessoa cuja morte será anunciada no início do Tribunal.`,
            ],
            fr: [
                `<red>Deux fois</red> dans le jeu, <red>pendant le jour</red>, il peut dire <red>discrètement</red> au Meneur un joueur qu’il veut <red>assassiner</red>, sa mort sera annoncée au Tribunal.`,
            ],
            en: [
                `<red>Twice</red> per game, <red>during the day</red>, may <red>discreetly</red> tell the Narrator to <red>assassinate</red> a player. The death is announced at the start of the Tribunal.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Assassina o jogador errado.`,
                    fr: `Assassine le mauvais joueur.`,
                    en: `Assassinates the wrong player.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v11": {
        id: "v11",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Chefe da Aldeia`,
            fr: `Ancien du Village`,
            en: `Village Elder`
        },
        mainDescription: {
            pt: [
                `<red>A cada noite</red>, escolhe um jogador que terá automaticamente 2 votos a mais contra ele se for a Tribunal nesse dia.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, il choisit un joueur qui aura automatiquement deux votes contre lui s’il est accusé au Tribunal du jour suivant.`,
            ],
            en: [
                `<red>Each night</red>, chooses a player who automatically receives 2 additional votes against them if brought to the Tribunal that day.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Os votos do jogador escolhido contam a dobrar.`,
                    fr: `Les votes du joueur choisi seront doublés.`,
                    en: `The chosen player’s votes count double.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v12": {
        id: "v12",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Cigana`,
            fr: `Gitane`,
            en: `Gypsy`
        },
        mainDescription: {
            pt: [
                `<red>A cada noite</red>, escolhe um jogador e o Narrador revela-lhe se entre ele e os 2 vizinhos há um jogador envenenado.`,
                `Se for o caso, ela será avisada (👍/👎), esse jogador perde o veneno e a Cigana fica envenenada.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, choisit un joueur et le Meneur révèlera si entre lui et ses voisins il y a quelqu’un empoisonné.`,
                `Si c’est le cas, elle sera avertie (👍/👎), le joueur perd le poison et la Gitane devient empoisonnée.`,
            ],
            en: [
                `<red>Each night</red>, chooses a player, and the Narrator reveals whether that player or either of their two neighbors is poisoned.`,
                `If so, the Gypsy is notified (👍/👎), that player loses the poison, and the Gypsy becomes poisoned.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado :`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `O voto dela conta a dobrar.`,
                    fr: `Ses votes sont doublés.`,
                    en: `The Gypsy’s vote counts double.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v13": {
        id: "v13",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Juiz`,
            fr: `Juge`,
            en: `Judge`
        },
        mainDescription: {
            pt: [
                `<red>Duas vezes durante todo o jogo</red>, pode-se revelar e anular uma execução durante o Tribunal.`,
                `Só pode usar este poder uma vez por dia.`,
                `<red>Se assassinado</red>, o Fantasma <red>pode continuar a votar</red> e o seu voto conta o dobro.`,
            ],
            fr: [
                `<red>Deux fois dans tous le jeu</red>, il peut se révéler et annuler une exécution au Tribunal.`,
                `Il ne peut utiliser ce pouvoir qu'une fois par jour.`,
                `<red>Si assassiné</red>, son Fantôme <red>peut continuer à voter</red> et son vote sera doublé.`,
            ],
            en: [
                `<red>Twice during the entire game</red>, may reveal themself and cancel an execution during the Tribunal.`,
                `This power may only be used once per day.`,
                `<red>If assassinated</red>, the Ghost <red>may continue voting</red>, and their vote counts double.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `A anulação não tem efeito.`,
                    fr: `L’annulation n’aura aucun effet.`,
                    en: `The cancellation has no effect.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v14": {
        id: "v14",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Acusador`,
            fr: `Accusateur`,
            en: `Accuser`
        },
        mainDescription: {
            pt: [
                `<red>Duas vezes durante todo o jogo</red>, pode-se revelar e forçar uma execução durante o Tribunal.`,
                `Só pode usar o poder uma vez por dia.`,
            ],
            fr: [
                `<red>Deux fois dans tout le jeu</red>, il peut se révéler et forcer une exécution au Tribunal.`,
                `Il ne peut utiliser ce pouvoir qu'une fois par jour.`,
            ],
            en: [
                `<red>Twice during the entire game</red>, may reveal themself and force an execution during the Tribunal.`,
                `This power may only be used once per day.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `A execução não tem efeito.`,
                    fr: `L’exécution n’aura aucun effet.`,
                    en: `The execution has no effect.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v15": {
        id: "v15",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Piromaníaco`,
            fr: `Pyromane`,
            en: `Pyromaniac`
        },
        mainDescription: {
            pt: [
                `Quando um jogador é chamado ao tribunal, mas <red>não é executado</red>, o Piromaníaco <red>pode escolher</red> na <red>noite seguinte</red> incendiar a casa desse jogador (👍/👎).`,
                `Esse jogador morre se for um Lobisomem, senão, perde os seus poderes permanentemente.`,
            ],
            fr: [
                `Quand un joueur est accusé au Tribunal, mais <red>n’est pas exécuté</red>, le Pyromane <red>peut choisir</red> la <red>nuit suivante</red> d'incendier la maison de ce joueur (👍/👎).`,
                `Ce joueur meurt s’il est un Loup-garou, sinon, perd ses pouvoirs de façon permanente.`,
            ],
            en: [
                `When a player is brought to the Tribunal but <red>is not executed</red>, the Pyromaniac <red>may choose</red> on the <red>following night</red> to set that player’s house on fire (👍/👎).`,
                `That player dies if they are a Werewolf; otherwise, they permanently lose their powers.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado :`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Incendiará a casa errada.`,
                    fr: `Il incendie la mauvaise maison.`,
                    en: `Sets the wrong house on fire.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v16": {
        id: "v16",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Sonâmbulo`,
            fr: `Somnambule`,
            en: `Sleepwalker`
        },
        mainDescription: {
            pt: [
                `<red>Cada início de noite</red> escolhe um jogador para visitar.`,
                `Esse jogador será tocado e não será chamado essa noite.`,
                `Se esse jogador for chamado na mesma (por ex. Lobisomens), não acorda.`,
            ],
            fr: [
                `<red>Au début de chaque nuit</red>, il choisit un joueur qu’il visitera.`,
                `Ce joueur sera touché et ne sera pas appelé cette nuit-là.`,
                `Si ce joueur est tout de même appelé (par ex. Loup-garou), il ne se réveille pas.`,
            ],
            en: [
                `<red>At the start of each night</red>, chooses a player to visit.`,
                `That player is touched and will not be called during the night.`,
                `If that player is called anyway, for example with the Werewolves, they do not wake up.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado na noite passada:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned the previous night:`
                },
                description: {
                    pt: `Vai dormir na casa do jogador errado.`,
                    fr: `Va dormir chez le mauvais joueur.`,
                    en: `Sleeps at the wrong player’s house.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v17": {
        id: "v17",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Salvador`,
            fr: `Sauveur`,
            en: `Saviour`
        },
        mainDescription: {
            pt: [
                `<red>Cada noite</red>, escolhe um jogador que será imune <red>durante essa noite</red>.`,
                `Também se pode escolher a si próprio.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, il choisit un joueur qui sera immune <red>pendant cette nuit</red>.`,
                `Il peut aussi se choisir soi-même.`,
            ],
            en: [
                `<red>Each night</red>, chooses a player who will be immune <red>during that night</red>.`,
                `May also choose themself.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Dá imunidade ao jogador errado.`,
                    fr: `Donne immunité au mauvais joueur.`,
                    en: `Grants immunity to the wrong player.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v18": {
        id: "v18",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Anjo`,
            fr: `Ange`,
            en: `Angel`
        },
        mainDescription: {
            pt: [
                `Pode ressuscitar <red>dois</red> Fantasmas <red>durante todo o jogo</red>.`,
                `Se o Fantasma tinha um poder com usos limitados, recupera todos os usos quando ressuscitado.`,
                `(Pode pedir discretamente a qualquer momento ao Narrador; o jogador ressuscitará na próxima noite)`,
            ],
            fr: [
                `Peut ressusciter <red>deux</red> Fantômes <red>durant tout le jeu</red>.`,
                `Si le Fantôme avait un pouvoir avec des utilisations limitées, il les récupère.`,
                `(Il peut demander discrètement d’utiliser son pouvoir à tout moment au Meneur ; le Fantôme sera ressuscité la nuit suivante.)`,
            ],
            en: [
                `May resurrect <red>two</red> Ghosts <red>during the entire game</red>.`,
                `If the Ghost had a limited-use power, all uses are restored upon resurrection.`,
                `(The Angel may discreetly ask the Narrator at any time; the player is resurrected the following night.)`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Ressuscita o jogador errado.`,
                    fr: `Ressuscite le mauvais joueur.`,
                    en: `Resurrects the wrong player.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v19": {
        id: "v19",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Profeta`,
            fr: `Prophète`,
            en: `Prophet`
        },
        mainDescription: {
            pt: [
                `<red>Cada fim de noite</red>, o Profeta aponta para um jogador que acha que morreu durante essa noite.`,
                `Se a profecia estiver certa (👍), esse jogador será tocado e guardará os seus poderes enquanto Fantasma durante o próximo dia e noite.`,
                `Se era um personagem com um poder com usos limitados, pode usar o poder de qualquer maneira.`,
            ],
            fr: [
                `<red>À la fin de chaque nuit</red>, le Prophète montre un joueur qu’il croit avoir été tué durant cette nuit.`,
                `Si sa prophétie est correcte (👍), le joueur sera touché et pourra utiliser son pouvoir en tant que Fantôme durant le jour et la nuit suivants.`,
                `Cela inclut notamment les rôles à pouvoirs limités.`,
            ],
            en: [
                `<red>At the end of each night</red>, points at a player believed to have died during that night.`,
                `If the prophecy is correct (👍), that player is touched and keeps their powers as a Ghost during the following day and night.`,
                `This also applies to characters with limited-use powers.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `A profecia está errada de qualquer maneira.`,
                    fr: `La prophétie sera de toute façon fausse.`,
                    en: `The prophecy is always incorrect.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v20": {
        id: "v20",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Empregada`,
            fr: `Domestique`,
            en: `Housemaid`
        },
        mainDescription: {
            pt: [
                `<red>Cada noite</red>, é-lhe revelada a distância até a pessoa envenenada`,
                `(Ex.: 3 = a terceira pessoa à esquerda ou à direita).`,
            ],
            fr: [
                `<red>Chaque nuit</red>, le Meneur lui révèle la distance de la personne empoisonné`,
                `(Ex. : 3 = la troisième personne à droite ou à gauche).`,
            ],
            en: [
                `<red>Each night</red>, the distance to the poisoned player is revealed.`,
                `(Example: 3 means the third player to the left or right.)`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Receberá a informação errada.`,
                    fr: `Recevra de fausses informations.`,
                    en: `Receives incorrect information.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v21": {
        id: "v21",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Faroleiro`,
            fr: `Falotier`,
            en: `Lamplighter`
        },
        mainDescription: {
            pt: [
                `<red>Cada noite</red>, é-lhe mostrado um personagem em jogo com um poder com usos limitados e é informado de quantos usos esse personagem ainda tem.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, il est montré un rôle en jeu qui a des utilisations limitées de son pouvoir et combien d’utilisations lui reste.`,
            ],
            en: [
                `<red>Each night</red>, is shown a character in play with a limited-use power and learns how many uses that character has left.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Receberá a informação errada.`,
                    fr: `Recevra de fausses informations.`,
                    en: `Receives incorrect information.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v22": {
        id: "v22",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Pedro`,
            fr: `Enfant`,
            en: `Boy`
        },
        mainDescription: {
            pt: [
                `Cada vez que leva um jogador a Tribunal, é-lhe revelado na <red>noite seguinte</red> se esse jogador era um Lobisomem ou não.`,
                `<red>Nunca pode levar o mesmo jogador a Tribunal duas vezes</red>.`,
            ],
            fr: [
                `Chaque fois qu’il accuse quelqu’un au Tribunal, il lui sera révélé la <red>nuit suivante</red> si ce joueur était un Loup-garou ou pas.`,
                `<red>Ne peut jamais amener le même joueur au Tribunal deux fois</red>.`,
            ],
            en: [
                `Whenever the Boy brings a player to the Tribunal, the <red>following night</red> reveals whether that player was a Werewolf.`,
                `<red>The Boy may never bring the same player to the Tribunal twice</red>.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Receberá a informação errada.`,
                    fr: `Recevra de fausses informations.`,
                    en: `Receives incorrect information.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v23": {
        id: "v23",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Domador da Aranha`,
            fr: `Maître de l’Araignée`,
            en: `Spider Tamer`
        },
        mainDescription: {
            pt: [
                `<red>Na primeira noite</red>, escolhe um jogador no qual tece uma teia de aranha.`,
                `<red>Cada noite depois da primeira</red>, o Domador da Aranha será mostrado as cartas que durante a noite apontaram o jogador com a teia.`,
                `<red>Na noite seguinte à morte do jogador com a teia de aranha</red>, o Domador da Aranha é acordado para escolher um novo.`,
                `<red>Uma vez</red> no jogo, <red>durante o dia</red>, pode dizer <red>discretamente</red> ao Narrador para mudar o jogador com a teia antes da morte dele.`,
            ],
            fr: [
                `<red>La première nuit</red>, il choisit un joueur chez qui il fera une toile d’araignée.`,
                `<red>Chaque nuit après la première</red>, le Meneur révèle au Maître de l’Araignée chaque carte qui a pointé le joueur avec la toile cette nuit-là.`,
                `<red>La nuit suivant la mort du joueur avec la toile d’araignée</red>, le Maître de l’Araignée est réveillé et en choisit un nouveau.`,
                `<red>Une fois</red> dans le jeu, <red>pendant le jour</red>, il peut dire <red>discrètement</red> au Meneur s’il souhaite changer le joueur avec la toile avant la mort de celui-ci.`,
            ],
            en: [
                `<red>On the first night</red>, chooses a player on whom to weave a spiderweb.`,
                `<red>Each night after the first</red>, the Narrator shows the Spider Tamer every card that pointed at the webbed player during that night.`,
                `<red>On the night after the webbed player dies</red>, the Spider Tamer wakes up and chooses a new player.`,
                `<red>Once</red> per game, <red>during the day</red>, may <red>discreetly</red> ask the Narrator to move the web before the webbed player dies.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Receberá a informação errada.`,
                    fr: `Recevra de fausses informations.`,
                    en: `Receives incorrect information.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v24": {
        id: "v24",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Vinicultor`,
            fr: `Vigneron`,
            en: `Vintner`
        },
        mainDescription: {
            pt: [
                `<red>Cada noite</red>, o Vinicultor <red>escolhe se quer</red> envenenar um jogador durante um dia e uma noite, mas esse jogador também será imune.`,
                `O jogador afetado terá problemas ao usar os seus poderes (receberá informações erradas).`,
            ],
            fr: [
                `<red>Chaque nuit</red>, le Vigneron <red>choisit s’il souhaite</red> empoisonner un joueur pendant un jour et une nuit. Ce joueur sera également immune.`,
                `Le joueur affecté aura de la difficulté à contrôler ses pouvoirs (recevra de fausses informations).`,
            ],
            en: [
                `<red>Each night</red>, the Vintner <red>chooses whether</red> to poison a player for one day and one night. That player also becomes immune.`,
                `The affected player will have trouble using their powers and will receive incorrect information.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Dá imunidade ao jogador errado.`,
                    fr: `Donne immunité au mauvais joueur.`,
                    en: `Grants immunity to the wrong player.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "v25": {
        id: "v25",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Padre`,
            fr: `Prêtre`,
            en: `Priest`
        },
        mainDescription: {
            pt: [
                `<red>Cada noite</red>, o Padre é chamado e <red>qualquer outro jogador</red> pode levantar a mão para se confessar.`,
                `O Padre escolhe um jogador com a mão levantada e pode ver o papel desse jogador. Em troca, o jogador escolhido pode acordar e ver quem é o Padre.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, quand le Prêtre est réveillé, <red>tout autre joueur</red> peut lever la main pour se confesser.`,
                `Le Prêtre choisit un joueur qui a levé la main et peut voir le rôle de ce joueur. En échange, le joueur choisi peut se réveiller et découvrir qui est le Prêtre.`,
            ],
            en: [
                `<red>Each night</red>, the Priest is called, and <red>any other player</red> may raise a hand to confess.`,
                `The Priest chooses a player with a raised hand and may see that player’s role. In return, the chosen player wakes up and sees who the Priest is.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Não acorda.`,
                    fr: `Ne se réveille pas.`,
                    en: `Does not wake up.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "m01": {
        id: "m01",
        group: "evil",
        team: "evilBeing",
        name: {
            pt: `Lobisomem Mau`,
            fr: `Méchant Loup-garou`,
            en: `Big Bad Werewolf`
        },
        mainDescription: {
            pt: [
                `<red>Duas vezes</red> por jogo, escolhe se quer se mascarar de Avózinha (👍/👎), dando-lhe imunidade durante um dia e uma noite.`,
                `<red>Mesmo imune</red>, pode ser <red>executado</red> se quem o levar a tribunal for o Capuchinho Vermelho. E nesse caso, se o Caçador votar, o Lobisomem Mau é automaticamente executado.`,
            ],
            fr: [
                `<red>Deux fois</red> par jeu, il choisit s’il veut se déguiser en Grand-maman (👍/👎), ce qui lui donne immunité pendant un jour et une nuit.`,
                `<red>Même étant immune</red>, il peut être <red>exécuté</red> au Tribunal si accusé par le Petit Chaperon Rouge. Dans ce cas spécifiquement, si le Chasseur vote, le Méchant Loup-garou est exécuté automatiquement.`,
            ],
            en: [
                `<red>Twice</red> per game, chooses whether to disguise themself as Grandmother (👍/👎), gaining immunity for one day and one night.`,
                `<red>Even while immune</red>, may be <red>executed</red> if Little Red Riding Hood brings them to the Tribunal. In that specific case, if the Hunter votes, the Big Bad Werewolf is executed automatically.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se qualquer Lobisomem estiver envenenado:`,
                    fr: `Si n’importe quel Loup-garou est empoisonné :`,
                    en: `If any Werewolf is poisoned:`
                },
                description: {
                    pt: `Não podem matar.`,
                    fr: `Ils ne peuvent pas tuer.`,
                    en: `They cannot kill.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Aldeões.`,
            fr: `Tuer tous les Villageois.`,
            en: `Kill all Villagers.`
        }
    },
    "m02": {
        id: "m02",
        group: "evil",
        team: "evilBeing",
        name: {
            pt: `Lobisomem Vidente`,
            fr: `Loup-garou Voyante`,
            en: `Werewolf Seer`
        },
        mainDescription: {
            pt: [
                `Após os Lobisomens terem escolhido a sua vítima, o Lobisomem Vidente pode <red>escolher</red> NÃO DEIXAR MATAR esse jogador, mas em vez disso, ver o seu papel.`,
            ],
            fr: [
                `Après que les Loups-garous ont choisi leur victime, le Loup-garou Voyante peut <red>choisir</red> NE PAS TUER ce joueur mais, à la place, voir son pouvoir.`,
            ],
            en: [
                `After the Werewolves choose their victim, the Werewolf Seer may <red>choose</red> NOT TO KILL that player and instead see their role.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se qualquer Lobisomem estiver envenenado:`,
                    fr: `Si n’importe quel Loup-garou est empoisonné :`,
                    en: `If any Werewolf is poisoned:`
                },
                description: {
                    pt: `Não podem matar.`,
                    fr: `Ils ne peuvent pas tuer.`,
                    en: `They cannot kill.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Aldeões.`,
            fr: `Tuer tous les Villageois.`,
            en: `Kill all Villagers.`
        }
    },
    "m03": {
        id: "m03",
        group: "evil",
        team: "evilBeing",
        name: {
            pt: `Lobisomem Vampiro`,
            fr: `Loup-garou Vampire`,
            en: `Vampire Werewolf`
        },
        mainDescription: {
            pt: [
                `<red>Uma só vez durante todo o jogo</red>, pode transformar a vítima dos Lobisomens em Lobisomem.`,
                `A vítima será avisada e <red>guarda os seus poderes de Aldeão se quiser</red> (👍/👎) mas joga com o objetivo dos Lobisomens.`,
                `Se a vítima tiver um poder com usos limitados, recupera todos os usos quando transformada.`,
            ],
            fr: [
                `<red>Une seule fois dans tout le jeu</red>, il peut transformer la victime des Loups-garous en Loup-garou.`,
                `La victime sera touchée. Elle <red>gardera ses pouvoirs de Villageois si elle le souhaite</red> (👍/👎) mais jouera avec l’objectif des Créatures Méchantes.`,
                `Si la victime avait un pouvoir avec des utilisations limitées, elle les récupère.`,
            ],
            en: [
                `<red>Once during the entire game</red>, may turn the Werewolves’ victim into a Werewolf.`,
                `The victim is notified and <red>may keep their Villager powers if they wish</red> (👍/👎), but now plays toward the Werewolves’ objective.`,
                `If the victim had a limited-use power, all uses are restored when they are turned.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se qualquer Lobisomem estiver envenenado:`,
                    fr: `Si n’importe quel Loup-garou est empoisonné :`,
                    en: `If any Werewolf is poisoned:`
                },
                description: {
                    pt: `Não podem matar.`,
                    fr: `Ils ne peuvent pas tuer.`,
                    en: `They cannot kill.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Aldeões.`,
            fr: `Tuer tous les Villageois.`,
            en: `Kill all Villagers.`
        }
    },
    "m04": {
        id: "m04",
        group: "evil",
        team: "evilBeing",
        name: {
            pt: `Ankou`,
            fr: `Ankou`,
            en: `Ankou`
        },
        mainDescription: {
            pt: [
                `<red>NÃO</red> ACORDA COM OS LOBISOMENS.`,
                `Se morto por <red>execução</red>, o Fantasma pode continuar a votar e seu voto vale o dobro.`,
            ],
            fr: [
                `<red>NE</red> SE RÉVEILLE <red>PAS</red> AVEC LES LOUPS-GAROUS.`,
                `<red>Si exécuté</red>, son Fantôme <red>peut continuer à voter</red> et son vote sera doublé.`,
            ],
            en: [
                `<red>DOES NOT</red> WAKE UP WITH THE WEREWOLVES.`,
                `If killed by <red>execution</red>, the Ghost may continue voting, and their vote counts double.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Sem efeito.`,
                    fr: `Sans effet.`,
                    en: `No effect.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Aldeões.`,
            fr: `Tuer tous les Villageois.`,
            en: `Kill all Villagers.`
        }
    },
    "m05": {
        id: "m05",
        group: "evil",
        team: "evilBeing",
        name: {
            pt: `Cupido Malvado`,
            fr: `Méchant Cupidon`,
            en: `Evil Cupid`
        },
        mainDescription: {
            pt: [
                `<red>NÃO</red> ACORDA COM OS LOBISOMENS.`,
                `<red>A cada vez que um dos Inimigos morre</red>, o Cupido Malvado é acordado para escolher um novo Inimigo para o sobrevivente.`,
            ],
            fr: [
                `<red>NE</red> SE RÉVEILLE <red>PAS</red> AVEC LES LOUPS-GAROUS.`,
                `**<red>La première nuit</red> est appelé pour choisir deux joueurs qui seront Ennemis :**`,
                `Si un Ennemi arrive à amener l’autre à <red>exécution</red>, le premier reçoit immunité contre le prochain <red>assassinat</red>.`,
                `<red>Après la mort de chaque Ennemi</red>, le Méchant Cupidon est réveillé pour choisir un nouvel Ennemi pour le survivant.`,
            ],
            en: [
                `<red>DOES NOT</red> WAKE UP WITH THE WEREWOLVES.`,
                `<red>Whenever one Enemy dies</red>, Evil Cupid wakes up and chooses a new Enemy for the survivor.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Na primeira noite é chamado a escolher dois jogadores que serão Inimigos:`,
                    fr: `Si empoisonné :`,
                    en: `On the first night, chooses two players who become Enemies:`
                },
                description: {
                    pt: `Se um Inimigo conseguir condenar o outro a <red>execução</red>, o primeiro recebe imunidade contra a próxima tentativa de <red>assassinato</red>.`,
                    fr: `Sans effet.`,
                    en: `If one Enemy manages to have the other <red>executed</red>, the first gains immunity from the next <red>assassination</red> attempt.`
                }
            },
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Se envenenado:`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Sem efeito.`,
                    fr: `Sem efeito.`,
                    en: `No effect.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Aldeões.`,
            fr: `Tuer tous les Villageois.`,
            en: `Kill all Villagers.`
        }
    },
    "m06": {
        id: "m06",
        group: "evil",
        team: "evilBeing",
        name: {
            pt: `Mestre do Lobo(isomem)`,
            fr: `Maître du Loup(-garou)`,
            en: `(Were)wolf Tamer`
        },
        mainDescription: {
            pt: [
                `Age como um Lobisomem normal, mas é identificado como sendo um Aldeão e não uma Criatura Malvada por outros papéis (por exemplo o Domador do Urso).`,
            ],
            fr: [
                `Il agit comme un Loup-garou normal, mais il est identifié comme étant un Villageois et non une Créature Maléfique par d’autres rôles (par exemple le Maître de l’Ours).`,
            ],
            en: [
                `Acts like a normal Werewolf, but other roles, such as the Bear Tamer, identify this character as a Villager rather than an Evil Being.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se qualquer Lobisomem estiver envenenado:`,
                    fr: `Si n’importe quel Loup-garou est empoisonné :`,
                    en: `If any Werewolf is poisoned:`
                },
                description: {
                    pt: `Não podem matar.`,
                    fr: `Ils ne peuvent pas tuer.`,
                    en: `They cannot kill.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Aldeões.`,
            fr: `Tuer tous les Villageois.`,
            en: `Kill all Villagers.`
        }
    },
    "s01": {
        id: "s01",
        group: "solo",
        team: "solo",
        name: {
            pt: `Cupido`,
            fr: `Cupidon`,
            en: `Cupid`
        },
        mainDescription: {
            pt: [
                `<red>O objetivo dos Namorados é de serem os últimos sobreviventes</red>.`,
                `<red>Duas vezes durante o jogo</red> pode escolher se quer dar imunidade aos Namorados durante aquela noite (👍).`,
            ],
            fr: [
                `**<red>La première nuit</red>, il est appelé pour choisir deux joueurs qui seront Amoureux :**`,
                `Si un Amoureux meurt, l’autre se suicide.`,
                `<red>L’objectif des Amoureux est qu'ils soient les derniers survivants</red>.`,
                `<red>Deux fois pendant le jeu</red>, Cupidon peut choisir de donner immunité aux Amoureux pendant cette nuit-là (👍).`,
            ],
            en: [
                `<red>The Lovers’ objective is to be the last survivors</red>.`,
                `<red>Twice during the game</red>, Cupid may choose to grant the Lovers immunity for that night (👍).`
            ]
        },
        details: [
            {
                title: {
                    pt: `Na primeira noite escolhe dois jogadores que serão Namorados:`,
                    fr: `Si empoisonné :`,
                    en: `On the first night, chooses two players who become Lovers:`
                },
                description: {
                    pt: `Se um Namorado morrer, o outro se suicida.`,
                    fr: `La protection ne fonctionne pas.`,
                    en: `If one Lover dies, the other commits suicide.`
                }
            },
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Se envenenado:`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `A proteção não funciona.`,
                    fr: `A proteção não funciona.`,
                    en: `The protection does not work.`
                }
            }
        ],
        objective: {
            pt: `Os Namorados serem os únicos sobreviventes.`,
            fr: `Que les Amoureux soient les derniers survivants.`,
            en: `The Lovers must be the only survivors.`
        }
    },
    "s02": {
        id: "s02",
        group: "solo",
        team: "solo",
        name: {
            pt: `Lobisomem Branco`,
            fr: `Loup-garou Blanc`,
            en: `White Werewolf`
        },
        mainDescription: {
            pt: [
                `Acorda e age como um Lobisomem, mas <red>a cada três noites tem</red> também de assassinar um Lobisomem.`,
                `<red>Se o Lobisomem Branco for o único Lobisomem vivo</red>, ele continua a ser chamado a cada três noites para assassinar um jogador a mais.`,
            ],
            fr: [
                `Il se réveille et agit comme un Loup-garou, mais <red>à chaque trois nuits, il doit</red> aussi assassiner un Loup-garou.`,
                `<red>Si le Loup-garou Blanc est le seul Loup-garou restant</red>, il continue d’être appelé à chaque trois nuits, pour assassiner un joueur supplémentaire.`,
            ],
            en: [
                `Wakes up and acts as a Werewolf, but <red>every three nights must</red> also assassinate a Werewolf.`,
                `<red>If the White Werewolf is the only living Werewolf</red>, they continue waking every three nights to assassinate one additional player.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Pode matar um Lobisomem a mais.`,
                    fr: `Peut tuer un Loup-garou de plus.`,
                    en: `May kill one additional Werewolf.`
                }
            }
        ],
        objective: {
            pt: `Ser o último sobrevivente.`,
            fr: `Être le dernier survivant.`,
            en: `Be the last survivor.`
        }
    },
    "f01": {
        id: "f01",
        group: "flexible",
        team: "flexible",
        name: {
            pt: `Ladrão`,
            fr: `Voleur`,
            en: `Thief`
        },
        mainDescription: {
            pt: [
                `<red>Cada noite</red>, escolhe um jogador que não poderá votar no próximo tribunal.`,
                `<red>Na segunda noite</red> deverá <red>escolher</red> se quer jogar do lado dos Aldeões (👍) ou do lado dos Lobisomens (👎).`,
                `<red>NÃO</red> ACORDA COM OS LOBISOMENS.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, il choisit un joueur qui n’aura pas de votes au prochain Tribunal.`,
                `<red>La deuxième nuit</red>, il devra <red>choisir</red> être du côté des Villageois (👍) ou des Loups-garous (👎).`,
                `<red>NE</red> SE RÉVEILLE <red>PAS</red> AVEC LES LOUPS-GAROUS.`,
            ],
            en: [
                `<red>Each night</red>, chooses a player who cannot vote at the next Tribunal.`,
                `<red>On the second night</red>, must <red>choose</red> whether to play for the Villagers (👍) or the Werewolves (👎).`,
                `<red>DOES NOT</red> WAKE UP WITH THE WEREWOLVES.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `O voto não será retirado.`,
                    fr: `Le vote n’est pas volé.`,
                    en: `The vote is not stolen.`
                }
            }
        ],
        objective: {
            pt: `à escolha.`,
            fr: `À choix.`,
            en: `Player’s choice.`
        }
    },
    "f02": {
        id: "f02",
        group: "flexible",
        team: "flexible",
        name: {
            pt: `Espião`,
            fr: `Espion`,
            en: `Spy`
        },
        mainDescription: {
            pt: [
                `<red>Cada noite</red>, é chamado e é-lhe mostrada uma carta de um jogador em jogo. Nunca verá a carta de um mesmo jogador duas vezes.`,
                `<red>Na segunda noite</red> deverá <red>escolher</red> se quer jogar do lado dos Aldeões (👍) ou do lado dos Lobisomens (👎).`,
                `<red>NÃO</red> ACORDA COM OS LOBISOMENS.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, il est appelé et voit la carte d’un rôle en jeu. Il ne verra jamais le rôle d’un même joueur deux fois.`,
                `<red>La deuxième nuit</red>, il devra <red>choisir</red> être du côté des Villageois (👍) ou des Loups-garous (👎).`,
                `<red>NE</red> SE RÉVEILLE <red>PAS</red> AVEC LES LOUPS-GAROUS.`,
            ],
            en: [
                `<red>Each night</red>, is called and shown the card of a role in play. The Spy never sees the same player’s card twice.`,
                `<red>On the second night</red>, must <red>choose</red> whether to play for the Villagers (👍) or the Werewolves (👎).`,
                `<red>DOES NOT</red> WAKE UP WITH THE WEREWOLVES.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Verá uma carta que não está em jogo.`,
                    fr: `Il verra un rôle qui n’est pas en jeu.`,
                    en: `Sees a card that is not in play.`
                }
            }
        ],
        objective: {
            pt: `à escolha.`,
            fr: `À choix.`,
            en: `Player’s choice.`
        }
    },
    "a01": {
        id: "a01",
        group: "complex",
        team: "villagers",
        name: {
            pt: `Bêbado`,
            fr: `Ivrogne`,
            en: `Drunkard`
        },
        mainDescription: {
            pt: [
                `<red>Não sabe que é o Bêbado</red>.`,
                `<red>Substitui</red> a Vidente, o Domador do Urso, o Domador dos Coelhos, o Domador do Corvo, o Domador da Raposa ou o Domador da Aranha (aleatório a cada jogo).`,
                `Mas todas as informações que lhe são dadas são como se o personagem estivesse envenenado.`,
            ],
            fr: [
                `<red>Ne sait pas qu’il est l'ivrogne</red>.`,
                `<red>Remplace</red> la Voyante, le Maître de l’Ours, le Maître des Lapins, le Maître du Corbeau, le Maître du Renard ou le Maître de l’Araignée (aléatoire à chaque jeu).`,
                `Mais toutes les informations reçues sont comme si la carte était empoisonnée.`,
            ],
            en: [
                `<red>Does not know they are the Drunkard</red>.`,
                `<red>Replaces</red> the Fortune Teller, Bear Tamer, Rabbit Tamer, Raven Tamer, Fox Tamer, or Spider Tamer, chosen randomly each game.`,
                `All information received is given as though that character were poisoned.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Recebe as informações certas.`,
                    fr: `Reçoit les bonnes informations.`,
                    en: `Receives the correct information.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "a02": {
        id: "a02",
        group: "complex",
        team: "flexible",
        name: {
            pt: `Cão-Lobo`,
            fr: `Chien-Loup`,
            en: `Wolf-Dog`
        },
        mainDescription: {
            pt: [
                `<red>Na segunda noite</red> pode <red>escolher</red> se quer ser um simples Lobisomem (👎) <red>ou</red> ser um Cão (👍) :`,
                `O Cão escolhe um dono e ganha os poderes do dono.`,
                `<red>A cada noite</red> o cão acorda com o seu dono e nesse caso, cada um terá direito a fazer a sua ação independentemente.`,
            ],
            fr: [
                `**<red>Le deuxième nuit</red>, il peut <red>choisir</red> entre être un simple Loup-garou (👎) <red>ou</red> être un Chien (👍) :**`,
                `Le Chien choisit un maître copie ses pouvoirs.`,
                `<red>Chaque nuit</red>, il se réveille avec son maître et peut ainsi agir indépendamment de ce dernier.`,
            ],
            en: [
                `<red>On the second night</red>, may <red>choose</red> between becoming a normal Werewolf (👎) <red>or</red> becoming a Dog (👍):`,
                `The Dog chooses an owner and copies that owner’s powers.`,
                `<red>Each night</red>, the Dog wakes up with the owner, and each uses their action independently.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `O mesmo efeito que o dono ou que um Lobisomem.`,
                    fr: `Effet du maître qu’il copie ou Loup-garou.`,
                    en: `Uses the poisoned effect of the copied owner, or the Werewolf effect.`
                }
            }
        ],
        objective: {
            pt: `à escolha ou segundo o dono.`,
            fr: `À choix ou selon maître`,
            en: `Player’s choice, or the owner’s objective.`
        }
    },
    "a03": {
        id: "a03",
        group: "complex",
        team: "villagers",
        name: {
            pt: `Mimo`,
            fr: `Mime`,
            en: `Mime`
        },
        mainDescription: {
            pt: [
                `<red>A cada noite</red>, é chamado e é-lhe mostrada uma carta de um jogador em jogo.`,
                `Mal a carta lhe é revelada, o Mimo indica a ação que quer fazer segundo o poder que lhe foi mostrado.`,
                `Todas as interações entre o Narrador e o Mimo são silenciosas, independentemente do poder do personagem.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, il est appelé et voit la carte d’un rôle en jeu.`,
                `Aussitôt la carte révélée, le Mime indique l’action qu’il souhaite prendre selon le pouvoir.`,
                `Toutes les interactions entre le Mime et le Meneur sont complètement silencieuses, indépendamment du rôle copié.`,
            ],
            en: [
                `<red>Each night</red>, is called and shown the card of a role in play.`,
                `As soon as the card is revealed, the Mime indicates the action to perform using that role’s power.`,
                `Every interaction between the Narrator and the Mime is silent, regardless of the copied role.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Efeito do personagem que está a substituir.`,
                    fr: `Effet du personnage qu’il copie.`,
                    en: `Uses the poisoned effect of the copied character.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "a04": {
        id: "a04",
        group: "complex",
        team: "villagersFlex",
        name: {
            pt: `Ator`,
            fr: `Comédien`,
            en: `Actor`
        },
        mainDescription: {
            pt: [
                `<red>Na primeira noite</red>, escolhe um jogador que será o seu Ídolo e que copiará se esse jogador morrer. O poder só lhe é revelado quando o Ídolo morrer.`,
                `Pode trocar de Ídolo <red>duas vezes durante o jogo</red> (👈/👎).`,
            ],
            fr: [
                `<red>La première nuit</red>, il choisit un joueur qui devient son Idole et dont il copiera les pouvoirs aussitôt que ce dernier meurt. Le rôle lui est seulement révélé après la mort de l’Idole.`,
                `Il peut changer son Idole <red>deux fois par jeu</red> (👈/👎).`,
            ],
            en: [
                `<red>On the first night</red>, chooses a player as an Idol and copies that player if the Idol dies. The copied power is only revealed after the Idol dies.`,
                `May change Idols <red>twice during the game</red> (👈/👎).`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Efeito do personagem que está a substituir.`,
                    fr: `Effet du personnage qu’il copie.`,
                    en: `Uses the poisoned effect of the copied character.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens. (flexivel)`,
            fr: `Tuer tous les Loups-garous. (flexible)`,
            en: `Kill all Werewolves. (Flexible)`
        }
    },
    "a05": {
        id: "a05",
        group: "complex",
        team: "villagersFlex",
        name: {
            pt: `Rouba-Túmulos`,
            fr: `Pilleur de Tombes`,
            en: `Grave Robber`
        },
        mainDescription: {
            pt: [
                `<red>A cada noite</red>, é-lhe mostrado as vítimas.`,
                `Sem saber os seus poderes, o Rouba-Túmulos pode escolher trocar de papel com uma delas (👈/👎).`,
                `Uma vez a vítima escolhida, o seu papel lhe será revelado.`,
                `O Rouba-Túmulos usa permanentemente esses poderes em vez do seu. A vítima se torna Rouba-Túmulos.`,
                `O Rouba-Túmulos será chamado pelo nome do personagem que substituiu desde então.`,
            ],
            fr: [
                `<red>Chaque nuit</red> est montré les joueurs  <red>assassinés</red>.`,
                `Sans savoir leurs pouvoirs, le Pilleur de Tombe peut choisir changer de carte avec une des victimes (👈/👎).`,
                `Une fois choisi, le rôle lui sera révélé.`,
                `Le Pilleur de Tombes devient permanemment le rôle volé. La victime devient Pilleur de Tombes.`,
                `Le Pilleur de Tombes sera dorénavant appelé par le nom de son nouveau rôle.`,
            ],
            en: [
                `<red>Each night</red>, is shown the victims.`,
                `Without knowing their powers, the Grave Robber may choose to swap roles with one of them (👈/👎).`,
                `After a victim is chosen, that role is revealed.`,
                `The Grave Robber permanently uses the stolen powers instead of their own. The victim becomes the Grave Robber.`,
                `From then on, the Grave Robber is called by the name of the character they replaced.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Não acorda.`,
                    fr: `Ne se réveille pas.`,
                    en: `Does not wake up.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens. (flexivel)`,
            fr: `Tuer tous les Loups-garous. (flexible)`,
            en: `Kill all Werewolves. (Flexible)`
        }
    },
    "a06": {
        id: "a06",
        group: "complex",
        team: "evilBeing",
        name: {
            pt: `Ilusionista`,
            fr: `Illusionniste`,
            en: `Illusionist`
        },
        mainDescription: {
            pt: [
                `<red>NÃO</red> ACORDA COM OS LOBISOMENS.`,
                `<red>Cada noite</red>, escolhe um jogador (pode ser a si próprio). Esse jogador estará escondido por uma Ilusão.`,
                `Se a Vidente, Lobisomem-Vidente, Domador da Aranha, Faroleiro ou Espião virem uma Ilusão, verão o papel “Ilusionista”.`,
                `Se o Mimo copia uma Ilusão, ele copia o Ilusionista.`,
                `Se o alvo de um dos Domadores de Animais for uma Ilusão, o animal ficará confuso. No caso do Domador da Aranha, se o jogador com a teia de aranha for uma Ilusão, a aranha estará confusa.`,
                `Se o assassino da vítima escolhida pela Menina for uma Ilusão, a Menina verá o papel “Ilusionista”.`,
                `Se o jogador acusado pelo Pedro for uma Ilusão, o Pedro recebe como informação que esse jogador não é Lobisomem, mesmo se for.`,
            ],
            fr: [
                `<red>NE</red> SE RÉVEILLE <red>PAS</red> AVEC LES LOUPS-GAROUS.`,
                `<red>Chaque nuit</red>, il choisit un joueur (qui peut être soi-même). Celui-ci sera offusqué par une Illusion.`,
                `Si la Voyante, Loup-garou Voyante, le Maître de l’Araignée, le Falotier ou l’Espion voient une Illusion, ils verront le rôle “Illusionniste”.`,
                `Si le Mime copie une Illusion, il copiera l'Illusionniste.`,
                `Si l’une des cibles des Maîtres des Animaux est une Illusion, l’animal sera confus. Dans le cas du Maître de l’Araignée, si le joueur avec la toile d’araignée est une Illusion, l’araignée sera confuse.`,
                `Si l’assassin de la victime choisi par la Petite Fille est une Illusion, la Petite Fille verra le rôle “Illusionniste”.`,
                `Si le joueur accusé par l’Enfant est une Illusion, l’Enfant recevra l’information que le joueur n’était pas un Loup-garou, même s’il s’en agissait d’un.`,
            ],
            en: [
                `<red>DOES NOT</red> WAKE UP WITH THE WEREWOLVES.`,
                `<red>Each night</red>, chooses a player, possibly themself. That player is hidden by an Illusion.`,
                `If the Fortune Teller, Werewolf Seer, Spider Tamer, Lamplighter, or Spy sees an Illusion, they see the “Illusionist” role.`,
                `If the Mime copies an Illusion, the Mime copies the Illusionist.`,
                `If a target of an Animal Tamer is an Illusion, the animal becomes confused. For the Spider Tamer, the spider becomes confused if the webbed player is an Illusion.`,
                `If the killer of the victim selected by the Little Girl is an Illusion, the Little Girl sees the “Illusionist” role.`,
                `If the player accused by the Boy is an Illusion, the Boy is told that the player was not a Werewolf, even when they were.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `A ilusão não acontecerá.`,
                    fr: `L’Illusion ne sera pas créée.`,
                    en: `The Illusion is not created.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Aldeões.`,
            fr: `Tuer tous les Villageois.`,
            en: `Kill all Villagers.`
        }
    },
    "as01b": {
        id: "as01b",
        group: "complex",
        team: "solo",
        name: {
            pt: `Amante Secreto`,
            fr: `Arnacœur`,
            en: `Secret Lover`
        },
        mainDescription: {
            pt: [
                `<red>A cada noite</red> aponta para um jogador e o Narrador informa-lhe se é um dos <red>Namorado</red>s (👍) ou não (👎).`,
                `Se o jogador for um dos Namorados, este será informado, e o Amante Secreto <red>substituirá o outro</red> Namorado sem que esse o saiba.`,
                `Se o Traidor ou o Amante Secreto morrerem, o Traído não morre.`,
                `A flecha de proteção do Cupido também protege a identidade dos Namorados (a resposta será 👎).`,
            ],
            fr: [
                `<red>Chaque nuit</red>, il montre un joueur du doigt et le Meneur lui révèle s’il s’agit d’un des Amoureux (👍) ou pas (👎).`,
                `Si le joueur est un des Amouruex, celui-ci sera informé, et l’Arnacoeur <red>remplacera l’autre Amoureux</red> sans que celui-ci le sache.`,
                `Si le Traître ou l’Arnacoeur meurt, le Trahi ne mourra pas.`,
                `La flèche de protection de Cupidon protège également l'identité des Amoureux (la réponse sera 👎).`,
            ],
            en: [
                `<red>Each night</red>, points at a player, and the Narrator reveals whether that player is one of the <red>Lovers</red> (👍) or not (👎).`,
                `If the player is a Lover, that Lover is informed, and the Secret Lover <red>replaces the other Lover</red> without the other player knowing.`,
                `If the Traitor or the Secret Lover dies, the Betrayed player does not die.`,
                `Cupid’s protective arrow also protects the Lovers’ identities, so the answer will be 👎.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `O Narrador anuncia que um dos Namorados foi traído.`,
                    fr: `Le Meneur annonce qu’un des Amoureux a été remplacé.`,
                    en: `The Narrator announces that one of the Lovers was betrayed.`
                }
            }
        ],
        objective: {
            pt: `O Amante Secreto e o Traidor serem os únicos sobreviventes.`,
            fr: `Que l’Arnacoeur et le Traître soient les derniers survivants.`,
            en: `The Secret Lover and the Traitor must be the only survivors.`
        }
    },
    "l01": {
        id: "l01",
        group: "lame",
        team: "villagers",
        name: {
            pt: `Aldeão Triste`,
            fr: `Villageois Triste`,
            en: `Sad Villager`
        },
        mainDescription: {
            pt: [
                `Sem poder especial.`,
            ],
            fr: [
                `Sans pouvoir spéciaux.`,
            ],
            en: [
                `Has no special power.`
            ]
        },
        details: [],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "l02": {
        id: "l02",
        group: "lame",
        team: "villagersFlex",
        name: {
            pt: `Criança Selvagem`,
            fr: `Enfant Sauvage`,
            en: `Wild Child`
        },
        mainDescription: {
            pt: [
                `<red>Na segunda noite</red> escolhe um jogador como Pai Adotivo.`,
                `<red>Se o Pai Adotivo morrer</red>, a Criança Selvagem, se transforma em Lobisomem.`,
            ],
            fr: [
                `<red>La deuxième nuit</red>, il choisit un joueur comme Père Adoptif.`,
                `<red>Si le Père Adoptif meurt</red>, l’Enfant Sauvage se transforme en Loup-garou.`,
            ],
            en: [
                `<red>On the second night</red>, chooses a player as an Adoptive Parent.`,
                `<red>If the Adoptive Parent dies</red>, the Wild Child becomes a Werewolf.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Transforma-se em Lobisomem.`,
                    fr: `Il se transforme en Loup-garou.`,
                    en: `Becomes a Werewolf.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens. (flexível)`,
            fr: `Tuer tous les Loups-garous. (flexible)`,
            en: `Kill all Werewolves. (Flexible)`
        }
    },
    "l03": {
        id: "l03",
        group: "lame",
        team: "villagersFlex",
        name: {
            pt: `Irmãs`,
            fr: `Sœurs`,
            en: `Sisters`
        },
        mainDescription: {
            pt: [
                `As Irmãs conhecem-se.`,
                `Se uma irmã for <red>executada</red>, a outra pode <red>escolher</red> se vingar, tornando-se uma Criatura Malvada.`,
                `Ela acorda <red>SÓ UMA VEZ</red> com os Lobisomens na próxima noite, para que eles saibam que ela os vai ajudar durante o dia.`,
            ],
            fr: [
                `Les Soeurs se connaissent.`,
                `Si une soeur est <red>exécutée</red>, l’autre peut <red>choisir</red> de se venger, se transformant en Créature Maléfique.`,
                `Elle se réveille <red>UNE FOIS</red> avec les Loups-garous la nuit suivante pour qu’ils sachent qu’elle les aidera.`,
            ],
            en: [
                `The Sisters recognize each other.`,
                `If one Sister is <red>executed</red>, the other may <red>choose</red> revenge and become an Evil Being.`,
                `She wakes up with the Werewolves <red>ONLY ONCE</red> on the following night so they know she will help them during the day.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenada enquanto Criatura Malvada:`,
                    fr: `Si empoisonnée en tant que Créature Maléfique :`,
                    en: `If poisoned while an Evil Being:`
                },
                description: {
                    pt: `Se torna num Lobisomem.`,
                    fr: `Elle se transforme en Loup-garou.`,
                    en: `Becomes a Werewolf.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens. (flexível)`,
            fr: `Tuer tous les Loups-garous. (flexible)`,
            en: `Kill all Werewolves. (Flexible)`
        }
    },
    "l04": {
        id: "l04",
        group: "lame",
        team: "villagers",
        name: {
            pt: `Irmãos`,
            fr: `Frères`,
            en: `Brothers`
        },
        mainDescription: {
            pt: [
                `Os Irmãos conhecem-se.`, `Enquanto pelo menos dois irmãos sobreviverem à noite, nenhum morre.`,
            ],
            fr: [
                `Les Frères se connaissent.`, `Tant qu’au moins deux survivent la nuit, aucun d’eux ne meurt.`,
            ],
            en: [
                `The Brothers recognize each other.`,
                `As long as at least two Brothers survive the night, none of them dies.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se qualquer um estiver envenenado:`,
                    fr: `Si  n’importe quel Frère empoisonné :`,
                    en: `If any Brother is poisoned:`
                },
                description: {
                    pt: `Morre na mesma.`,
                    fr: `Il meurt tout de même.`,
                    en: `That Brother dies anyway.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "l05": {
        id: "l05",
        group: "lame",
        team: "villagers",
        name: {
            pt: `Astrônomo`,
            fr: `Astronome`,
            en: `Astronomer`
        },
        mainDescription: {
            pt: [
                `Na noite seguinte à morte do Astrônomo, os Lobisomens não acordam, pois a Lua está triste.`,
            ],
            fr: [
                `La nuit qui suit la mort de l'Astronome, les Loups-garous ne se réveillent pas, car la Lune est triste.`,
            ],
            en: [
                `On the night after the Astronomer dies, the Werewolves do not wake up because the Moon is sad.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Sem efeito.`,
                    fr: `Sans effet.`,
                    en: `No effect.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "l06": {
        id: "l06",
        group: "lame",
        team: "villagers",
        name: {
            pt: `Serva Devota`,
            fr: `Servante Dévouée`,
            en: `Devout Servant`
        },
        mainDescription: {
            pt: [
                `<red>Cada noite</red> é avisado sobre os jogadores <red>assassinados</red> e pode escolher salvar um deles.`,
                `Ao fazer isso, a Serva Devota <red>suicida-se</red>.`,
            ],
            fr: [
                `<red>Chaque nuit</red> est montré les joueurs <red>assassinés</red> et peut choisir de sauver l’un d’entre eux.`,
                `Pour le faire, la Servante Dévouée <red>se suicide</red>.`,
            ],
            en: [
                `<red>Each night</red>, is shown the players who were <red>assassinated</red> and may choose to save one of them.`,
                `To do so, the Devout Servant <red>commits suicide</red>.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Não salva o jogador.`,
                    fr: `Ne sauve pas le joueur.`,
                    en: `Does not save the player.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "x01": {
        id: "x01",
        group: "extra",
        team: "extra",
        name: {
            pt: `Aldeões`,
            fr: `Villageois`,
            en: `Villagers`
        },
        mainDescription: {
            pt: [
                `Assustados e desconfiados, os Aldeões mentem, tentam encontrar em quem podem confiar e usam os seus poderes para matar e executar todos os Lobisomens e outras Criaturas Malvadas antes que esses consigam apoderar-se da Aldeia.`,
            ],
            fr: [
                `Effrayés et méfiants, les Villageois mentent, tentent de trouver des personnes dignes de confiance et utilisent leurs pouvoirs pour tuer et exécuter tous les Loups-garous et autres Créatures Maléfiques avant que ceux-ci ne s'emparent du village.`,
            ],
            en: [
                `Frightened and suspicious, the Villagers lie, try to determine whom they can trust, and use their powers to kill and execute every Werewolf and other Evil Being before those enemies take control of the Village.`
            ]
        },
        details: [],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },
    "x02": {
        id: "x02",
        group: "extra",
        team: "extra",
        name: {
            pt: `Criaturas Malvadas`,
            fr: `Créatures Maléfiques`,
            en: `Evil Beings`
        },
        mainDescription: {
            pt: [
                `Inclui todos os inimigos dos Aldeões, esses sendo Lobisomens ou outros personagens malvados.`,
                `O objetivo de todas as Criaturas Malvadas é o mesmo: matar todos os Aldeões, antes destes conseguirem encontrar todos os Lobisomens.`,
            ],
            fr: [
                `Inclut tous les ennemis des Villageois, ceux-là étant les Loups-garous ou les autres personnages maléfiques.`,
                `L’objectif de toutes les Créatures Maléfiques est le même : tuer tous les Villageois, avant que ces derniers ne trouvent tous les Loups-garous.`,
            ],
            en: [
                `Includes all enemies of the Villagers, whether they are Werewolves or other evil characters.`,
                `All Evil Beings share the same objective: kill all Villagers before the Villagers find every Werewolf.`
            ]
        },
        details: [],
        objective: {
            pt: `Matar todos os Aldeões.`,
            fr: `Tuer tous les Villageois.`,
            en: `Kill all Villagers.`
        }
    },
    "x02.1": {
        id: "x02.1",
        group: "extra",
        team: "extra",
        name: {
            pt: `Lobisomens`,
            fr: `Loups-garous`,
            en: `Werewolves`
        },
        mainDescription: {
            pt: [
                `É o grupo que mais aterroriza os Aldeões.`,
                `Cada noite têm que escolher em unanimidade quem querem assassinar, tentando eliminar os Aldeões mais poderosos primeiro, com a ajuda das outras Criaturas Malvadas.`,
            ],
            fr: [
                `C’est le groupe qui terrorise le plus les Villageois.`,
                `Chacun doit choisir unanimement qui ils assassineront, dans le but de tuer les Villageois plus puissants en premier, avec l’aide des autres Créatures Maléfiques.`,
            ],
            en: [
                `The group that terrifies the Villagers most.`,
                `Each night, they must unanimously choose whom to assassinate, trying to eliminate the most powerful Villagers first with help from the other Evil Beings.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se qualquer Lobisomem estiver envenenado:`,
                    fr: `Si n’importe quel Loup-garou est empoisonné :`,
                    en: `If any Werewolf is poisoned:`
                },
                description: {
                    pt: `Não podem matar.`,
                    fr: `Ils ne peuvent pas tuer.`,
                    en: `They cannot kill.`
                }
            }
        ],
        objective: {
            pt: `Matar todos os Aldeões.`,
            fr: `Tuer tous les Villageois.`,
            en: `Kill all Villagers.`
        }
    },
    "x03": {
        id: "x03",
        group: "extra",
        team: "extra",
        name: {
            pt: `Fantasma`,
            fr: `Fantômes`,
            en: `Ghosts`
        },
        mainDescription: {
            pt: [
                `Há dois tipos de morte: <red>EXECUÇÃO</red> (condenados pela aldeia) ou <red>ASSASSINATO</red> (mortos pelo poder de um personagem).`,
                `Quando um jogador é morto durante a noite, só morre mesmo de manhã, ao acordar, assim durante aquela noite podem continuar a usar os seus poderes.`,
                `Os jogadores mortos transformam-se em fantasmas, que podem continuar a comunicar com a aldeia durante o dia, mas não podem falar ou votar no tribunal, e <red>perdem qualquer poder que tinham</red> (a não ser que esteja escrito o contrário na ficha de personagem.)`,
                `<red>Os Fantasmas TAMBÉM DORMEM À NOITE</red>.`,
            ],
            fr: [
                `Il existe deux types de mort : <red>EXÉCUTION</red> (condamnés par le village) ou <red>ASSASSINAT</red> (tués par le pouvoir d'un personnage).`,
                `Lorsqu'un joueur est tué pendant la nuit, il ne meurt réellement que le matin, au réveil, et peut donc continuer à utiliser ses pouvoirs pendant la nuit.`,
                `Les joueurs morts se transforment en Fantômes, qui peuvent continuer à communiquer avec le village pendant la journée, mais ne peuvent ni parler ni voter au tribunal, et <red>perdent tous les pouvoirs qu'ils avaient</red> (sauf indication contraire dans la fiche de personnage).`,
                `<red>Les fantômes DORMENT ÉGALEMENT LA NUIT</red>.`,
            ],
            en: [
                `There are two kinds of death: <red>EXECUTION</red> (condemned by the village) and <red>ASSASSINATION</red> (killed by a character’s power).`,
                `When a player is killed during the night, they do not truly die until morning, when the village wakes up. They may therefore continue using their powers during that night.`,
                `Dead players become Ghosts. They may continue communicating with the village during the day, but may not speak or vote at the Tribunal and <red>lose every power they had</red>, unless their character card says otherwise.`,
                `<red>GHOSTS ALSO SLEEP AT NIGHT</red>.`
            ]
        },
        details: [],
        objective: {
            pt: `Fantasmas guardam o mesmo objetivo que enquanto vivos.`,
            fr: `Les Fantômes gardent le même objectif que lorsqu'ils étaient vivants.`,
            en: `Ghosts keep the same objective they had while alive.`
        }
    },
    "x.v09": {
        id: "x.v09",
        group: "extra",
        team: "extra",
        name: {
            pt: `Soldado`,
            fr: `Soldat`,
            en: `Soldier`
        },
        mainDescription: {
            pt: [
                `Criado pelo Capitão.`,
                `<red>Uma vez morto</red>, será acordado na próxima noite para escolher <red>um</red> jogador que deverá assassinar.`,
            ],
            fr: [
                `Créé par le Capitaine.`,
                `<red>Une fois mort</red>, il sera réveillé la prochaine nuit et choisira <red>un</red> joueur qui sera assassiné.`,
            ],
            en: [
                `Created by the Captain.`,
                `<red>After dying</red>, wakes up the following night and chooses <red>one</red> player to assassinate.`
            ]
        },
        details: [
            {
                title: {
                    pt: `Se envenenado:`,
                    fr: `Si empoisonné :`,
                    en: `If poisoned:`
                },
                description: {
                    pt: `Sem efeito.`,
                    fr: `Sans effet.`,
                    en: `No effect.`
                }
            }
        ],
        objective: {
            pt: `Não muda.`,
            fr: `Ne change pas.`,
            en: `Does not change.`
        }
    },
    "x.s01": {
        id: "x.s01",
        group: "extra",
        team: "extra",
        name: {
            pt: `Namorado`,
            fr: `Amoureux`,
            en: `Lover`
        },
        mainDescription: {
            pt: [
                `Conhece a identidade do outro Namorado.`,
                `Se um morrer, o outro suicida-se.`,
                `Se a vítima for imune ou for salva, ninguém morre.`,
                `Se o suicida for imune ou salvo, ele não morre.`,
            ],
            fr: [
                `Les Amoureux se connaissent.`,
                `Si l’un meurt, l’autre se suicide.`,
                `Si la victime de l’assassinat est immune ou sauvée, aucun des deux ne meurt.`,
                `Si le suicidaire est immune ou sauvé, seul lui survivra.`,
            ],
            en: [
                `Knows the identity of the other Lover.`,
                `If one Lover dies, the other commits suicide.`,
                `If the assassination victim is immune or saved, neither Lover dies.`,
                `If the Lover who would commit suicide is immune or saved, that Lover survives.`
            ]
        },
        details: [],
        objective: {
            pt: `Os Namorados serem os únicos sobreviventes.`,
            fr: `Que les Amoureux soient les derniers survivants.`,
            en: `The Lovers must be the only survivors.`
        }
    },
    "x.as01b.1": {
        id: "x.as01b.1",
        group: "extra",
        team: "extra",
        name: {
            pt: `Traidor`,
            fr: `Traître`,
            en: `Traitor`
        },
        mainDescription: {
            pt: [
                `Conhece a identidade do Amante Secreto.`,
                `Se um morrer, o outro suicida-se.`,
                `Se a vítima for imune ou for salva, ninguém morre.`,
                `Se o suicida for imune ou salvo, ele não morre.`,
            ],
            fr: [
                `Connaît l’Arnacoeur.`,
                `Si l’un meurt, l’autre se suicide.`,
                `Si la victime de l’assassinat est immune ou sauvée, aucun des deux ne meurt.`,
                `Si le suicidaire est immune ou sauvé, seul lui survivra.`,
            ],
            en: [
                `Knows the identity of the Secret Lover.`,
                `If one dies, the other commits suicide.`,
                `If the assassination victim is immune or saved, neither dies.`,
                `If the player who would commit suicide is immune or saved, that player survives.`
            ]
        },
        details: [],
        objective: {
            pt: `O Amante Secreto e o Traidor serem os únicos sobreviventes.`,
            fr: `Que l’Arnacoeur et le Traître soient les derniers survivants..`,
            en: `The Secret Lover and the Traitor must be the only survivors.`
        }
    },
    "x.as01b.2": {
        id: "x.as01b.2",
        group: "extra",
        team: "extra",
        name: {
            pt: `Traído`,
            fr: `Trahi`,
            en: `Betrayed`
        },
        mainDescription: {
            pt: [
                `Não sabe que é o Traído, continua a agir como um Namorado até o descobrir.`,
                `Se o Traidor ou o Amante Secreto morrerem, o Traído não morre.`,
            ],
            fr: [
                `Ne sait pas qu’il est Trahi, continue d’agir comme un Amoureux tant qu’il ne le découvre pas.`,
                `Si le Traître ou l’Arnacoeur meurt, le Trahi ne meurt pas.`,
            ],
            en: [
                `Does not know they are the Betrayed player and continues acting as a Lover until discovering the betrayal.`,
                `If the Traitor or the Secret Lover dies, the Betrayed player does not die.`
            ]
        },
        details: [],
        objective: {
            pt: `O do papel original.`,
            fr: `Celui du rôle original.`,
            en: `The original role’s objective.`
        }
    },
    "x.m05": {
        id: "x.m05",
        group: "extra",
        team: "extra",
        name: {
            pt: `Inimigo`,
            fr: `Ennemi`,
            en: `Enemy`
        },
        mainDescription: {
            pt: [
                `Se um Inimigo conseguir condenar o outro a <red>execução</red>, o primeiro recebe imunidade contra a próxima tentativa de <red>assassinato</red>.`,
                `<red>A cada vez que um dos Inimigos morre</red>, o Cupido Malvado é acordado para escolher um novo Inimigo para o sobrevivente.`,
            ],
            fr: [
                `Si un Ennemis arrive à amener l’autre à <red>exécution</red>, le premier reçoit immunité contre le prochain <red>assassinat</red>.`,
                `<red>Après la mort de chaque Ennemie</red>, le Méchant Cupidon est réveillé pour choisir un nouvel Ennemi pour le survivant.`,
            ],
            en: [
                `If one Enemy manages to have the other <red>executed</red>, the first gains immunity from the next <red>assassination</red> attempt.`,
                `<red>Whenever one Enemy dies</red>, Evil Cupid wakes up and chooses a new Enemy for the survivor.`
            ]
        },
        details: [],
        objective: {
            pt: `Não muda.`,
            fr: `Ne change pas.`,
            en: `Does not change.`
        }
    }
} as const satisfies Record<RulebookCharacterId, RulebookCharacter>;
export const RULEBOOK_CHARACTER_ORDER = [
    "e01",
    "e02",
    "e03",
    "e04",
    "v01",
    "v02",
    "v03",
    "v04",
    "v05",
    "v23",
    "v06",
    "v20",
    "v21",
    "v25",
    "v16",
    "v07",
    "v08",
    "v08b",
    "v09",
    "v10",
    "v11",
    "v12",
    "v13",
    "v14",
    "v15",
    "v22",
    "v17",
    "v18",
    "v19",
    "v24",
    "m01",
    "m02",
    "m03",
    "m06",
    "m04",
    "m05",
    "s01",
    "s02",
    "f01",
    "f02",
    "a01",
    "a02",
    "a03",
    "a04",
    "a05",
    "a06",
    "as01b",
    "l01",
    "l02",
    "l03",
    "l04",
    "l05",
    "l06",
    "x01",
    "x02",
    "x02.1",
    "x03",
    "x.v09",
    "x.s01",
    "x.as01b.1",
    "x.as01b.2",
    "x.m05"
] as RulebookCharacterId[];
export const RULEBOOK_NIGHT_SCRIPT = {
    firstNight: [
        {
            id: "first-general.1",
            refs: ["general"],
            text: {
                pt: `Esta noite não terá mortos.`,
                fr: `Cette nuit n’aura pas de morts.`,
                en: `There will be no deaths tonight.`
            }
        },
        {
            id: "first-general.2",
            refs: ["general"],
            text: {
                pt: `Lançar um d12.`,
                fr: `Lancer un d12.`,
                en: `Roll a d12.`
            }
        },
        {
            id: "first-s01",
            refs: ["s01"],
            text: {
                pt: `O Cupido acorda e escolhe dois jogadores que serão Namorados. O Cupido adormece e os Namorados serão agora tocados e podem se conhecer. Se um Namorado morre, o outro se suicida. O objetivo dos Namorados e do Cupido é que os Namorados sejam os últimos sobreviventes. Enquanto os Namorados estiverem vivos, o jogo continua.`,
                fr: `Cupidon se réveille et choisit deux joueurs qui seront Amoureux. Cupidon s’endort et les Amoureux seront maintenant touchés pour qu’ils se connaissent. Si un Amoureux meurt, l’autre se suicide. L’objectif des Amoureux et de Cupidon est que les Amoureux soient les derniers survivants. Tant que les Amoureux sont en vie, le jeu continue.`,
                en: `Cupid wakes up and chooses two players who will become Lovers. Cupid goes back to sleep, and the Lovers are touched so they can wake up and recognize each other. If one Lover dies, the other commits suicide. The goal of the Lovers and Cupid is for the Lovers to be the last survivors. The game continues for as long as both Lovers are alive.`
            }
        },
        {
            id: "first-m05",
            refs: ["m05"],
            text: {
                pt: `O Cupido Malvado acorda e escolhe dois jogadores que serão Inimigos. O Cupido Malvado adormece e os Inimigos serão tocados e podem se conhecer. Se um Inimigo consegue condenar o outro a execução, o primeiro recebe imunidade na próxima tentativa de assassinato.`,
                fr: `Le Méchant Cupidon se réveille et choisit deux joueurs qui seront Ennemis. Le Méchant Cupidon s’endort et les Ennemis seront maintenant touchés pour qu’ils se connaissent. Si un Ennemi parvient à amener l’autre à exécution, le premier reçoit immunité contre le prochain assassinat.`,
                en: `Evil Cupid wakes up and chooses two players who will become Enemies. Evil Cupid goes back to sleep, and the Enemies are touched so they can wake up and recognize each other. If one Enemy manages to have the other condemned to execution, the first gains immunity from the next assassination attempt.`
            }
        },
        {
            id: "first-l03",
            refs: ["l03"],
            text: {
                pt: `As Irmãs acordam para se conhecerem.`,
                fr: `Les Sœurs se réveillent pour se connaître.`,
                en: `The Sisters wake up to recognize each other.`
            }
        },
        {
            id: "first-l04",
            refs: ["l04"],
            text: {
                pt: `Os Irmãos acordam para se conhecerem.`,
                fr: `Les Frères se réveillent pour se connaître.`,
                en: `The Brothers wake up to recognize each other.`
            }
        },
        {
            id: "first-a04",
            refs: ["a04"],
            text: {
                pt: `O Ator acorda e escolhe um Ídolo cujo poder copiará quando o Ídolo morrer. Só lhe será revelado o poder do Ídolo, na noite a seguir à morte do Ídolo.`,
                fr: `Le Comédien se réveille et choisit une Idole dont il copiera le pouvoir lorsque l’Idole mourra. Son nouveau rôle ne lui sera révélé que la nuit suivant la mort de l’Idole.`,
                en: `The Actor wakes up and chooses an Idol whose power they will copy when the Idol dies. The new role is revealed only on the night after the Idol dies.`
            }
        },
        {
            id: "first-v23",
            refs: ["v23"],
            text: {
                pt: `O Domador da Aranha acorda e escolhe um jogador no qual tece uma teia de aranha. O Domador da Aranha, a cada noite, descobre quais personagens apontaram para esse jogador naquela noite.`,
                fr: `Le Maître de l’Araignée se réveille et choisit un joueur sur lequel il tisse une toile d’araignée. Chaque nuit, le Maître de l’Araignée apprend quels personnages ont désigné ce joueur durant cette nuit.`,
                en: `The Spider Tamer wakes up and chooses a player on whom to weave a spiderweb. Each night, the Spider Tamer learns which characters pointed at that player during the night.`
            }
        },
        {
            id: "first-v03",
            refs: ["v03"],
            text: {
                pt: `O Domador do Corvo acorda e é-lhe revelado o número de Criaturas Malvadas que vivem na Aldeia.`,
                fr: `Le Maître du Corbeau se réveille et apprend le nombre de Créatures Maléfiques en jeu.`,
                en: `The Raven Tamer wakes up and learns how many Evil Beings are in play.`
            }
        },
        {
            id: "first-v04",
            refs: ["v04"],
            text: {
                pt: `O Domador da Raposa acorda e indica três vizinhos. Será-lhe revelado, com o polegar, se um desses três jogadores é uma Criatura Malvada.`,
                fr: `Le Maître du Renard se réveille et indique trois joueurs voisins. Il lui sera révélé, par le pouce, si oui ou non un des joueurs est une Créature Maléfique.`,
                en: `The Fox Tamer wakes up and indicates three neighboring players. A thumb signal reveals whether at least one of those players is an Evil Being.`
            }
        },
        {
            id: "first-v02",
            refs: ["v02"],
            text: {
                pt: `O Urso rosna/não rosna.`,
                fr: `L’Ours grogne / ne grogne pas.`,
                en: `The Bear growls / does not growl.`
            }
        },
        {
            id: "first-v11",
            refs: ["v11"],
            text: {
                pt: `O Chefe da Aldeia acorda e escolhe um jogador que automaticamente terá 2 votos contra ele no próximo Tribunal.`,
                fr: `L’Ancien du Village se réveille et choisit un joueur qui aura automatiquement deux votes contre lui au prochain Tribunal.`,
                en: `The Village Elder wakes up and chooses a player who will automatically have 2 votes against them at the next Tribunal.`
            }
        },
        {
            id: "first-general.3",
            refs: ["general"],
            text: {
                pt: `No fim desta noite ouve-se um uivar. A Aldeia sabe então que os Lobisomens se revelaram e estão com fome. A Aldeia acorda desconfiada de toda a gente.`,
                fr: `En fin de nuit, le village entend l’hurlement d’un loup. Les villageois savent que les Loups-garous sont en ville, et se réveillent méfiants.`,
                en: `At the end of the night, a howl is heard. The Village knows that the Werewolves have revealed themselves and are hungry, and everyone wakes up suspicious.`
            }
        }
    ],
    secondNight: [
        {
            id: "second-f01",
            refs: ["f01"],
            text: {
                pt: `O Ladrão acorda e escolhe com o polegar se quer jogar do lado dos Aldeões ou do lado dos Lobisomens.`,
                fr: `Le Voleur se réveille et choisit du pouce s’il veut être du côté du village ou des loups-garous.`,
                en: `The Thief wakes up and uses a thumb signal to choose whether to play for the Villagers or the Werewolves.`
            }
        },
        {
            id: "second-f02",
            refs: ["f02"],
            text: {
                pt: `O Espião acorda e escolhe com o polegar se quer jogar do lado dos Aldeões ou do lado dos Lobisomens.`,
                fr: `L’Espion se réveille et choisit du pouce s’il veut être du côté du village ou des loups-garous.`,
                en: `The Spy wakes up and uses a thumb signal to choose whether to play for the Villagers or the Werewolves.`
            }
        },
        {
            id: "second-a02",
            refs: ["a02"],
            text: {
                pt: `O Cão-Lobo acorda e diz com o polegar se quer ser um Cão ou um Lobisomem. Se escolher ser um Cão vai indicar um dono, que vai ser tocado e que poderá acordar para conhecer o seu cachorro. É revelado ao Cão o papel do seu dono. A partir deste momento, o Cão acorda sempre com o seu dono e deve também usar o seu poder independentemente do dono. Se escolher ser um Lobisomem, pode voltar a dormir.`,
                fr: `Le Chien-loup se réveille et choisit du pouce s’il veut devenir Chien ou Loup-garou. S’il choisit être Chien, il choisit ensuite un maître qui sera touché et se réveillera pour le connaître. Son rôle est révélé au Chien. Dès lors, le Chien se réveille avec son maître et agit sur ses pouvoirs indépendamment. S’il choisit être Loup-garou, il peut simplement se rendormir.`,
                en: `The Wolf-Dog wakes up and uses a thumb signal to choose whether to become a Dog or a Werewolf. If Dog is chosen, the Wolf-Dog indicates an owner, who is touched and wakes up to meet their puppy. The owner’s role is revealed to the Dog. From then on, the Dog wakes up with the owner and uses the copied power independently. If Werewolf is chosen, the Wolf-Dog goes back to sleep.`
            }
        },
        {
            id: "second-l02",
            refs: ["l02"],
            text: {
                pt: `A Criança Selvagem acorda e escolhe o seu Pai Adotivo. Se este morrer durante o jogo, a Criança Selvagem se tornará um Lobisomem.`,
                fr: `L’Enfant Sauvage se réveille et choisit son Père Adoptif. Si celui-ci meurt pendant le jeu, l’Enfant Sauvage devient un Loup-garou.`,
                en: `The Wild Child wakes up and chooses an Adoptive Parent. If that player dies during the game, the Wild Child becomes a Werewolf.`
            }
        },
        {
            id: "second-general",
            refs: ["general"],
            text: {
                pt: `Os Lobisomens acordam e são-lhe apresentados as Criaturas Malvadas.`,
                fr: `Les Loups-garous se réveillent et les Créatures Maléfiques leur sont présentées.`,
                en: `The Werewolves wake up and are shown the Evil Beings.`
            }
        }
    ],
    normalNight: [
        {
            id: "normal-general",
            refs: ["general"],
            text: {
                pt: `Lançar um d12.`,
                fr: `Lancer un d12.`,
                en: `Roll a d12.`
            }
        },
        {
            id: "normal-v18",
            refs: ["v18"],
            text: {
                pt: `Ressuscitar o jogador salvo pelo Anjo, se aplicável.`,
                fr: `Ressusciter le joueur sauvé par l’Ange.`,
                en: `Resurrect the player saved by the Angel, if applicable.`
            }
        },
        {
            id: "normal-v07.1",
            refs: ["v07"],
            text: {
                pt: `SOUVIENS-TOI (Se o Cavaleiro Enferrujado morreu durante o dia, matar o Lobisomem mais próximo durante o próximo dia).`,
                fr: `SOUVIENS-TOI (Si le Chevalier Rouillé est mort le jour, tuer le Loup-garou le plus proche lors de la prochaine journée).`,
                en: `REMEMBER: If the Rusted Knight died during the day, kill the nearest Werewolf during the following day.`
            }
        },
        {
            id: "normal-v23.1",
            refs: ["v23"],
            text: {
                pt: `(Se o jogador com a teia morreu) O Domador da Aranha acorda e escolhe um novo jogador no qual tece uma teia.`,
                fr: `(Si le joueur pris dans la toile est mort) Le Maître de l’Araignée se réveille et choisit un nouveau joueur sur lequel il tisse sa toile.`,
                en: `If the webbed player died, the Spider Tamer wakes up and chooses a new player on whom to weave the web.`
            }
        },
        {
            id: "normal-v08.1",
            refs: ["v08", "v08b"],
            text: {
                pt: `(Se o Capuchinho Vermelho foi executado) O Caçador acorda furioso e escolhe quem quer assassinar.`,
                fr: `(Si le Petit Chaperon Rouge a été exécuté) Le Chasseur se réveille et indique qui il veut assassiner.`,
                en: `If Little Red Riding Hood was executed, the Hunter wakes up furious and chooses whom to assassinate.`
            }
        },
        {
            id: "normal-v08.2",
            refs: ["v08"],
            text: {
                pt: `(Se o Caçador morreu) O Fantasma do Caçador acorda e escolhe quem quer assassinar.`,
                fr: `(Si le Chasseur est mort) Le Fantôme du Chasseur se réveille et indique qui il veut assassiner.`,
                en: `If the Hunter died, the Hunter’s Ghost wakes up and chooses whom to assassinate.`
            }
        },
        {
            id: "normal-v09.1",
            refs: ["v09"],
            text: {
                pt: `(Se o SOLDADO morreu) O Fantasma do Soldado acorda e escolhe quem quer assassinar.`,
                fr: `(Si le SOLDAT est mort) Le Fantôme du Soldat se réveille et indique qui il veut assassiner.`,
                en: `If the SOLDIER died, the Soldier’s Ghost wakes up and chooses whom to assassinate.`
            }
        },
        {
            id: "normal-a04",
            refs: ["a04"],
            text: {
                pt: `O Ator acorda. Se o seu Ídolo morreu, é-lhe mostrado o papel ao qual irá responder de agora em diante, senão o Ator indica ao apontar outra pessoa se quer trocar de Ídolo.`,
                fr: `Le Comédien se réveille. Si son Idol est mort, le rôle lui est révélé et il répondra à celui-ci dès lors. Sinon il peut indiquer un joueur s’il souhaite changer d’Idol.`,
                en: `The Actor wakes up. If the Idol died, the copied role is revealed and the Actor answers to that role from now on. Otherwise, the Actor points at another player to indicate whether they want to change Idols.`
            }
        },
        {
            id: "normal-m05",
            refs: ["m05"],
            text: {
                pt: `(Se um Inimigo morrer) O Cupido Malvado acorda e escolhe um segundo Inimigo.`,
                fr: `(Si un Ennemi meurt) Le Méchant Cupidon se réveille et choisit un nouvel ennemi.`,
                en: `If an Enemy died, Evil Cupid wakes up and chooses a new Enemy.`
            }
        },
        {
            id: "normal-v16",
            refs: ["v16"],
            text: {
                pt: `O Sonâmbulo acorda e escolhe um jogador para visitar, uma vez a escolha feita, adormece na casa dessa pessoa. Essa pessoa vai ser tocada e sabe que mesmo se for chamada, não acordará.`,
                fr: `Le Somnambule se réveille et indique quel joueur il visitera cette nuit. Une fois le choix fait, il s’endort chez le dernier. Cette personne sera touchée et saura que même si appelée, elle ne se réveillera pas.`,
                en: `The Sleepwalker wakes up and chooses a player to visit. Once the choice is made, the Sleepwalker falls asleep at that player’s home. That player is touched and knows that even if called, they will not wake up.`
            }
        },
        {
            id: "normal-e02",
            refs: ["e02"],
            text: {
                pt: `A Bruxa Malvada acorda e escolhe um jogador que irá envenenar esta noite.`,
                fr: `La Méchante Sorcière se réveille et indique quel joueur elle souhaite empoisonner.`,
                en: `The Evil Witch wakes up and chooses a player to poison tonight.`
            }
        },
        {
            id: "normal-v24",
            refs: ["v24"],
            text: {
                pt: `O Vinicultor acorda e escolhe um jogador que irá envenenar mas que receberá imunidade.`,
                fr: `Le Vigneron se réveille et indique quel joueur il souhaite empoisonner. Le joueur recevra également immunité.`,
                en: `The Vintner wakes up and chooses a player to poison. That player also receives immunity.`
            }
        },
        {
            id: "normal-v20",
            refs: ["v20"],
            text: {
                pt: `A Empregada acorda e é-lhe revelada a distância até a pessoa envenenada.`,
                fr: `La Domestique se réveille et la distance de la personne empoisonnée lui est révélée.`,
                en: `The Housemaid wakes up and learns the distance to the poisoned player.`
            }
        },
        {
            id: "normal-v12",
            refs: ["v12"],
            text: {
                pt: `A Cigana acorda e indica 3 vizinhos. Se um deles estiver envenenado, ele perde o veneno e a Cigana passa a estar envenenada.`,
                fr: `La Gitane se réveille et indique trois joueurs voisins. Si l’un d’eux est empoisonné, il perd son poison et la Gitane devient empoisonnée.`,
                en: `The Gypsy wakes up and indicates three neighboring players. If one is poisoned, that player loses the poison and the Gypsy becomes poisoned.`
            }
        },
        {
            id: "normal-a06",
            refs: ["a06"],
            text: {
                pt: `O Ilusionista acorda e indica o jogador cuja a identidade será obstruída.`,
                fr: `L’Illusionniste se réveille et indique un joueur dont l’identité sera offusquée.`,
                en: `The Illusionist wakes up and indicates the player whose identity will be obscured.`
            }
        },
        {
            id: "normal-e04",
            refs: ["e04"],
            text: {
                pt: `(Se alguém morreu) A Vidente acorda e é-lhe revelado o papel dos mortos de ontem.`,
                fr: `(Si quelqu’un est mort) La Voyante se réveille et les rôles des morts d’hier lui sont révélés.`,
                en: `If someone died, the Fortune Teller wakes up and is shown the roles of those who died yesterday.`
            }
        },
        {
            id: "normal-f02",
            refs: ["f02"],
            text: {
                pt: `O Espião acorda e é-lhe revelado um papel em jogo.`,
                fr: `L’Espion se réveille et un rôle en jeu lui est révélé.`,
                en: `The Spy wakes up and is shown a role that is in play.`
            }
        },
        {
            id: "normal-v03",
            refs: ["v03"],
            text: {
                pt: `O Domador do Corvo acorda e é-lhe revelado o número de Criaturas Malvadas que ainda vivem na Aldeia (ou o Corvo está confuso).`,
                fr: `Le Maître du Corbeau se réveille et apprend le nombre de Créatures Maléfiques en jeu. (ou si le Corbeau est confus)`,
                en: `The Raven Tamer wakes up and learns how many Evil Beings are still alive in the Village, or the Raven is confused.`
            }
        },
        {
            id: "normal-v04",
            refs: ["v04"],
            text: {
                pt: `O Domador da Raposa acorda e indica três vizinhos. Será-lhe revelado, com o polegar, se um desses três jogadores é uma Criatura Malvada (ou se a Raposa está confusa).`,
                fr: `Le Maître du Renard se réveille et indique trois joueurs voisins. Il lui sera révélé, par le pouce, si oui ou non un des joueurs est une Créature Maléfique. (ou si le Renard est confus)`,
                en: `The Fox Tamer wakes up and indicates three neighboring players. A thumb signal reveals whether at least one of those players is an Evil Being, or the Fox is confused.`
            }
        },
        {
            id: "normal-v02",
            refs: ["v02"],
            text: {
                pt: `O Urso rosna/não rosna (/está confuso).`,
                fr: `L’Ours grogne / ne grogne pas. (/ est confus)`,
                en: `The Bear growls / does not growl (/ is confused).`
            }
        },
        {
            id: "normal-v11",
            refs: ["v11"],
            text: {
                pt: `O Chefe da Aldeia acorda e escolhe um jogador que automaticamente terá 2 votos contra ele no próximo Tribunal.`,
                fr: `L’Ancien du Village se réveille et choisit un joueur qui aura automatiquement deux votes contre lui au prochain Tribunal.`,
                en: `The Village Elder wakes up and chooses a player who will automatically have 2 votes against them at the next Tribunal.`
            }
        },
        {
            id: "normal-f01",
            refs: ["f01"],
            text: {
                pt: `O Ladrão acorda e indica a quem quer retirar o voto no próximo Tribunal.`,
                fr: `Le Voleur se réveille et indique à qui il souhaite voler le vote au prochain Tribunal.`,
                en: `The Thief wakes up and indicates whose vote will be removed at the next Tribunal.`
            }
        },
        {
            id: "normal-v09.2",
            refs: ["v09"],
            text: {
                pt: `O Capitão acorda e escolhe um jogador que será um SOLDADO durante esta noite e o próximo dia.`,
                fr: `Le Capitaine se réveille et indique le joueur qui sera un SOLDAT pendant un jour et une nuit.`,
                en: `The Captain wakes up and chooses a player who will be a SOLDIER during this night and the following day.`
            }
        },
        {
            id: "normal-s01",
            refs: ["s01"],
            text: {
                pt: `O Cupido acorda e decide com o polegar se quer usar uma das suas duas flechas de proteção para dar imunidade aos Namorados esta noite.`,
                fr: `Cupidon se réveille et indique s’il veut utiliser une de ses deux flèches de protection pour donner immunité aux Amoureux.`,
                en: `Cupid wakes up and uses a thumb signal to decide whether to spend one of the two protective arrows to grant the Lovers immunity tonight.`
            }
        },
        {
            id: "normal-as01b",
            refs: ["as01b"],
            text: {
                pt: `O Amante Secreto acorda e aponta para um jogador, e será revelado se é um dos Namorados.`,
                fr: `L’Arnaœur se réveille et indique un joueur. Il apprend s’il s’agit d’un des Amoureux.`,
                en: `The Secret Lover wakes up and points at a player, then learns whether that player is one of the Lovers.`
            }
        },
        {
            id: "normal-v17",
            refs: ["v17"],
            text: {
                pt: `O Salvador acorda e indica quem será imune durante esta noite.`,
                fr: `Le Sauveur se réveille et choisit qui sera immune durant cette nuit.`,
                en: `The Saviour wakes up and chooses who will be immune during this night.`
            }
        },
        {
            id: "normal-v15",
            refs: ["v15"],
            text: {
                pt: `O Piromaníaco acorda/não acorda. São-lhe mostradas as pessoas inocentadas no último tribunal. Ele decide, ao indicar ou mostrar o polegar para baixo, se quer ou não incendiar a casa de uma delas.`,
                fr: `Le Pyromane se réveille / ne se réveille pas. Les personnes innocentées au dernier Tribunal lui sont montrées. Il décide, en pointant ou par un pouce vers le bas, s’il veut brûler la maison d’un d’entre eux.`,
                en: `The Pyromaniac wakes up / does not wake up. The players acquitted at the previous Tribunal are shown. By pointing at one of them or showing a thumbs-down, the Pyromaniac decides whether to set one of their homes on fire.`
            }
        },
        {
            id: "normal-v22",
            refs: ["v22"],
            text: {
                pt: `O Pedro acorda (todas as noites). Se ele acusou alguém em Tribunal, é-lhe indicado se essas pessoas são Lobisomens. Relembro que o Pedro não pode levar a mesma pessoa a Tribunal duas vezes.`,
                fr: `L’Enfant se réveille (toutes les nuits). S’il a accusé quelqu’un au dernier Tribunal, il apprend s’il s’agissait d’un Loup-garou. Je rappelle que l’Enfant ne peut pas accuser une même personne au Tribunal deux fois.`,
                en: `The Boy wakes up every night. If the Boy accused anyone at the Tribunal, the Narrator indicates whether those players are Werewolves. Remember that the Boy cannot bring the same player to the Tribunal twice.`
            }
        },
        {
            id: "normal-e01",
            refs: WEREWOLF_ROLES,
            text: {
                pt: `Os Lobisomens acordam/não acordam se envenenados (não acordam se o Astrônomo morreu na última noite) e escolhem em conjunto uma vítima que irão assassinar esta noite.`,
                fr: `Les Loups-garous se réveillent / ne se réveillent pas si empoisonnés. (Ils ne se réveillent pas si l'Astronome est mort la nuit précédente) Ils choisissent ensemble leur victime pour cette nuit.`,
                en: `The Werewolves wake up / do not wake up if poisoned. They also do not wake up if the Astronomer died the previous night. Otherwise, they jointly choose a victim to assassinate tonight.`
            }
        },
        {
            id: "normal-m01",
            refs: ["m01"],
            text: {
                pt: `O Lobisomem Mau acorda e escolhe com o polegar se quer se mascarar de Avózinha esta noite e dia, ou não. Pode usar esse poder duas vezes durante todo o jogo.`,
                fr: `Le Méchant Loup-garou se réveille et indique du pouce s’il veut ou non se déguiser en Grand-maman aujourd’hui. Il ne peut utiliser ce pouvoir que deux fois par jeu.`,
                en: `The Big Bad Werewolf wakes up and uses a thumb signal to choose whether to disguise themself as Grandmother for this night and day. This power may be used twice during the game.`
            }
        },
        {
            id: "normal-m02",
            refs: ["m02"],
            text: {
                pt: `O Lobisomem Vidente acorda/não acorda se envenenado e decide com o polegar se quer salvar a vítima para ver o seu papel ou deixá-la morrer.`,
                fr: `Le Loup-garou Voyant se réveille / ne se réveille pas si empoisonné. Il indique du pouce s’il veut sauver la victime pour savoir son rôle ou la laisser mourir.`,
                en: `The Werewolf Seer wakes up / does not wake up if poisoned and uses a thumb signal to decide whether to save the victim and see their role, or let them die.`
            }
        },
        {
            id: "normal-m03",
            refs: ["m03"],
            text: {
                pt: `O Lobisomem Vampiro acorda/não acorda se salvo pela Vidente ou se envenenado e diz com o polegar se quer transformar a vítima em Lobisomem.`,
                fr: `Le Loup-garou Vampire se réveille / ne se réveille pas si empoisonné ou si la victime a été sauvée par le Loup-garou Voyant. Il indique du pouce s’il veut transformer la victime en Loup-garou.`,
                en: `The Vampire Werewolf wakes up / does not wake up if poisoned or if the victim was saved by the Werewolf Seer, then uses a thumb signal to decide whether to turn the victim into a Werewolf.`
            }
        },
        {
            id: "normal-s02",
            refs: ["s02"],
            text: {
                pt: `(A cada 3 noites) O Lobisomem Branco acorda e escolhe o Lobisomem que quer matar. / O Lobisomem Branco acorda e escolhe mais um jogador que quer matar.`,
                fr: `(Toutes les 3 nuits) Le Loup-garou Blanc se réveille et choisit le Loup-garou qu’il veut tuer. / Le Loup-garou Blanc choisit un joueur supplémentaire qu’il veut tuer.`,
                en: `Every 3 nights, the White Werewolf wakes up and chooses a Werewolf to kill. If the White Werewolf is the only Werewolf, they choose one additional player to kill.`
            }
        },
        {
            id: "normal-v05",
            refs: ["v05"],
            text: {
                pt: `O Domador dos Coelhos ouviu os Coelhos assustados esta noite / [nada] (/os Coelhos estão confusos).`,
                fr: `Le Maître des Lapins a entendu les Lapins effrayés cette nuit / [rien] (/ les Lapins sont confus).`,
                en: `The Rabbit Tamer heard the frightened Rabbits tonight / [nothing] (/ the Rabbits are confused).`
            }
        },
        {
            id: "normal-v25",
            refs: ["v25"],
            text: {
                pt: `O Padre acorda. Se algum jogador quiser se confessar, revelando a sua carta ao Padre, pode levantar a mão. O Padre escolhe um desses jogadores, que será tocado para acordar. Ele vê quem é o Padre e mostra o seu papel.`,
                fr: `Le Prêtre se réveille. Si un joueur souhaite se confesser, révélant ainsi son rôle au Prêtre, il peut lever la main. Le Prêtre choisit l'un de ces joueurs, qui sera touché pour se réveiller. Il voit qui est le Prêtre et montre son rôle.`,
                en: `The Priest wakes up. Any player who wishes to confess by revealing their card to the Priest may raise a hand. The Priest chooses one of those players, who is touched and wakes up. That player sees who the Priest is and shows their role.`
            }
        },
        {
            id: "normal-a03",
            refs: ["a03"],
            text: {
                pt: `O Mimo acorda e é-lhe mostrado um papel em jogo. Ele age silenciosamente segundo esse papel ou recebe as informações que esse papel receberia.`,
                fr: `Le Mîme se réveille et on lui montre un rôle en jeu. Il agit silencieusement selon ce rôle ou reçoit les informations que ce rôle recevrait.`,
                en: `The Mime wakes up and is shown a role that is in play. The Mime silently performs that role’s action or receives the information that role would receive.`
            }
        },
        {
            id: "normal-e03",
            refs: ["e03"],
            text: {
                pt: `O Chaman acorda/não acorda se não houver vítimas e são-lhe apresentadas as vítimas. Ele escolhe então com o polegar se as quer salvar ou não. Relembro que pode salvar duas pessoas durante o jogo todo.`,
                fr: `Le Chaman se réveille / ne se réveille pas s’il n’y a pas de victimes. Les victimes lui sont présentées, puis il choisit avec le pouce s’il veut les sauver ou non. Je rappelle qu’il peut sauver deux personnes pendant toute la partie.`,
                en: `The Shaman wakes up / does not wake up if there are no victims. The victims are shown, and the Shaman uses a thumb signal to choose whether to save them. Remember that the Shaman may save two people during the entire game.`
            }
        },
        {
            id: "normal-l06",
            refs: ["l06"],
            text: {
                pt: `A Serva Devota acorda/não acorda se não houver vítimas e são-lhe apresentadas as vítimas. Ela escolhe então com o polegar se as quer salvar ou não. Ao salvar uma vítima, a Serva Devota suicida-se.`,
                fr: `La Servante Dévouée se réveille  / ne se réveille pas s’il n’y a pas de victimes et les victimes de cette nuit lui sont révélées. Elle choisit s’il souhaite sauver une des victimes. En sauvant une victime, la Servante Dévouée se suicide.`,
                en: `The Devout Servant wakes up / does not wake up if there are no victims. The victims are shown, and the Devout Servant chooses whether to save one of them. When a victim is saved, the Devout Servant commits suicide.`
            }
        },
        {
            id: "normal-v21",
            refs: ["v21"],
            text: {
                pt: `O Faroleiro acorda e é-lhe mostrado um personagem em jogo com um poder limitado e é informado de quantos usos esse personagem ainda tem.`,
                fr: `Le Falotier se réveille et on lui montre un personnage en jeu avec un pouvoir limité, puis on l’informe du nombre d’utilisations qu’il reste à ce personnage.`,
                en: `The Lamplighter wakes up and is shown a character in play with a limited-use power, then learns how many uses that character has left.`
            }
        },
        {
            id: "normal-a05",
            refs: ["a05"],
            text: {
                pt: `O Rouba-Túmulos acorda/não acorda se não houver vítimas e lhe são apresentadas as vítimas. Ele decide, ao indicar ou mostrar com o polegar para baixo, se quer ou não tomar o lugar de uma delas.`,
                fr: `Le Pilleur de Tombes se réveille / ne se réveille pas s’il n’y a pas de victimes. Les victimes lui sont présentées, puis il choisit s’il veut ou non prendre la place de l’une d’elles.`,
                en: `The Grave Robber wakes up / does not wake up if there are no victims. The victims are shown, and the Grave Robber points at one or shows a thumbs-down to choose whether to take a victim’s place.`
            }
        },
        {
            id: "normal-v01",
            refs: ["v01"],
            text: {
                pt: `A Menina acorda/não acorda se não houver vítimas e vê como as vítimas desta noite morreram.`,
                fr: `La Petite Fille se réveille / ne se réveille pas s’il n’y a pas de victimes et voit comment les victimes de cette nuit sont mortes.`,
                en: `The Little Girl wakes up / does not wake up if there are no victims and sees how each of tonight’s victims died.`
            }
        },
        {
            id: "normal-v19",
            refs: ["v19"],
            text: {
                pt: `O Profeta acorda/não acorda se não houver vítimas e indica, ao apontar um jogador que acha que morreu esta noite. Se estiver correto, o jogador será tocado, para saber que pode guardar o seu poder, mesmo como Fantasma, durante o próximo dia e a noite.`,
                fr: `Le Prophète se réveille / ne se réveille pas s’il n’y a pas de victimes et indique un joueur qu’il pense mort cette nuit. S’il a raison, le joueur sera touché pour savoir qu’il peut garder son pouvoir, même comme Fantôme, pendant le jour suivant et la nuit suivante.`,
                en: `The Prophet wakes up / does not wake up if there are no victims and points at a player believed to have died tonight. If correct, that player is touched and learns that they may keep their power as a Ghost during the following day and night.`
            }
        },
        {
            id: "normal-v23.2",
            refs: ["v23"],
            text: {
                pt: `O Domador da Aranha acorda/não acorda se não houver necessidade e é-lhe mostrado todos os papéis dos jogadores que foram apanhados pela teia esta noite.`,
                fr: `Le Maître de l’Araignée se réveille / ne se réveille pas si ce n’est pas nécessaire. Les rôles de tous les joueurs pris dans la toile cette nuit lui sont révélés.`,
                en: `The Spider Tamer wakes up / does not wake up if unnecessary and is shown the roles of all players caught in the web tonight.`
            }
        },
        {
            id: "normal-v07.2",
            refs: ["v07"],
            text: {
                pt: `(Se o Cavaleiro Enferrujado morreu durante a noite, matar o Lobisomem mais próximo no ínicio do próximo Tribunal.)`,
                fr: `(Si le Chevalier Rouillé est mort pendant la nuit, tuer le Loup-garou le plus proche au début du prochain Tribunal.)`,
                en: `If the Rusted Knight died during the night, kill the nearest Werewolf at the start of the next Tribunal.`
            }
        }
    ]
} as const satisfies Record<RulebookNightPhase, readonly RulebookNightScriptLine[]>;
