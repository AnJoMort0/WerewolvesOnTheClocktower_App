import { WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import type { Language } from "@/lib/i18n";
/*
  Rulebook editing and character-adding guide:

  To add a playable character:
  1. Choose a unique id. Existing prefixes are e (essential), v (villager),
     m (evil), s (solo), f (flexible), a (advanced), and l (lame/simple).
  2. Add the card image as src/assets/roles/<id>.png.
  3. Run npm run assets:optimize to generate the display WebP copy. In
     src/lib/roles.ts, import src/assets/display/roles/<id>.webp and add one ROLE_DEFINITIONS entry.
     RoleId is derived automatically. Add the id to EVIL_ROLES, WEREWOLF_ROLES,
     WEB_IMMUNE_ROLES, or INFO_ROLES only when its rules require that behavior.
     New roles are manually selectable as soon as they are registered. Add them
     to an assignment pool only when they are ready for automatic random games.
  4. Add display names to roleLabels in src/lib/i18n/{pt,fr,en}.ts.
  5. Add the full card to RULEBOOK_CHARACTERS below. Its key and id must match
     the playable id, then add that id to RULEBOOK_CHARACTER_ORDER.
  6. If the character wakes at night, add its printed/analog instructions to
     RULEBOOK_NIGHT_SCRIPT. Add the same playable behavior to the in-app scripts
     in all three i18n files only when its game functionality is being implemented.
  7. Add role-specific state or interactions in the relevant game modules and
     cover them with focused tests. Run: npm test, npx tsc --noEmit, npm run lint,
     and npm run build.

  To add a rulebook-only extra card:
  - Use an x-prefixed RulebookCharacterId, add its image import and mapping in
    src/lib/rulebook.ts, then add its card and display order here. Do not add it
    to src/lib/roles.ts unless players can actually be assigned that card.

  Content field notes:
  - Edit RULEBOOK_TEXT.sections for general rulebook text.
    Headings have a stable id for navigation; paragraphs use type: "p";
    story-only paragraphs use type: "lore"; lists have items; notes have lines.
  - Use <red>...</red> inside text when a word should render red.
    **bold** is also supported. [lore]story[/lore] marks a story within rules;
    a leading [lore] without a closing tag styles the entire paragraph as lore.
  - The team field controls a character box's faction accent and tint.
  - Blank lines inside a section text template string create paragraphs.
  - RULEBOOK_NIGHT_SCRIPT feeds the analog character generator's filtered script.
  - Night-script ids use phase + role id; repeated role lines use .1, .2, etc.
  - Keep night-script wording in RULEBOOK_NIGHT_SCRIPT, not RULEBOOK_TEXT.sections.

  To add character lore (inside that character's entry):
    lore: [
        { text: { en: `A story without an explanation.` } },
        {
            text: { en: `A sentence with an inside joke.` },
            explanation: { en: `What this sentence refers to.` }
        }
    ],
  - Add pt and fr alongside en when translations are available. Missing lore
    translations fall back to English. Keep rules in mainDescription/details.
  - Split passages into separate entries to attach a note to just one sentence.
    Only passages with explanation get a bubble on hover or tap.
  - Omit lore when unavailable: no empty disclosure will be shown.
  - Character entries have id/name landmarks below; display order is separate.
*/
// ============================================================================
// CONTENT TYPES
// ============================================================================

export type RulebookCharacterId = RoleId | "x01" | "x02" | "x02.1" | "x03" | "x.v09" | "x.s01" | "x.as01b.1" | "x.as01b.2" | "x.m05";
export type RulebookGroupId = "essential" | "villager" | "evil" | "solo" | "flexible" | "complex" | "lame" | "extra";
export type RulebookTeam = "villagers" | "evilBeing" | "solo" | "flexible" | "villagersFlex" | "extra";
export type LocalizedText = Record<Language, string>;
export type RulebookSectionBlock = {
    type: "h2" | "h3" | "h4";
    id: string;
    text: string;
} | {
    type: "p" | "lore";
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
    /** Story passages, separate from mechanics. Missing translations fall back to English. */
    lore?: Array<{
        text: Partial<LocalizedText>;
        /** Optional inside-joke explanation for this passage: hover on PC, tap on mobile. */
        explanation?: Partial<LocalizedText>;
    }>;
    mainDescription: Record<Language, string[]>;
    details: Array<{
        title: LocalizedText;
        description: LocalizedText;
    }>;
    objective?: LocalizedText;
};
// ============================================================================
// GENERAL RULES AND NAVIGATION TEXT — edit the language sections below
// ============================================================================

export const RULEBOOK_TEXT = {
    loreLabel: { pt: `História`, fr: `Histoire`, en: `Lore` },
    loreExplanationLabel: { pt: `Por trás da história`, fr: `Derrière l'histoire`, en: `Behind the story` },
    navigationLabel: { pt: `Navegação do livro de regras`, fr: `Navigation du livret de règles`, en: `Rulebook navigation` },
    basicsLabel: { pt: `Como jogar`, fr: `Comment jouer`, en: `How to play` },
    charactersLabel: { pt: `Personagens`, fr: `Personnages`, en: `Characters` },
    title: { pt: `Lobisomens da Torre Sangrenta`, fr: `Loups-garous de la Tour Sanglante`, en: `Werewolves of the Clocktower` },
    quickListTitle: { pt: `Lista rápida de personagens`, fr: `Liste rapide de personnages`, en: `Quick character list` },
    quickListIntro: { pt: `Escolhe uma personagem para ir diretamente à sua ficha abaixo.`, fr: `Choisis un personnage pour accéder directement à sa fiche ci-dessous.`, en: `Choose a character to jump directly to its entry below.` },
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
        { id: "lame", label: { pt: `Personagens forretas`, fr: `Personnages nuls`, en: `Lame characters` } },
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
        // PORTUGUESE — general rules
        pt: [
            {
                type: `h2`,
                id: `base`,
                text: `Como jogar`
            },
            {
                type: `h3`,
                id: `about`,
                text: `O que é Lobisomens da Torre Sangrenta?`
            },
            {
                type: `p`,
                text: `Lobisomens da Torre Sangrenta é uma versão personalizada do jogo de dedução social Os Lobisomens da Aldeia Velha, criado por Philippe des Pallières e Hervé Marly e adaptado aqui por AnJoMorto e L_PT_1463.

Cada jogador recebe uma personagem secreta com um poder ou objetivo que influencia a forma como ajuda a sua equipa a ganhar. Os dias, tribunais e noites alternam enquanto a aldeia tenta identificar e eliminar os Lobisomens antes que estes eliminem os Aldeões.

Esta versão amplia vários poderes conhecidos e introduz personagens originais. A morte não te retira do jogo: continuas a jogar como Fantasma.`
            },
            {
                type: `h3`,
                id: `context`,
                text: `Bem-vindo a Freeborough`
            },
            {
                type: `lore`,
                text: `Freeborough tem um grande problema: pessoas muito reservadas e, mais urgentemente, Criaturas Malvadas. Os Lobisomens e os seus Aliados infiltraram-se na população, trazendo caos, morte e destruição. Com os Lobisomens a matar todas as noites, os Aldeões têm de os encontrar e executar. Mas em quem podem confiar?

Detalhe aleatório: a hidratação é muito valorizada em Freeborough. Todos deixam uma bebida junto à cama ou ao local de trabalho, pronta para a próxima vez que acordarem a meio da noite.`
            },
            {
                type: `h3`,
                id: `setup`,
                text: `Preparação`
            },
            {
                type: `list`,
                ordered: true,
                items: [
                    `Escolhe um Narrador e pelo menos oito jogadores. O Narrador orienta as ações noturnas e modera o Tribunal.`,
                    `Senta os jogadores em círculo. Todos devem memorizar o seu lugar e regressar a ele em todas as noites e tribunais.`,
                    `O Narrador atribui a cada jogador uma carta de personagem aleatória e secreta.`,
                    `Coloca duas cadeiras adicionais na parte de baixo do círculo: uma para o Procurador e outra para o Acusado.`,
                ]
            },
            {
                type: `h3`,
                id: `phases`,
                text: `O ciclo do jogo`
            },
            {
                type: `p`,
                text: `O jogo começa com uma primeira noite para obter informações e preparar os poderes. Ninguém pode morrer nesta primeira noite. Seguem-se o primeiro dia e Tribunal, segundo as regras habituais.

Depois, o ciclo repete-se: **Noite → Dia → Tribunal → Noite**.`
            },
            {
                type: `h3`,
                id: `course-of-the-day`,
                text: `Dia · cinco minutos`
            },
            {
                type: `p`,
                text: `Circula pela aldeia (a sala ou o edifício onde estão a jogar) e conversa em privado com outros jogadores. Ficar no teu lugar dificulta a criação de alianças, a troca de informações e a persuasão.

Podes escutar conversas alheias, mas, se um grupo te descobrir e pedir que te afastes, respeita o pedido. Não voltes a escutar esse grupo durante o resto do dia.

Podes **dizer** qualquer coisa: revelar a tua personagem, mentir sobre ela, partilhar informações ou fazer bluff. No fim do dia, regressa ao teu lugar habitual para o Tribunal.`
            },
            {
                type: `note`,
                lines: [
                    `**Diz; não mostres.** Mantém a tua carta de personagem secreta. É proibido mostrá-la!`,
                    `Regressa sempre ao mesmo lugar!.`,
                ]
            },
            {
                type: `h3`,
                id: `tribunal`,
                text: `Tribunal · três minutos`
            },
            {
                type: `p`,
                text: `Os jogadores vivos podem acusar, falar nas etapas permitidas e votar. Os Fantasmas podem observar, mas não podem falar, acusar ou votar. Não há discussão geral: pede uma acusação antes de falar e mantém o silêncio fora da tua vez.

Qualquer jogador vivo pode acusar outro jogador vivo para o interrogar enquanto houver tempo.`
            },
            {
                type: `h4`,
                id: `tribunal-process`,
                text: `Uma acusação, passo a passo`
            },
            {
                type: `list`,
                ordered: true,
                items: [
                    `O jogador que acusa senta-se na cadeira do Procurador; o jogador acusado senta-se na cadeira do Acusado.`,
                    `O Procurador apresenta a acusação sem interrupções.`,
                    `O Acusado apresenta a sua defesa sem interrupções.`,
                    `Os jogadores vivos da aldeia podem fazer perguntas ao Acusado. O Acusado pode responder, mas esta etapa não é uma discussão livre.`,
                    `Quando terminam as perguntas, os jogadores votam levantando a mão para executar o Acusado.`,
                    `Para haver uma execução, pelo menos metade dos jogadores vivos, arredondada para cima, tem de votar SIM.`,
                ]
            },
            {
                type: `h4`,
                id: `tribunal-time-limit`,
                text: `Quando o tempo termina`
            },
            {
                type: `p`,
                text: `Termina a ação já em curso (por exemplo, deixa o Acusado concluir a defesa). Se alguém estiver na cadeira do Acusado, passa diretamente à votação em vez de iniciar outra etapa. Se não houver Acusado, o Tribunal termina, e o dia também.`
            },
            {
                type: `note`,
                lines: [
                    `Um dia pode ter várias acusações, ou nenhuma.`,
                    `Pode haver várias execuções num só dia.`,
                    `A mesma pessoa pode ser acusada mais de uma vez e também pode fazer mais de uma acusação.`,
                    `Ninguém pode falar fora das etapas permitidas.`,
                ]
            },
            {
                type: `h3`,
                id: `night`,
                text: `Noite`
            },
            {
                type: `p`,
                text: `Depois do Tribunal, todos fecham os olhos no seu lugar habitual, incluindo os Fantasmas. O Narrador orienta cada personagem nas ações descritas na sua carta.

São permitidos pequenos ruídos para confundir outros jogadores, desde que não perturbem o Narrador nem quem está a realizar uma ação. Se o Narrador pedir que pares, para.`
            },
            {
                type: `h3`,
                id: `ghosts`,
                text: `Morte e Fantasmas`
            },
            {
                type: `p`,
                text: `Há dois tipos de morte: **execução**, uma sentença decidida pela aldeia no Tribunal, e **assassinato**, uma morte causada pelo poder de uma personagem. Um poder pode indicar um tipo específico, como "assassinato por um Lobisomem". O suicídio conta como assassinato. Lê com atenção estas distinções nas cartas de personagem.

Um jogador morto durante a noite só morre de manhã. Até lá, ainda pode usar os seus poderes, e os poderes de informação continuam a considerá-lo vivo (por exemplo, ao verificar os vizinhos).

Os jogadores mortos tornam-se Fantasmas e mantêm o seu objetivo original. Podem continuar a circular e conversar durante o dia, mas não podem falar, acusar ou votar no Tribunal. Perdem os poderes, salvo indicação em contrário na sua carta.`
            },
            {
                type: `note`,
                lines: [
                    `**Os Fantasmas também fecham os olhos e dormem à noite!**`,
                ]
            },
            {
                type: `h3`,
                id: `victory-objectives`,
                text: `Objetivos de vitória`
            },
            {
                type: `list`,
                items: [
                    `**Aldeões:** Matar todos os Lobisomens.`,
                    `**Criaturas Malvadas:** Matar todos os Aldeões.`,
                    `**Amantes e Cupido:** Os Amantes têm de ser os únicos sobreviventes.`,
                    `**Amante Secreto:** Ser o único sobrevivente juntamente com um dos Amantes.`,
                    `**Lobisomem Branco:** Ser o único sobrevivente.`,
                ]
            }
        ],
        // FRENCH — general rules
        fr: [
            {
                type: `h2`,
                id: `base`,
                text: `Comment jouer`
            },
            {
                type: `h3`,
                id: `about`,
                text: `Qu'est-ce que Loups-garous de la Tour Sanglante ?`
            },
            {
                type: `p`,
                text: `Loups-garous de la Tour Sanglante est une version personnalisée du jeu de déduction sociale Les Loups-garous de Thiercelieux, créé par Philippe des Pallières et Hervé Marly et adapté ici par AnJoMorto et L_PT_1463.

Chaque joueur reçoit un personnage secret dont le pouvoir ou l'objectif détermine sa façon d'aider son équipe à gagner. Les journées, les tribunaux et les nuits se succèdent tandis que le village tente d'identifier et d'éliminer les Loups-garous avant qu'ils n'éliminent les Villageois.

Cette version enrichit de nombreux pouvoirs connus et introduit des personnages originaux. La mort ne te retire pas du jeu : tu continues à jouer en tant que Fantôme.`
            },
            {
                type: `h3`,
                id: `context`,
                text: `Bienvenue à Freeborough`
            },
            {
                type: `lore`,
                text: `Freeborough a un sérieux problème : des habitants très secrets et, plus urgent encore, des Créatures Maléfiques. Les Loups-garous et leurs Alliés se sont infiltrés parmi la population, semant le chaos, la mort et la destruction. Puisque les Loups-garous tuent chaque nuit, les Villageois doivent les trouver et les exécuter. Mais à qui peuvent-ils faire confiance ?

Détail aléatoire: l'hydratation est très appréciée à Freeborough. Chacun garde une boisson près de son lit ou de son poste de travail, prête pour son prochain réveil au milieu de la nuit.`
            },
            {
                type: `h3`,
                id: `setup`,
                text: `Préparation`
            },
            {
                type: `list`,
                ordered: true,
                items: [
                    `Choisis un Narrateur et au moins huit joueurs. Le Narrateur guide les actions nocturnes et modère le Tribunal.`,
                    `Installe les joueurs en cercle. Chacun doit mémoriser sa place et y revenir à chaque nuit et à chaque Tribunal.`,
                    `Le Narrateur attribue à chaque joueur une carte de personnage aléatoire et secrète.`,
                    `Place deux chaises supplémentaires au bas du cercle : une pour le Procureur et une pour l'Accusé.`,
                ]
            },
            {
                type: `h3`,
                id: `phases`,
                text: `Le cycle du jeu`
            },
            {
                type: `p`,
                text: `La partie commence par une première nuit consacrée aux informations et à la préparation des pouvoirs. Personne ne peut mourir durant cette première nuit. La première journée et le premier Tribunal suivent ensuite les règles habituelles.

Puis le cycle se répète : **Nuit → Journée → Tribunal → Nuit**.`
            },
            {
                type: `h3`,
                id: `course-of-the-day`,
                text: `Journée · cinq minutes`
            },
            {
                type: `p`,
                text: `Déplace-toi dans le village (la pièce ou le bâtiment où vous jouez) et discute en privé avec les autres joueurs. Rester à ta place rend plus difficile la création d'alliances, l'échange d'informations et la persuasion.

Tu peux écouter les conversations des autres, mais si un groupe te choppe et te demande de partir, respecte sa demande. N'écoute plus ce groupe pendant le reste de la journée.

Tu peux **dire** ce que tu veux : révéler ton rôle, mentir à son sujet, partager des informations ou bluffer. À la fin de la journée, retourne à ta place habituelle pour le Tribunal.`
            },
            {
                type: `note`,
                lines: [
                    `**Dis-le ; ne le montre pas.** Garde ta carte de personnage secrète. Il est interdit de la montrer!`,
                    `Retourne toujours à la même place!.`,
                ]
            },
            {
                type: `h3`,
                id: `tribunal`,
                text: `Tribunal · trois minutes`
            },
            {
                type: `p`,
                text: `Les joueurs vivants peuvent accuser, prendre la parole aux étapes autorisées et voter. Les Fantômes peuvent observer, mais ne peuvent ni parler, ni accuser, ni voter. Il n'y a pas de discussion générale : demande une accusation avant de parler et garde le silence en dehors de ton tour.

Tout joueur vivant peut accuser un autre joueur vivant pour l'interroger tant qu'il reste du temps.`
            },
            {
                type: `h4`,
                id: `tribunal-process`,
                text: `Une accusation, étape par étape`
            },
            {
                type: `list`,
                ordered: true,
                items: [
                    `Le joueur qui accuse s'assied sur la chaise du Procureur ; le joueur accusé s'assied sur la chaise de l'Accusé.`,
                    `Le Procureur expose l'accusation sans être interrompu.`,
                    `L'Accusé présente sa défense sans être interrompu.`,
                    `Les joueurs vivants du village peuvent poser des questions à l'Accusé. Celui-ci peut y répondre, mais cette étape n'est pas une discussion libre.`,
                    `À la fin des questions, les joueurs votent à main levée pour exécuter l'Accusé.`,
                    `Pour une exécution, au moins la moitié des joueurs vivants, arrondie au nombre supérieur, doit voter OUI.`,
                ]
            },
            {
                type: `h4`,
                id: `tribunal-time-limit`,
                text: `Quand le temps est écoulé`
            },
            {
                type: `p`,
                text: `Termine l'action déjà en cours (par exemple, laisse l'Accusé finir sa défense). Si quelqu'un occupe la chaise de l'Accusé, passe directement au vote au lieu de commencer une autre étape. S'il n'y a pas d'Accusé, le Tribunal se termine, ainsi que la journée.`
            },
            {
                type: `note`,
                lines: [
                    `Une journée peut comporter plusieurs accusations, ou aucune.`,
                    `Plusieurs exécutions peuvent avoir lieu dans la même journée.`,
                    `Une même personne peut être accusée plusieurs fois et peut aussi porter plusieurs accusations.`,
                    `Personne ne peut parler en dehors des étapes autorisées.`,
                ]
            },
            {
                type: `h3`,
                id: `night`,
                text: `Nuit`
            },
            {
                type: `p`,
                text: `Après le Tribunal, tout le monde ferme les yeux à sa place habituelle, y compris les Fantômes. Le Narrateur guide chaque personnage dans les actions décrites sur sa carte.

Les petits bruits destinés à tromper les autres joueurs sont autorisés, à condition de ne gêner ni le Narrateur ni les personnes qui accomplissent une action. Si le Narrateur te demande d'arrêter, arrête.`
            },
            {
                type: `h3`,
                id: `ghosts`,
                text: `Mort et Fantômes`
            },
            {
                type: `p`,
                text: `Il existe deux types de mort : **l'exécution**, une sentence décidée par le village au Tribunal, et **l'assassinat**, une mort causée par le pouvoir d'un personnage. Un pouvoir peut préciser un type particulier, comme un "assassinat par un Loup-garou". Le suicide compte comme un assassinat. Lis attentivement ces distinctions sur les cartes de personnage.

Un joueur tué pendant la nuit ne meurt qu'au matin. Jusque-là, il peut encore utiliser ses pouvoirs, et les pouvoirs d'information le considèrent toujours comme vivant (par exemple, lorsqu'ils vérifient les voisins).

Les joueurs morts deviennent des Fantômes et conservent leur objectif d'origine. Ils peuvent continuer à se déplacer et à parler pendant la journée, mais ne peuvent ni parler, ni accuser, ni voter au Tribunal. Ils perdent leurs pouvoirs, sauf indication contraire sur leur carte.`
            },
            {
                type: `note`,
                lines: [
                    `**Les Fantômes aussi ferment les yeux et dorment la nuit.**`,
                ]
            },
            {
                type: `h3`,
                id: `victory-objectives`,
                text: `Objectifs de victoire`
            },
            {
                type: `list`,
                items: [
                    `**Villageois :** Tuer tous les Loups-garous.`,
                    `**Créatures Maléfiques :** Tuer tous les Villageois.`,
                    `**Amoureux et Cupidon :** Les Amoureux doivent être les seuls survivants.`,
                    `**Amant Secret :** Être le seul survivant avec un des Amoureux.`,
                    `**Loup-garou Blanc :** Être le seul survivant.`,
                ]
            }
        ],
        // ENGLISH — general rules
        en: [
            {
                type: `h2`,
                id: `base`,
                text: `How to play`
            },
            {
                type: `h3`,
                id: `about`,
                text: `What is Werewolves of the Clocktower?`
            },
            {
                type: `p`,
                text: `Werewolves of the Clocktower is a custom version of the social deduction game The Werewolves of Miller's Hollow, created by Philippe des Pallières and Hervé Marly and adapted here by AnJoMorto and L_PT_1463.

Each player receives a secret character with an ability or objective that shapes how they help their team win. Days, Tribunals, and nights alternate as the village tries to identify and eliminate the Werewolves before they eliminate the Villagers.

This version expands many familiar abilities and introduces original characters. Death does not remove you from the game: you continue playing as a Ghost.`
            },
            {
                type: `h3`,
                id: `context`,
                text: `Welcome to Freeborough`
            },
            {
                type: `lore`,
                text: `Freeborough has a rather large problem: very private people and, more pressingly, Evil Beings. Werewolves and their Allies have slipped into the population, bringing chaos, death, and destruction. With the Werewolves killing every night, the Villagers must find and execute them. But whom can they trust?

Random fact: Hydration is highly valued in Freeborough. Everyone keeps a drink by their bed or workstation, ready for the next time they wake in the middle of the night.`
            },
            {
                type: `h3`,
                id: `setup`,
                text: `Setting up`
            },
            {
                type: `list`,
                ordered: true,
                items: [
                    `Choose one Narrator and at least eight players. The Narrator guides night actions and moderates the Tribunal.`,
                    `Seat the players in a circle. Everyone must remember their own seat and return to it for every night and Tribunal.`,
                    `The Narrator assigns each player a random, secret character card.`,
                    `Place two additional chairs at the bottom of the circle: one for the Prosecutor and one for the Accused.`,
                ]
            },
            {
                type: `h3`,
                id: `phases`,
                text: `The game cycle`
            },
            {
                type: `p`,
                text: `The game begins with a first night for information and power setup. No one can die during this first night. The first day and Tribunal then follow the usual rules.

After that, the cycle repeats: **Night → Day → Tribunal → Night**.`
            },
            {
                type: `h3`,
                id: `course-of-the-day`,
                text: `Day · five minutes`
            },
            {
                type: `p`,
                text: `Move around the village (the room or building where you are playing) and talk privately with other players. Staying in your seat makes it harder to build alliances, exchange information, and persuade people.

You may eavesdrop, but if a group catches you and asks you to leave, respect their request. Do not eavesdrop on that group again for the rest of the day.

You may **say** anything: reveal your role, lie about it, share information, or bluff. At the end of the day, return to your original seat for the Tribunal.`
            },
            {
                type: `note`,
                lines: [
                    `**Say it; do not show it.** Keep your role card secret. Showing it is forbidden!`,
                    `Always return to the same seat!`,
                ]
            },
            {
                type: `h3`,
                id: `tribunal`,
                text: `Tribunal · three minutes`
            },
            {
                type: `p`,
                text: `Living players may nominate, speak at the permitted stages, and vote. Ghosts may watch, but cannot speak, nominate, or vote. There is no general discussion: call for a nomination before speaking, and remain silent outside your turn.

Any living player may nominate another living player for questioning while time remains.`
            },
            {
                type: `h4`,
                id: `tribunal-process`,
                text: `A nomination, step by step`
            },
            {
                type: `list`,
                ordered: true,
                items: [
                    `The nominating player takes the Prosecutor's chair; the nominated player takes the Accused's chair.`,
                    `The Prosecutor explains the accusation without interruption.`,
                    `The Accused gives a defence without interruption.`,
                    `The living village may ask the Accused questions. The Accused may answer those questions, but this is not a free discussion.`,
                    `When questioning ends, players vote by raising a hand to execute the Accused.`,
                    `At least half of the living village, rounded up, must vote YES for an execution.`,
                ]
            },
            {
                type: `h4`,
                id: `tribunal-time-limit`,
                text: `When time runs out`
            },
            {
                type: `p`,
                text: `Finish the action already in progress (for example, let the Accused finish their defence). If someone is in the Accused's chair, proceed directly to the vote instead of beginning another stage. If there is no Accused, the Tribunal ends, and so does the day.`
            },
            {
                type: `note`,
                lines: [
                    `A day may have several nominations, or none.`,
                    `Multiple executions may happen in one day.`,
                    `The same person may be nominated more than once, and may also make more than one nomination.`,
                    `No one may speak outside the permitted stages.`,
                ]
            },
            {
                type: `h3`,
                id: `night`,
                text: `Night`
            },
            {
                type: `p`,
                text: `After the Tribunal, everyone closes their eyes in their original seat, including Ghosts. The Narrator guides each character through the actions described on their card.

Small noises to confuse other players are allowed, provided they do not disturb the Narrator or anyone performing an action. If the Narrator asks you to stop, stop.`
            },
            {
                type: `h3`,
                id: `ghosts`,
                text: `Death and Ghosts`
            },
            {
                type: `p`,
                text: `There are two types of death: **execution**, a sentence passed by the village at the Tribunal, and **assassination**, a death caused by a character's power. A power may specify a particular kind, such as "assassination by a Werewolf". Suicide counts as assassination. Read these distinctions carefully on character cards.

A player killed at night does not die until morning. Until then, they may still use their powers, and information powers still treat them as alive (for example, when checking neighbours).

Dead players become Ghosts and keep their original objective. They may still move around and talk during the day, but cannot speak, nominate, or vote at the Tribunal. They lose their powers unless their card says otherwise.`
            },
            {
                type: `note`,
                lines: [
                    `**Ghosts also close their eyes and sleep at night.**`,
                ]
            },
            {
                type: `h3`,
                id: `victory-objectives`,
                text: `Victory objectives`
            },
            {
                type: `list`,
                items: [
                    `**Villagers:** Kill all Werewolves.`,
                    `**Evil Beings:** Kill all Villagers.`,
                    `**Lovers and Cupid:** The Lovers must be the only survivors.`,
                    `**Secret Lover:** Be the only survivor together with one of the Lovers.`,
                    `**White Werewolf:** Be the only survivor.`,
                ]
            }
        ]
    }
} as const;
// ============================================================================
// CHARACTER ENTRIES — story, mechanics, exceptions, and victory objective
// ============================================================================

export const RULEBOOK_CHARACTERS = {

    // ---- ESSENTIAL CHARACTERS -----------------------------------------

    // e01 | Werewolf
    "e01": {
        id: "e01",
        group: "essential",
        team: "evilBeing",
        name: {
            pt: `Lobisomem`,
            fr: `Loup-garou`,
            en: `Werewolf`
        },
        lore: [
            {
                text: {
                    pt: `Os Lobisomens são um problema recorrente em Freeborough, mas os Aldeões ficam sempre surpreendidos quando aparecem. Seja como for, parece que voltaram.`,
                    fr: `Les Loups-garous sont un problème récurrent à Freeborough, mais les Villageois sont toujours surpris de les voir apparaître. Quoi qu'il en soit, les voilà de retour.`,
                    en: `Werewolves are a recurring problem in Freeborough, yet the villagers are always surprised when they appear. In any case, it seems they are back again.`
                },
            },
        ],
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

    // e02 | Evil Witch
    "e02": {
        id: "e02",
        group: "essential",
        team: "evilBeing",
        name: {
            pt: `Bruxa Malvada`,
            fr: `Méchante Sorcière`,
            en: `Evil Witch`
        },
        lore: [
            {
                text: {
                    pt: `Com o seu próprio kit de poções, a Bruxa Malvada envenena alguém todas as noites. Ninguém sabe bem porquê, mas, como nunca mata ninguém, nunca se deram ao trabalho de a impedir.`,
                    fr: `Avec son nécessaire à potions, la Méchante Sorcière empoisonne quelqu'un chaque nuit. Personne ne sait vraiment pourquoi, mais puisqu'elle ne tue personne, nul n'a pris la peine de l'arrêter.`,
                    en: `With her personal brewing kit, the Evil Witch poisons someone every night. Nobody really knows why she does it, but since she never kills anyone, they have never bothered to stop her.`
                },
            },
            {
                text: {
                    pt: `Ainda assim, correm rumores inquietantes de que, em tempos, matou uma menina.`,
                    fr: `Pourtant, des rumeurs inquiétantes prétendent qu'elle aurait autrefois tué une petite fille.`,
                    en: `Still, there are worrying rumours that she once killed a little girl.`
                },
                explanation: {
                    pt: `Na primeira versão deste jogo, envenenar a Menina fazia-a morrer imediatamente.`,
                    fr: `Dans la première version de ce jeu, empoisonner la Petite Fille la faisait mourir immédiatement.`,
                    en: `In the first version of this game, poisoning the Little Girl made her die immediately.`
                },
            },
        ],
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

    // e03 | Shaman
    "e03": {
        id: "e03",
        group: "essential",
        team: "villagers",
        name: {
            pt: `Chaman`,
            fr: `Chaman`,
            en: `Shaman`
        },
        lore: [
            {
                text: {
                    pt: `Ainda bem que o Chaman encontrou carretéis mágicos cujo fio pode curar pessoas, mesmo nos piores estados. Estranhamente, não se lembra de onde os encontrou.`,
                    fr: `Heureusement, le Chaman a trouvé des bobines magiques dont le fil peut soigner les gens, même dans les pires états. Étrangement, il ne se souvient pas de l'endroit où il les a trouvées.`,
                    en: `It is a good thing the Shaman found magical spools whose thread can heal people, even in the worst of states. Strangely, he cannot remember where he found them.`
                },
            },
        ],
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

    // e04 | Fortune Teller
    "e04": {
        id: "e04",
        group: "essential",
        team: "villagers",
        name: {
            pt: `Vidente`,
            fr: `Voyante`,
            en: `Fortune Teller`
        },
        lore: [
            {
                text: {
                    pt: `O negócio correu mal quando o futuro de toda a gente passou a resumir-se à morte. A Vidente especializou-se entretanto como médium espiritual.`,
                    fr: `Les affaires ont mal tourné lorsque l'avenir de tout le monde s'est résumé à la mort. La Voyante s'est depuis reconvertie en médium.`,
                    en: `Business took a turn for the worse when everyone's fortune became nothing but death. The Fortune Teller has since retrained as a spiritual medium.`
                },
            },
        ],
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

    // ---- VILLAGER CHARACTERS -----------------------------------------

    // v01 | Little Girl
    "v01": {
        id: "v01",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Menina`,
            fr: `Petite Fille`,
            en: `Little Girl`
        },
        lore: [
            {
                text: {
                    pt: `Tem o sono leve e ouve frequentemente gritos durante a noite, embora já não sejam os mesmos que antes a acordavam.`,
                    fr: `Elle a le sommeil léger et entend souvent des cris la nuit, même si ce ne sont plus ceux qui la réveillaient autrefois.`,
                    en: `A light sleeper, she often hears screams at night, though they are no longer the ones that used to wake her.`
                },
            },
        ],
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

    // v02 | Bear Tamer
    "v02": {
        id: "v02",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Domador do Urso`,
            fr: `Maître de l’Ours`,
            en: `Bear Tamer`
        },
        lore: [
            {
                text: {
                    pt: `Ninguém sabe onde arranjou o urso, como o arranjou ou porquê. A aldeia sabe apenas que foi o seu primeiro domador. A sua identidade continua a ser um mistério, porque o urso anda à solta durante o dia.`,
                    fr: `Personne ne sait où il a trouvé l'ours, comment il l'a obtenu, ni pourquoi. Le village sait seulement qu'il a été son premier maître d'animaux. Son identité reste un mystère, car l'ours se promène librement pendant la journée.`,
                    en: `No one knows where he got the bear, how he got the bear, or why he got the bear. The village knows only that he was its first tamer. His identity remains a mystery, because the bear roams freely during the day.`
                },
            },
        ],
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

    // v03 | Raven Tamer
    "v03": {
        id: "v03",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Domador do Corvo`,
            fr: `Maître du Corbeau`,
            en: `Raven Tamer`
        },
        lore: [
            {
                text: {
                    pt: `A aldeia odiava o Domador do Corvo por andar com tal símbolo de escuridão. Ainda hoje o odeia, convencida de que o seu mau presságio vivo trouxe os Lobisomens.`,
                    fr: `Le village détestait le Maître du Corbeau parce qu'il portait un tel symbole des ténèbres. Il le déteste toujours, persuadé que son mauvais présage vivant a attiré les Loups-garous.`,
                    en: `The village hated the Raven Tamer for carrying such a symbol of darkness. It still hates him today, convinced that his living bad omen brought the Werewolves.`
                },
            },
        ],
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

    // v04 | Fox Tamer
    "v04": {
        id: "v04",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Domador da Raposa`,
            fr: `Maître du Renard`,
            en: `Fox Tamer`
        },
        lore: [
            {
                text: {
                    pt: `O Domador da Raposa ainda não percebeu que nunca chegou a domr a raposa. Ela só volta porque as Criaturas Malvadas a encurralam sempre que tenta fugir.`,
                    fr: `Le Maître du Renard n'a pas compris qu'il n'a jamais vraiment apprivoisé le renard. Celui-ci ne revient que parce que les Créatures Maléfiques le coincent chaque fois qu'il essaie de s'enfuir.`,
                    en: `The Fox Tamer has not realised that he never really tamed the fox. It only returns because Evil Beings keep cornering it whenever it tries to flee.`
                },
            },
        ],
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

    // v05 | Bunny Tamer
    "v05": {
        id: "v05",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Domador dos Coelhos`,
            fr: `Maître des Lapins`,
            en: `Bunny Tamer`
        },
        lore: [
            {
                text: {
                    pt: `«CALEM-SE! DEIXEM-ME DORMIR!» é o que os vizinhos costumam ouvir todas as noites da casa do Domador dos Coelhos. Ainda assim, não há dúvida de que gosta muito deles.`,
                    fr: `« TAISEZ-VOUS ! LAISSEZ-MOI DORMIR ! » Voilà ce que les voisins entendent chaque nuit chez le Maître des Lapins. Pourtant, personne ne doute de l'affection qu'il leur porte.`,
                    en: `“SHUT UP! JUST LET ME SLEEP!” is what the neighbours usually hear from the Bunny Tamer's home every night. Still, there is no doubt that he loves them dearly.`
                },
            },
        ],
        mainDescription: {
            pt: [
                `<red>A cada noite</red>, se um dos vizinhos ou ele próprio foi atacado pelos Lobisomens ou envenenado pela Bruxa, os coelhos assustam-se.`,
            ],
            fr: [
                `<red>Chaque nuit</red>, si un de ces voisins ou soi-même est attaqué par les Loups-garous ou empoisonné par la Sorcière, les lapins auront peur.`,
            ],
            en: [
                `<red>Each night</red>, if the Bunny Tamer or either neighbor was attacked by the Werewolves or poisoned by the Witch, the bunnies become frightened.`
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

    // v26 | Monkey Tamer
    "v26": {
        id: "v26",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Domador do Macaco`,
            fr: `Maître du Singe`,
            en: `Monkey Tamer`
        },
        mainDescription: {
            pt: [
                `<red>A cada noite</red>, acorda e vê uma carta à sua escolha. <red>A partir da segunda noite</red>, se a <red>personagem revelada for uma Criatura Malvada</red>, perde o seu poder.`
            ],
            fr: [
                `<red>Chaque nuit</red>, il se réveille et voit une carte de son choix. <red>Dès la deuxième nuit</red>, si le <red>personnage révélé est une Créature Maléfique</red>, il perd son pouvoir.`
            ],
            en: [
                `<red>Every night</red>, wakes up and sees a card of their choice. <red>From the second night</red>, if the <red>revealed character is an Evil Being</red>, loses their power.`
            ]
        },
        details: [{
            title: { pt: `Se envenenado:`, fr: `Si empoisonné :`, en: `If poisoned:` },
            description: {
                pt: `Receberá a informação errada.`,
                fr: `Recevra de fausses informations.`,
                en: `Receives incorrect information.`
            }
        }],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },

    // v06 | Puppeteer
    "v06": {
        id: "v06",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Marionetista`,
            fr: `Marionnettiste`,
            en: `Puppeteer`
        },
        lore: [
            {
                text: {
                    pt: `O Marionetista tem sorte de os Lobisomens verem tão mal: não faz ideia de como conseguiu manter a farsa durante tanto tempo.`,
                    fr: `Le Marionnettiste a de la chance que les Loups-garous aient une si mauvaise vue : il ignore vraiment comment il a réussi à tenir aussi longtemps.`,
                    en: `The Puppeteer is lucky that Werewolves have terrible eyesight: he truly has no idea how he has managed to keep this up for so long.`
                },
            },
        ],
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

    // v07 | Rusted Knight
    "v07": {
        id: "v07",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Cavaleiro Enferrujado`,
            fr: `Chevalier Rouillé`,
            en: `Rusted Knight`
        },
        lore: [
            {
                text: {
                    pt: `Uma pequena ressalva: este jogo passa-se antes da invenção da vacina contra o tétano.`,
                    fr: `Petite précision : ce jeu se déroule avant l'invention du vaccin contre le tétanos.`,
                    en: `A small disclaimer: this game takes place before the invention of the tetanus vaccine.`
                },
            },
        ],
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

    // v08 | Hunter
    "v08": {
        id: "v08",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Caçador`,
            fr: `Chasseur`,
            en: `Hunter`
        },
        lore: [
            {
                text: {
                    pt: `Há quem suspeite que o Caçador é o responsável pelos lobos mortos que por vezes aparecem junto ao rio da aldeia, com a barriga cheia de pedras.`,
                    fr: `On soupçonne le Chasseur d'être responsable des loups morts que l'on retrouve parfois près de la rivière du village, le ventre rempli de pierres.`,
                    en: `People suspect that the Hunter is behind the dead wolves occasionally found by the village river, their bellies stuffed with rocks.`
                },
                explanation: {
                    pt: `Referência ao conto de fadas "O Capuchinho Vermelho", que inspirou o novo poder do Lobisomem Mau e a personagem original "Capuchinho Vermelho".`,
                    fr: `Référence au conte de fées "Le Petit Chaperon Rouge", qui a inspiré le nouveau pouvoir du Méchant Loup-garou et le personnage original "Petit Chaperon Rouge".`,
                    en: `Reference to the fairy tale "Little Red Riding Hood," which inspired the new ability of the Big Bad Werewolf and the original character Little Red Riding Hood.`
                }
            },
        ],
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

    // v08b | Little Red Riding Hood
    "v08b": {
        id: "v08b",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Capuchinho Vermelho`,
            fr: `Petit Chaperon Rouge`,
            en: `Little Red Riding Hood`
        },
        lore: [
            {
                text: {
                    pt: `Como se lidar com uma avó loba não fosse suficiente, agora há avós lobisomens com que se preocupar. Pelo menos o Caçador continua por perto.`,
                    fr: `Comme si une grand-mère louve ne suffisait pas, il faut maintenant se méfier des grands-mères loups-garous. Au moins, le Chasseur est toujours là.`,
                    en: `As if dealing with a wolf grandmother were not bad enough, now there are Werewolf grandmothers to worry about. At least the Hunter is still around.`
                },
                explanation: {
                    pt: `Referência ao conto de fadas "O Capuchinho Vermelho", que inspirou o novo poder do Lobisomem Mau e a personagem original "Capuchinho Vermelho".`,
                    fr: `Référence au conte de fées "Le Petit Chaperon Rouge", qui a inspiré le nouveau pouvoir du Méchant Loup-garou et le personnage original "Petit Chaperon Rouge".`,
                    en: `Reference to the fairy tale "Little Red Riding Hood," which inspired the new ability of the Big Bad Werewolf and the original character Little Red Riding Hood.`
                }
            },
        ],
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

    // v09 | Captain
    "v09": {
        id: "v09",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Capitão`,
            fr: `Capitaine`,
            en: `Captain`
        },
        lore: [
            {
                text: {
                    pt: `É evidente que o Chefe da Aldeia não estava à espera de Lobisomens quando reduziu o serviço militar obrigatório a um único dia.`,
                    fr: `Visiblement, l'Ancien du Village ne s'attendait pas aux Loups-garous lorsqu'il a réduit le service militaire obligatoire à une seule journée.`,
                    en: `Clearly, the Village Elder was not expecting Werewolves when he reduced compulsory military service to a single day.`
                },
            },
        ],
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

    // v27 | Colossus
    "v27": {
        id: "v27",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Colosso`,
            fr: `Colosse`,
            en: `Colossus`
        },
        mainDescription: {
            pt: [
                `<red>Se for assassinado pelos Lobisomens</red>, acorda e assassina <red>um</red> jogador que agiu essa noite.`,
            ],
            fr: [
                `<red>S’il est assassiné par les Loups-garous</red>, se réveilleet assassine <red>un</red> joueur qui a agi cette nuit.`,
            ],
            en: [
                `<red>If assassinated by the Werewolves</red>, wakes up and assassinates <red>one</red> player who has acted that night.`
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
            },
        ],
        objective: {
            pt: `Matar todos os Lobisomens.`,
            fr: `Tuer tous les Loups-garous.`,
            en: `Kill all Werewolves.`
        }
    },

    // v10 | Paranoid
    "v10": {
        id: "v10",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Paranoico`,
            fr: `Paranoïaque`,
            en: `Paranoid`
        },
        lore: [
            {
                text: {
                    pt: `Como o faz? Intervenção divina, talvez, ou um machado? A aldeia sabe apenas que, por vezes, pessoas que estavam vivas há poucos minutos aparecem como Fantasmas nos degraus do Tribunal.`,
                    fr: `Comment s'y prend-il ? Une intervention divine, peut-être, ou une hache ? Le village sait seulement que des gens encore vivants quelques minutes auparavant apparaissent parfois comme Fantômes sur les marches du Tribunal.`,
                    en: `How does he do it? Divine intervention, perhaps, or an axe? All the village knows is that people who were alive only minutes ago sometimes appear as Ghosts on the courthouse steps.`
                },
            },
        ],
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

    // v11 | Village Elder
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

    // v12 | Gypsy
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

    // v13 | Judge
    "v13": {
        id: "v13",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Juiz`,
            fr: `Juge`,
            en: `Judge`
        },
        lore: [
            {
                text: {
                    pt: `Esforça-se por manter a calma durante os julgamentos. Mas, às vezes, o processo torna-se tão absurdo que tem de intervir, nem que seja só para acabar com o barulho.`,
                    fr: `Il s'efforce de rester calme pendant les procès. Mais les débats deviennent parfois si absurdes qu'il doit intervenir, ne serait-ce que pour faire cesser le bruit.`,
                    en: `He tries hard to remain calm during trials. Sometimes, though, the proceedings become such nonsense that he simply has to intervene, if only to stop the noise.`
                },
            },
        ],
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
                `<red>Twice during the entire game</red>, may reveal himself and cancel an execution during the Tribunal.`,
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

    // v14 | Accuser
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
                `<red>Twice during the entire game</red>, may reveal himself and force an execution during the Tribunal.`,
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

    // v15 | Pyromaniac
    "v15": {
        id: "v15",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Piromaníaco`,
            fr: `Pyromane`,
            en: `Pyromaniac`
        },
        lore: [
            {
                text: {
                    pt: `A terapia tem feito maravilhas pelas tendências assassinas do Piromaníaco. Hoje em dia, limita-se a incendiar casas.`,
                    fr: `La thérapie a beaucoup aidé le Pyromane à maîtriser ses tendances meurtrières. Désormais, il se contente de mettre le feu.`,
                    en: `Therapy has done wonders for the Pyromaniac's murderous tendencies. These days, he limits himself to arson.`
                },
                explanation: {
                    pt: `No jogo original, o Piromaníaco podia escolher um momento para matar todos os jogadores que ele tinha selecionado.`,
                    fr: `Dans le jeu original, le Pyromane pouvait choisir un moment pour tuer tous les joueurs qu'il avait choisis.`,
                    en: `In the original game, the Pyromaniac could choose a moment to kill all players he had chosen.`
                }
            },
        ],
        mainDescription: {
            pt: [
                `Quando um jogador é chamado ao Tribunal, mas <red>não é executado</red>, o Piromaníaco <red>pode escolher</red> na <red>noite seguinte</red> incendiar a casa desse jogador (👍/👎).`,
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

    // v16 | Sleepwalker
    "v16": {
        id: "v16",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Sonâmbulo`,
            fr: `Somnambule`,
            en: `Sleepwalker`
        },
        lore: [
            {
                text: {
                    pt: `Quase todos têm a certeza de que está a dormir quando invade as suas casas. Ainda assim, desconfiam o suficiente para não fazerem nada enquanto ele lá está.`,
                    fr: `La plupart des gens sont presque certains qu'il dort lorsqu'il fait irruption chez eux. Ils restent pourtant assez méfiants pour ne rien faire tant qu'il est là.`,
                    en: `Most people are fairly sure that he is asleep when he barges into their homes. They are still suspicious enough to avoid doing anything while he is there.`
                },
            },
        ],
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

    // v17 | Saviour
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
                `May also choose himself.`
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

    // v18 | Angel
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

    // v19 | Prophet
    "v19": {
        id: "v19",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Profeta`,
            fr: `Prophète`,
            en: `Prophet`
        },
        lore: [
            {
                text: {
                    pt: `Se inventares profecias suficientes, mais cedo ou mais tarde uma delas há de tornar-se verdade.`,
                    fr: `À force d'inventer des prophéties, il y en aura bien une qui finira par se réaliser.`,
                    en: `If you invent enough prophecies, sooner or later one of them is bound to come true.`
                },
            },
        ],
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

    // v20 | Housemaid
    "v20": {
        id: "v20",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Empregada`,
            fr: `Domestique`,
            en: `Housemaid`
        },
        lore: [
            {
                text: {
                    pt: `Ficar acordada até tarde a limpar permite-lhe vislumbrar a casa que a Bruxa Malvada visita. Infelizmente, apesar do seu excelente sentido de distância, não distingue a esquerda da direita.`,
                    fr: `Comme elle veille tard pour faire le ménage, elle aperçoit la maison que visite la Méchante Sorcière. Malheureusement, malgré son excellent sens des distances, elle ne distingue pas sa gauche de sa droite.`,
                    en: `Staying up late to clean gives her a glimpse of the house the Evil Witch visits. Unfortunately, despite her excellent sense of distance, she cannot tell left from right.`
                },
            },
        ],
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

    // v21 | Lamplighter
    "v21": {
        id: "v21",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Faroleiro`,
            fr: `Falotier`,
            en: `Lamplighter`
        },
        lore: [
            {
                text: {
                    pt: `O Faroleiro mantém-se reservado enquanto percorre Freeborough durante a noite. De vez em quando, espreita por uma janela, por puro acidente, e repara no que os outros trabalhadores andam a fazer.`,
                    fr: `Le Falotier reste discret tandis qu'il arpente Freeborough toute la nuit. Il lui arrive de jeter un œil par une fenêtre, par pur accident, et de remarquer ce que font les autres travailleurs.`,
                    en: `The Lamplighter keeps to himself as he walks around Freeborough all night. Occasionally, he peeks through a window, purely by accident, and notices what the other workers are up to.`
                },
            },
        ],
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

    // v22 | Boy
    "v22": {
        id: "v22",
        group: "villager",
        team: "villagers",
        name: {
            pt: `Pedro`,
            fr: `Enfant`,
            en: `Boy`
        },
        lore: [
            {
                text: {
                    pt: `Se ao menos a aldeia tivesse acreditado nele da primeira vez que gritou "lobo".`,
                    fr: `Si seulement le village l'avait cru la première fois qu'il a crié au loup.`,
                    en: `If only the village had believed him the first time he cried wolf.`
                },
                explanation: {
                    pt: `Referência ao conto de fadas "O Pedro e o Lobo", que inspirou este personagem original.`,
                    fr: `Référence au conte de fées "Le Garçon qui criait au loup", qui a inspiré ce rôle original.`,
                    en: `Reference to the fairy tale "The Boy Who Cried Wolf," which inspired this original character.`
                }
            },
        ],
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

    // v23 | Spider Tamer
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

    // v24 | Vintner
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

    // v25 | Priest
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

    // ---- EVIL CHARACTERS -----------------------------------------

    // m01 | Big Bad Werewolf
    "m01": {
        id: "m01",
        group: "evil",
        team: "evilBeing",
        name: {
            pt: `Lobisomem Mau`,
            fr: `Méchant Loup-garou`,
            en: `Big Bad Werewolf`
        },
        lore: [
            {
                text: {
                    pt: `Ninguém suspeitaria de uma pobre avó velhinha. Bem, ninguém a não ser aquelas crianças traquinas.`,
                    fr: `Personne ne soupçonnerait une pauvre vieille grand-mère. Enfin, personne sauf ces enfants turbulents.`,
                    en: `No one would ever suspect a poor old grandmother. Well, no one except those rowdy children.`
                },
                explanation: {
                    pt: `Referência ao conto de fadas "O Capuchinho Vermelho", que inspirou o novo poder do Lobisomem Mau e a personagem original "Capuchinho Vermelho".`,
                    fr: `Référence au conte de fées "Le Petit Chaperon Rouge", qui a inspiré le nouveau pouvoir du Méchant Loup-garou et le personnage original "Petit Chaperon Rouge".`,
                    en: `Reference to the fairy tale "Little Red Riding Hood," which inspired the new ability of the Big Bad Werewolf and the original character Little Red Riding Hood.`
                }
            },
        ],
        mainDescription: {
            pt: [
                `<red>Duas vezes</red> por jogo, escolhe se quer se mascarar de Avózinha (👍/👎), dando-lhe imunidade durante um dia e uma noite.`,
                `<red>Mesmo imune</red>, pode ser <red>executado</red> se quem o levar a Tribunal for o Capuchinho Vermelho. E nesse caso, se o Caçador votar, o Lobisomem Mau é automaticamente executado.`,
            ],
            fr: [
                `<red>Deux fois</red> par jeu, il choisit s’il veut se déguiser en Grand-maman (👍/👎), ce qui lui donne immunité pendant un jour et une nuit.`,
                `<red>Même étant immune</red>, il peut être <red>exécuté</red> au Tribunal si accusé par le Petit Chaperon Rouge. Dans ce cas spécifiquement, si le Chasseur vote, le Méchant Loup-garou est exécuté automatiquement.`,
            ],
            en: [
                `<red>Twice</red> per game, chooses whether to disguise themself as Grandmother (👍/👎), gaining immunity for one day and one night.`,
                `<red>Even while immune</red>, may be <red>executed</red> if Little Red Riding Hood brings him to the Tribunal. In that specific case, if the Hunter votes, the Big Bad Werewolf is executed automatically.`
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

    // m02 | Werewolf Seer
    "m02": {
        id: "m02",
        group: "evil",
        team: "evilBeing",
        name: {
            pt: `Lobisomem Vidente`,
            fr: `Loup-garou Voyante`,
            en: `Werewolf Seer`
        },
        lore: [
            {
                text: {
                    pt: `Os Lobisomens costumavam escolher as vítimas ao acaso. Depois de o Lobisomem Vampiro transformar um Bêbado, perceberam que talvez fosse útil conhecer um pouco melhor as vítimas antes de as atacar.`,
                    fr: `Les Loups-garous choisissaient autrefois leurs victimes au hasard. Après que le Loup-garou Vampire a transformé un Ivrogne, ils ont compris qu'il pouvait être utile de mieux connaître leurs victimes avant de les attaquer.`,
                    en: `Werewolves used to choose their victims at random. After the Vampire Werewolf turned a Drunkard, they realised that learning a little about their victims first might be useful.`
                },
            },
        ],
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

    // m03 | Vampire Werewolf
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

    // m04 | Ankou
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

    // m05 | Evil Cupid
    "m05": {
        id: "m05",
        group: "evil",
        team: "evilBeing",
        name: {
            pt: `Cupido Malvado`,
            fr: `Méchant Cupidon`,
            en: `Evil Cupid`
        },
        lore: [
            {
                text: {
                    pt: `Uma criatura de puro caos, o Cupido Malvado é atraído pelo caos onde quer que o encontre. Tinha tanta inveja de não ser a sua principal causa que se mudou para a aldeia antecipadamente, assim que começaram os primeiros rumores de Lobisomens.`,
                    fr: `Créature de pur chaos, le Méchant Cupidon est attiré par le chaos partout où il le trouve. Si jaloux de ne pas en être la principale cause, il s'est installé au village à l'avance, dès les premières rumeurs de Loups-garous.`,
                    en: `A creature of pure chaos, Evil Cupid is drawn to chaos wherever he finds it. He was so jealous of not being its main cause that he moved to town ahead of time, as soon as the first rumours of Werewolves began.`
                },
            },
        ],
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

    // m06 | (Were)wolf Tamer
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

    // ---- SOLO CHARACTERS -----------------------------------------

    // s01 | Cupid
    "s01": {
        id: "s01",
        group: "solo",
        team: "solo",
        name: {
            pt: `Cupido`,
            fr: `Cupidon`,
            en: `Cupid`
        },
        lore: [
            {
                text: {
                    pt: `O Cupido é narcisista. Gosta mesmo de ter razão.`,
                    fr: `Cupidon est narcissique. Il aime vraiment avoir raison.`,
                    en: `Cupid is a narcissist. He really likes to be right.`
                },
            },
        ],
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

    // s02 | White Werewolf
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

    // ---- FLEXIBLE CHARACTERS -----------------------------------------

    // f01 | Thief
    "f01": {
        id: "f01",
        group: "flexible",
        team: "flexible",
        name: {
            pt: `Ladrão`,
            fr: `Voleur`,
            en: `Thief`
        },
        lore: [
            {
                text: {
                    pt: `De alguma forma, rouba votos à Landsgemeinde. Como é que isso funciona sequer?`,
                    fr: `Il parvient à voler des voix à la Landsgemeinde. Comment est-ce seulement possible ?`,
                    en: `Somehow, he steals votes from the Landsgemeinde. How does that even work?`
                },
                explanation: {
                    pt: `Landsgemeinde é uma forma de democracia direta, onde todos os cidadãos votam em público à frente de toda a gente.`,
                    fr: `La Landsgemeinde est un système de démocratie directe où tous les citoyens votent en public devant tout le monde.`,
                    en: `The Landsgemeinde is a form of direct democracy where all citizens vote in public before everyone.`
                }
            },
        ],
        mainDescription: {
            pt: [
                `<red>Cada noite</red>, escolhe um jogador que não poderá votar no próximo Tribunal.`,
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

    // f02 | Spy
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

    // ---- COMPLEX CHARACTERS -----------------------------------------

    // a01 | Drunkard
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
                `<red>Replaces</red> the Fortune Teller, Bear Tamer, Bunny Tamer, Raven Tamer, Fox Tamer, or Spider Tamer, chosen randomly each game.`,
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

    // a02 | Wolf-Dog
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

    // a03 | Mime
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

    // a04 | Actor
    "a04": {
        id: "a04",
        group: "complex",
        team: "villagersFlex",
        name: {
            pt: `Ator`,
            fr: `Comédien`,
            en: `Actor`
        },
        lore: [
            {
                text: {
                    pt: `Todos os papéis já estavam ocupados quando se mudou para a aldeia. Costuma ficar à espera até que a tragédia lhe seja favorável.`,
                    fr: `Tous les rôles étaient déjà pris lorsqu'il s'est installé au village. Il attend généralement qu'une tragédie tourne à son avantage.`,
                    en: `All the parts were already taken when he moved to town. He usually waits around until tragedy works in his favour.`
                },
            },
        ],
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

    // a05 | Grave Robber
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

    // a06 | Illusionist
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

    // as01b | Secret Lover
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

    // ---- LAME CHARACTERS -----------------------------------------

    // l01 | Ordinary Townsfolk
    "l01": {
        id: "l01",
        group: "lame",
        team: "villagers",
        name: {
            pt: `Aldeão Triste`,
            fr: `Villageois Triste`,
            en: `Ordinary Townsfolk`
        },
        lore: [
            {
                text: {
                    pt: `Uma alma simples a viver uma vida sem graça. Ou a morrer, neste caso.`,
                    fr: `Une âme ordinaire qui mène une vie bien terne. Ou qui en meurt, en l'occurrence.`,
                    en: `Just a simple soul living a dreary life. Or dying one, as the case may be.`
                },
            },
        ],
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

    // l02 | Wild Child
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

    // l03 | Sisters
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
                `The Sisters know each other.`,
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

    // l04 | Brothers
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
                `The Brothers know each other.`,
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

    // l05 | Astronomer
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

    // l06 | Devout Servant
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

    // ---- EXTRA CHARACTERS -----------------------------------------

    // x01 | Villagers
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

    // x02 | Evil Beings
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

    // x02.1 | Werewolves
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

    // x03 | Ghosts
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
                `Os jogadores mortos transformam-se em fantasmas, que podem continuar a comunicar com a aldeia durante o dia, mas não podem falar ou votar no Tribunal, e <red>perdem qualquer poder que tinham</red> (a não ser que esteja escrito o contrário na ficha de personagem.)`,
                `<red>Os Fantasmas TAMBÉM DORMEM À NOITE</red>.`,
            ],
            fr: [
                `Il existe deux types de mort : <red>EXÉCUTION</red> (condamnés par le village) ou <red>ASSASSINAT</red> (tués par le pouvoir d'un personnage).`,
                `Lorsqu'un joueur est tué pendant la nuit, il ne meurt réellement que le matin, au réveil, et peut donc continuer à utiliser ses pouvoirs pendant la nuit.`,
                `Les joueurs morts se transforment en Fantômes, qui peuvent continuer à communiquer avec le village pendant la journée, mais ne peuvent ni parler ni voter au Tribunal, et <red>perdent tous les pouvoirs qu'ils avaient</red> (sauf indication contraire dans la fiche de personnage).`,
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

    // x.v09 | Soldier
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

    // x.s01 | Lover
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

    // x.as01b.1 | Traitor
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

    // x.as01b.2 | Betrayed
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

    // x.m05 | Enemy
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
// ============================================================================
// DISPLAY ORDER — this controls both the index and character sections
// ============================================================================

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
    "v26",
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
    "v27",
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
// ============================================================================
// PRINTED NIGHT SCRIPTS — these also feed the analog character generator
// ============================================================================

export const RULEBOOK_NIGHT_SCRIPT = {
    // FIRST NIGHT — initial information and power setup; no deaths
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
                en: `Cupid wakes up and chooses two players who will become Lovers. Cupid goes back to sleep, and the Lovers are touched so they can wake up and get to know each other. If one Lover dies, the other commits suicide. The goal of the Lovers and Cupid is for the Lovers to be the last survivors. The game continues for as long as both Lovers are alive.`
            }
        },
        {
            id: "first-m05",
            refs: ["m05"],
            text: {
                pt: `O Cupido Malvado acorda e escolhe dois jogadores que serão Inimigos. O Cupido Malvado adormece e os Inimigos serão tocados e podem se conhecer. Se um Inimigo consegue condenar o outro a execução, o primeiro recebe imunidade na próxima tentativa de assassinato.`,
                fr: `Le Méchant Cupidon se réveille et choisit deux joueurs qui seront Ennemis. Le Méchant Cupidon s’endort et les Ennemis seront maintenant touchés pour qu’ils se connaissent. Si un Ennemi parvient à amener l’autre à exécution, le premier reçoit immunité contre le prochain assassinat.`,
                en: `Evil Cupid wakes up and chooses two players who will become Enemies. Evil Cupid goes back to sleep, and the Enemies are touched so they can wake up and get to know each other. If one Enemy manages to have the other condemned to execution, the first gains immunity from the next assassination attempt.`
            }
        },
        {
            id: "first-l03",
            refs: ["l03"],
            text: {
                pt: `As Irmãs acordam para se conhecerem.`,
                fr: `Les Sœurs se réveillent pour se connaître.`,
                en: `The Sisters wake up to see each other.`
            }
        },
        {
            id: "first-l04",
            refs: ["l04"],
            text: {
                pt: `Os Irmãos acordam para se conhecerem.`,
                fr: `Les Frères se réveillent pour se connaître.`,
                en: `The Brothers wake up to see each other.`
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
            id: "first-v26",
            refs: ["v26"],
            text: {
                pt: `O Domador do Macaco acorda e escolhe um jogador cuja carta lhe será revelada.`,
                fr: `Le Maître du Singe se réveille et choisit un joueur dont la carte lui sera révélée.`,
                en: `The Monkey Tamer wakes up and chooses a player whose card will be revealed.`
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
    // SECOND NIGHT — actions specific to the first normal night
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
    // NORMAL NIGHTS — recurring actions, in wake-up order
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
                pt: `O Piromaníaco acorda/não acorda. São-lhe mostradas as pessoas inocentadas no último Tribunal. Ele decide, ao indicar ou mostrar o polegar para baixo, se quer ou não incendiar a casa de uma delas.`,
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
                en: `Every 3 nights, the White Werewolf wakes up and chooses a Werewolf to kill. If the White Werewolf is the only Werewolf, he chooses one additional player to kill.`
            }
        },
        {
            id: "normal-v27",
            refs: ["v27"],
            text: {
                pt: `(Morto pelos Lobisomens esta noite) O Colosso acorda e escolhe um jogador que agiu esta noite para assassinar.`,
                fr: `(Tué par les Loups-garous cette nuit) Le Colosse se réveille et choisit un joueur qui a agi cette nuit pour l’assassiner.`,
                en: `(Killed by the Werewolves tonight) The Colossus wakes up and chooses a player who has acted tonight to assassinate.`
            }
        },
        {
            id: "normal-v05",
            refs: ["v05"],
            text: {
                pt: `O Domador dos Coelhos ouviu os Coelhos assustados esta noite / [nada] (/os Coelhos estão confusos).`,
                fr: `Le Maître des Lapins a entendu les Lapins effrayés cette nuit / [rien] (/ les Lapins sont confus).`,
                en: `The Bunny Tamer heard the frightened Bunnies tonight / [nothing] (/ the Bunnies are confused).`
            }
        },
        {
            id: "normal-v26",
            refs: ["v26"],
            text: {
                pt: `O Domador do Macaco acorda e escolhe um jogador cuja carta lhe será revelada. Se a personagem revelada for uma Criatura Malvada, o Domador do Macaco perde o seu poder.`,
                fr: `Le Maître du Singe se réveille et choisit un joueur dont la carte lui sera révélée. Si le personnage révélé est une Créature Maléfique, le Maître du Singe perd son pouvoir.`,
                en: `The Monkey Tamer wakes up and chooses a player whose card will be revealed. If the revealed character is an Evil Being, the Monkey Tamer loses their power.`
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
                pt: `O Chaman acorda/não acorda se não houver vítimas e são-lhe apresentadas as vítimas. Ele escolhe então com o polegar se as quer salvar uma delas ou não. Relembro que pode salvar duas pessoas durante o jogo todo.`,
                fr: `Le Chaman se réveille / ne se réveille pas s’il n’y a pas de victimes. Les victimes lui sont présentées, puis il choisit avec le pouce s’il veut en sauver une ou non. Je rappelle qu’il peut sauver deux personnes pendant toute la partie.`,
                en: `The Shaman wakes up / does not wake up if there are no victims. The victims are shown, and the Shaman uses a thumb signal to choose whether to save one of them. Remember that the Shaman may save two people during the entire game.`
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
