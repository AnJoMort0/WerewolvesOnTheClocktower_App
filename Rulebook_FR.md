# Loups-garous de la Tour Sanglante

<style>
/* Visual layout for Markdown renderers that allow embedded HTML/CSS.
   If your renderer strips CSS (for example some GitHub views), the table,
   images, anchors, and colored emoji markers still remain readable. */
:root {
  --role-border: #1f1f1f;
  --role-good-bg: #dcefd2;
  --role-good-accent: #4f8f3a;
  --role-evil-bg: #efb1b1;
  --role-evil-accent: #a73636;
  --role-independent-bg: #e7d6f7;
  --role-independent-accent: #7c4bb0;
  --role-flex-bg: #f7e8a7;
  --role-flex-accent: #b38b00;
  --role-extra-bg: #eeeeee;
  --role-extra-accent: #777777;
  --role-shifting-bg: #e4edb8;
  --role-shifting-accent: #8b9b39;
}
.character-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0 2rem;
  table-layout: fixed;
}
.character-table col.image-col {
  width: 150px;
}
.character-table th,
.character-table td {
  border: 1px solid var(--role-border);
  vertical-align: top;
}
.character-table th {
  padding: .55rem .75rem;
  text-align: left;
  background: #f7f7f7;
}
.role-image-cell {
  width: 150px !important;
  min-width: 150px;
  max-width: 150px;
  padding: .5rem;
  text-align: center;
}
.role-image-cell img {
  width: 130px;
  max-width: 130px;
  height: auto;
  border-radius: .45rem;
  border: 1px solid rgba(0,0,0,.35);
  background: #fff;
}
.role-text-cell {
  padding: .7rem .85rem .75rem;
  width: auto;
  min-width: 0;
  max-width: calc(100% - 150px);
  overflow-wrap: anywhere;
  word-break: normal;
}
.role-title {
  margin: 0 0 .25rem;
  font-size: 1.05rem;
  font-weight: 700;
}
.role-meta {
  margin: 0 0 .5rem;
  font-size: .86rem;
  opacity: .82;
}
.role-badge {
  display: inline-block;
  margin-left: .35rem;
  padding: .08rem .45rem;
  border-radius: 999px;
  font-size: .78rem;
  font-weight: 700;
  border: 1px solid rgba(0,0,0,.25);
  background: rgba(255,255,255,.45);
}
.role-description p {
  margin: .38rem 0;
}
.role-description strong {
  font-weight: 750;
}
.role-description {
  max-width: 68ch;
}
.rule-red {
  color: #cc0000;
  font-weight: 700;
}
.role-row.faction-good td { background: var(--role-good-bg); }
.role-row.faction-good .role-image-cell { border-left: 6px solid var(--role-good-accent); }
.role-row.faction-evil td { background: var(--role-evil-bg); }
.role-row.faction-evil .role-image-cell { border-left: 6px solid var(--role-evil-accent); }
.role-row.faction-independent td { background: var(--role-independent-bg); }
.role-row.faction-independent .role-image-cell { border-left: 6px solid var(--role-independent-accent); }
.role-row.faction-flex td { background: var(--role-flex-bg); }
.role-row.faction-flex .role-image-cell { border-left: 6px solid var(--role-flex-accent); }
.role-row.faction-shifting td { background: var(--role-shifting-bg); }
.role-row.faction-shifting .role-image-cell { border-left: 6px solid var(--role-shifting-accent); }
.role-row.faction-extra td { background: var(--role-extra-bg); }
.role-row.faction-extra .role-image-cell { border-left: 6px solid var(--role-extra-accent); }
@media (max-width: 720px) {
  .character-table {
    table-layout: fixed;
    min-width: 320px;
  }
  .character-table th:first-child,
  .character-table td.role-image-cell {
    width: 118px !important;
    min-width: 118px;
    max-width: 118px;
    padding: .35rem;
  }
  .role-image-cell img {
    width: 104px;
    max-width: 104px;
  }
  .role-text-cell {
    max-width: calc(100vw - 135px);
    padding: .45rem .55rem;
    font-size: .92rem;
  }
  .role-title {
    font-size: .98rem;
  }
  .role-meta {
    font-size: .78rem;
  }
}
</style>

<!-- SOURCE-EDITING CONVENTIONS
- Chaque personnage commence par un séparateur « PERSONNAGE ».
- Pour le texte rouge, utiliser uniquement : <span class="rule-red">texte</span>
- Laisser les espaces, la ponctuation et les symboles de choix (👍/👎) hors de la balise rouge.
-->


## Sommaire

- [Base](#base)
  - [Contexte](#contexte)
  - [Déroulement de la journée](#deroulement-de-la-journee)
  - [Tribunal](#tribunal)
  - [Nuit](#nuit)
  - [Fantômes](#fantomes)
  - [Objectifs de victoire](#objectifs-de-victoire)
- [Liste rapide de personnages](#liste-rapide-de-personnages)
- [Personnages](#personnages)
  - [Essentiels](#essentiels)
  - [Villageois](#villageois)
  - [Créatures Maléfiques](#creatures-malefiques)
  - [Personnages indépendants](#personnages-independants)
  - [Personnages flexibles](#personnages-flexibles)
  - [Personnages complexes](#personnages-complexes)
  - [Personnages nuls (pour quand il y a beaucoup de joueurs)](#personnages-nuls-pour-quand-il-y-a-beaucoup-de-joueurs)
  - [Extras](#extras)
- [La Nuit](#la-nuit)
  - [Première Nuit](#premiere-nuit)
  - [Début de la Deuxième Nuit](#debut-de-la-deuxieme-nuit)
  - [Nuit Normale](#nuit-normale)
- [Code pour le script interactif](#code-pour-le-script-interactif)

---
<a id="base"></a>

## Base
<a id="contexte"></a>

### Contexte
Le village a un problème avec les Créatures Maléfiques : les Loups-garous et leurs Alliés ! Les Loups-garous tuent toutes les nuits, les Villageois doivent donc exécuter ces Créatures Maléfiques. Mais comment les Villageois vont-ils choisir qui exécuter ?
<a id="deroulement-de-la-journee"></a>

### Déroulement de la journée
Pendant la journée (5 minutes), les joueurs se déplacent librement dans les différents endroits du village (la salle ou le bâtiment), mais comme ils se soupçonnent tous les uns les autres, ils peuvent dire n&#x27;importe quoi (y compris révéler ou mentir sur leur rôle et ce qu&#x27;ils savent des autres), l&#x27;objectif étant de convaincre les autres, de créer des alliances, de planifier des assassinats, etc. À la fin de la journée (3 minutes), tout le village se réunit au tribunal (au centre de la pièce) pour décider qui sera exécuté. Il est important que tous les joueurs gardent toujours les mêmes places !
<a id="tribunal"></a>

### Tribunal
Au tribunal, aucune information spécifique ne peut être divulguée par un joueur qui n&#x27;est pas impliqué dans une procédure (ils peuvent simplement dire s&#x27;ils soupçonnent quelqu&#x27;un, mais pas pourquoi). Un joueur peut désigner un autre joueur pour être interrogé.

1. Le joueur qui désigne prend la place du Procureur, tandis que le joueur désigné prend la place de l&#x27;Accusé.
2. Le Procureur peut alors expliquer son accusation.
3. Ensuite, l&#x27;Accusé peut se défendre.
4. Enfin, le village peut interroger l&#x27;accusé.
5. Une fois l&#x27;interrogatoire terminé, le village vote pour décider s&#x27;il souhaite exécuter l’accusé.
6. Au moins la moitié du village doit voter OUI pour que l&#x27;accusé soit exécuté.

> [!IMPORTANT]
> IL PEUT Y AVOIR PLUSIEURS NOMINATIONS PAR JOUR.
<a id="nuit"></a>

### Nuit
Après le tribunal, tout le village va dormir (fermer les yeux au tribunal). Il est important que les joueurs gardent toujours les mêmes places ! Pendant la nuit, le Meneur guide tout le village pour qu&#x27;il remplisse ses fonctions de personnage.
<a id="fantomes"></a>

### Fantômes
Il existe deux types de mort : EXÉCUTION (condamnés par le village) ou ASSASSINAT (tués par le pouvoir d&#x27;un personnage).

Lorsqu&#x27;un joueur est tué pendant la nuit, il ne meurt réellement que le matin, au réveil, et peut donc continuer à utiliser ses pouvoirs pendant la nuit.

Les joueurs morts se transforment en fantômes, qui peuvent continuer à communiquer avec le village pendant la journée, mais ne peuvent ni parler ni voter au tribunal, et perdent tous les pouvoirs qu&#x27;ils avaient (sauf indication contraire dans la fiche de personnage). Les fantômes gardent le même objectif que lorsqu&#x27;ils étaient vivants. Les fantômes DORMENT ÉGALEMENT LA NUIT.

<a id="objectifs-de-victoire"></a>

### Objectifs de victoire
- **Villageois :** tuer tous les Loups-garous.
- **Créatures Maléfiques :** tuer tous les Villageois.
- **Amoureux et Cupidon :** les amoureux doivent être les seuls survivants.
- **Amant secret :** être le seul survivant avec l&#x27;un des amoureux.
- **Loup-garou blanc :** être le seul survivant.

---
<a id="quick-list"></a>
<a id="liste-rapide-de-personnages"></a>

## Liste rapide de personnages
Utilises cette liste comme carte de navigation pour sauter directement à une fiche dans le tableau.

### Essentiels

| Code | Personnage | Fiche |
|---|---|---|
| `e01` | Loup-garou | [voir fiche](#e01) |
| `e02` | Méchante Sorcière | [voir fiche](#e02) |
| `e03` | Chaman | [voir fiche](#e03) |
| `e04` | Voyante | [voir fiche](#e04) |

### Villageois

| Code | Personnage | Fiche |
|---|---|---|
| `v01` | Petite Fille | [voir fiche](#v01) |
| `v02` | Maître de l’Ours | [voir fiche](#v02) |
| `v03` | Maître du Corbeau | [voir fiche](#v03) |
| `v04` | Maître du Renard | [voir fiche](#v04) |
| `v05` | Maître des Lapins | [voir fiche](#v05) |
| `v06` | Marionnettiste | [voir fiche](#v06) |
| `v07` | Chevalier Rouillé | [voir fiche](#v07) |
| `v08` | Chasseur | [voir fiche](#v08) |
| `v08b` | Petit Chaperon Rouge | [voir fiche](#v08b) |
| `v09` | Capitaine | [voir fiche](#v09) |
| `v10` | Paranoïaque | [voir fiche](#v10) |
| `v11` | Ancien du Village | [voir fiche](#v11) |
| `v12` | Gitane | [voir fiche](#v12) |
| `v13` | Juge | [voir fiche](#v13) |
| `v14` | Accusateur | [voir fiche](#v14) |
| `v15` | Pyromane | [voir fiche](#v15) |
| `v16` | Somnambule | [voir fiche](#v16) |
| `v17` | Sauveur | [voir fiche](#v17) |
| `v18` | Ange | [voir fiche](#v18) |
| `v19` | Prophète | [voir fiche](#v19) |
| `v20` | Domestique | [voir fiche](#v20) |
| `v21` | Falotier | [voir fiche](#v21) |
| `v22` | Enfant | [voir fiche](#v22) |
| `v23` | Maître de l’Araignée | [voir fiche](#v23) |

### Créatures Maléfiques

| Code | Personnage | Fiche |
|---|---|---|
| `m01` | Méchant Loup-garou | [voir fiche](#m01) |
| `m02` | Loup-garou Voyante | [voir fiche](#m02) |
| `m03` | Loup-garou Vampire | [voir fiche](#m03) |
| `m04` | Ankou | [voir fiche](#m04) |
| `m05` | Méchant Cupidon | [voir fiche](#m05) |

### Personnages indépendants

| Code | Personnage | Fiche |
|---|---|---|
| `s01` | Cupidon | [voir fiche](#s01) |
| `s02` | Loup-garou Blanc | [voir fiche](#s02) |

### Personnages flexibles

| Code | Personnage | Fiche |
|---|---|---|
| `f01` | Voleur | [voir fiche](#f01) |
| `f02` | Espion | [voir fiche](#f02) |

### Personnages complexes

| Code | Personnage | Fiche |
|---|---|---|
| `a01` | Ivrogne | [voir fiche](#a01) |
| `a02` | Chien-Loup | [voir fiche](#a02) |
| `a03` | Mime | [voir fiche](#a03) |
| `a04` | Comédien | [voir fiche](#a04) |
| `a05` | Pilleur de Tombes | [voir fiche](#a05) |
| `a06` | Illusionniste | [voir fiche](#a06) |
| `as01b` | Arnacœur | [voir fiche](#as01b) |

### Personnages nuls (pour quand il y a beaucoup de joueurs)

| Code | Personnage | Fiche |
|---|---|---|
| `l01` | Villageois Triste | [voir fiche](#l01) |
| `l02` | Enfant Sauvage | [voir fiche](#l02) |
| `l03` | Sœurs | [voir fiche](#l03) |
| `l04` | Frères | [voir fiche](#l04) |

### Extras

| Code | Personnage | Fiche |
|---|---|---|
| `x01` | Villageois | [voir fiche](#x01) |
| `x02` | Créatures Maléfiques | [voir fiche](#x02) |
| `x02.1` | Loups-garous | [voir fiche](#x02.1) |
| `x03` | Fantômes | [voir fiche](#x03) |
| `x.v09` | Soldat | [voir fiche](#x.v09) |
| `x.s01` | Amoureux | [voir fiche](#x.s01) |
| `x.as01b.1` | Traître | [voir fiche](#x.as01b.1) |
| `x.as01b.2` | Trahi | [voir fiche](#x.as01b.2) |
| `x.m05` | Ennemi | [voir fiche](#x.m05) |

---
<a id="personnages"></a>

## Personnages

<a id="essentiels"></a>

### Essentiels

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carte</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONNAGE e01 — Loup-garou -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="e01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/e01_final.png" alt="Carte : Loup-garou" width="130">
    <div><code>e01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>e01</code> · Loup-garou <span class="role-badge">Créatures Maléfiques</span></div>
    <div class="role-meta">Catégorie : Essentiels · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, il choisit, avec les autres Loups-garous, qui ils assassineront.</p>
      <p><strong>Si n’importe quel Loup-garou est empoisonné :</strong><br>Ils ne peuvent pas tuer.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Villageois.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE e02 — Méchante Sorcière -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="e02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/e02_final.png" alt="Carte : Méchante Sorcière" width="130">
    <div><code>e02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>e02</code> · Méchante Sorcière <span class="role-badge">Créatures Maléfiques</span></div>
    <div class="role-meta">Catégorie : Essentiels · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">NE</span> SE RÉVEILLE <span class="rule-red">PAS</span> AVEC LES LOUPS-GAROUS.</p>
      <p><span class="rule-red">Chaque nuit</span>, la sorcière peut empoisonner un personnage.</p>
      <p>Le joueur affecté aura de la difficulté à contrôler ses pouvoirs (recevra de fausses informations).</p>
      <p><strong>Si empoisonné :</strong><br>Est immune à tout attaque.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Villageois.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE e03 — Chaman -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="e03">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/e03_final.png" alt="Carte : Chaman" width="130">
    <div><code>e03</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>e03</code> · Chaman <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Essentiels · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span> est montré les joueurs  <span class="rule-red">assassinés</span> et peut choisir de les sauver.</p>
      <p>Le Chaman peut sauver (👍) <span class="rule-red">deux</span> joueurs <span class="rule-red">pendant tout le jeu</span>.</p>
      <p><strong>Si empoisonné :</strong><br>Ne sauve pas le joueur.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE e04 — Voyante -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="e04">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/e04_final.png" alt="Carte : Voyante" width="130">
    <div><code>e04</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>e04</code> · Voyante <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Essentiels · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque fois qu’un joueur meurt</span>, la Voyante découvre son pouvoir <span class="rule-red">(elle sera informée la nuit suivante)</span>.</p>
      <p><strong>Si empoisonné :</strong><br>Recevra de fausses informations.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="villageois"></a>

### Villageois

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carte</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONNAGE v01 — Petite Fille -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v01_final.png" alt="Carte : Petite Fille" width="130">
    <div><code>v01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v01</code> · Petite Fille <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, les joueurs  <span class="rule-red">assassinés</span> lui sont montrés et elle découvre comment ils sont morts.</p>
      <p>Le Meneur lui montrera le rôle dont le pouvoir l’a tué.</p>
      <p>S’il s&#x27;agit d’un Amoureux s’étant suicidé, le carte de Cupidon lui sera montrée.</p>
      <p>Si l’assassin était un Soldat, la carte du Capitaine lui sera montrée.</p>
      <p><strong>Si empoisonné :</strong><br>Recevra de fausses informations.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v02 — Maître de l’Ours -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v02_final.png" alt="Carte : Maître de l’Ours" width="130">
    <div><code>v02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v02</code> · Maître de l’Ours <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, si un de ces voisins s’agit d’une Créature Maléfique, l’Ours grogne.</p>
      <p><strong>Si empoisonné :</strong><br>Recevra de fausses informations.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v03 — Maître du Corbeau -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v03">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v03_final.png" alt="Carte : Maître du Corbeau" width="130">
    <div><code>v03</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v03</code> · Maître du Corbeau <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, le Meneur lui révèle silencieusement le nombre de Créatures Maléfiques vivantes en jeu.</p>
      <p><strong>Si empoisonné :</strong><br>Recevra de fausses informations.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v04 — Maître du Renard -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v04">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v04_final.png" alt="Carte : Maître du Renard" width="130">
    <div><code>v04</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v04</code> · Maître du Renard <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, il choisit un joueur et le Meneur lui révèle si entre lui et ses voisins il y a une Créature Maléfique (👍) ou pas (👎).</p>
      <p><span class="rule-red">Dès la deuxième nuit</span>, si tous les trois sont des Villageois, le Renard fuit et le Maître du Renard perd son pouvoir.</p>
      <p><strong>Si empoisonné :</strong><br>Recevra de fausses informations.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v05 — Maître des Lapins -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v05">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v05_final.png" alt="Carte : Maître des Lapins" width="130">
    <div><code>v05</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v05</code> · Maître des Lapins <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, si un de ces voisins ou soi-même est attaqué par les Loups-garous ou empoisonné par la Sorcière, les lapins auront peur.</p>
      <p><strong>Si empoisonné :</strong><br>Recevra de fausses informations.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v06 — Marionnettiste -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v06">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v06_final.png" alt="Carte : Marionnettiste" width="130">
    <div><code>v06</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v06</code> · Marionnettiste <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Il fait semblant d’être un Loup-garou.</p>
      <p><span class="rule-red">Il se réveille en même temps que les Loups-garous</span> et vote avec eux.</p>
      <p><strong>Si empoisonné :</strong><br>Ne se réveille pas ; sera touché une fois que la Méchante Sorcière s’endorme.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v07 — Chevalier Rouillé -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v07">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v07_final.png" alt="Carte : Chevalier Rouillé" width="130">
    <div><code>v07</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v07</code> · Chevalier Rouillé <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Une fois mort</span>, le Loup-garou le plus proche mourra durant la prochaine journée. Sa mort sera annoncée au début du Tribunal.</p>
      <p><strong>Si empoisonné quand il meurt :</strong><br>Assassine le mauvais joueur.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v08 — Chasseur -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v08">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v08_final.png" alt="Carte : Chasseur" width="130">
    <div><code>v08</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v08</code> · Chasseur <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Une fois mort</span>, sera réveillé la prochaine nuit et choisira <span class="rule-red">un</span> joueur qui sera assassiné.</p>
      <p><span class="rule-red">Si le Petit Chaperon Rouge est exécuté</span>, il sera réveillé la nuit suivante et choisira <span class="rule-red">un</span> joueur qui sera assassiné. (Pourra tout de même tuer un joueur quand il meurt).</p>
      <p><strong>Si empoisonné quand il meurt :</strong><br>Assassine le mauvais joueur.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v08b — Petit Chaperon Rouge -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v08b">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v08b_final.png" alt="Carte : Petit Chaperon Rouge" width="130">
    <div><code>v08b</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v08b</code> · Petit Chaperon Rouge <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Est immune aux <span class="rule-red">assassinats des Loups-garous</span> tant que le Chasseur soit en vie.</p>
      <p>Si <span class="rule-red">exécuté pendant que le Chasseur est vivant</span>, le Chasseur peut tuer quelqu’un la nuit suivante.</p>
      <p><strong>Si empoisonné :</strong><br>Perd son immunité cette nuit-là.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v09 — Capitaine -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v09">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v09_final.png" alt="Carte : Capitaine" width="130">
    <div><code>v09</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v09</code> · Capitaine <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, choisit un Soldat pour une nuit et un jour. Le Soldat sera touché par le Meneur.</p>
      <p>Si le Soldat meurt, il pourra tuer quelqu’un la nuit suivante.</p>
      <p><strong>Si empoisonné :</strong><br>Le pouvoir affecte le mauvais joueur.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v10 — Paranoïaque -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v10">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v10_final.png" alt="Carte : Paranoïaque" width="130">
    <div><code>v10</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v10</code> · Paranoïaque <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Deux fois</span> dans le jeu, <span class="rule-red">pendant le jour</span>, il peut dire <span class="rule-red">discrètement</span> au Meneur un joueur qu’il veut <span class="rule-red">assassiner</span>, sa mort sera annoncée au Tribunal.</p>
      <p><strong>Si empoisonné :</strong><br>Assassine le mauvais joueur.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v11 — Ancien du Village -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v11">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v11_final.png" alt="Carte : Ancien du Village" width="130">
    <div><code>v11</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v11</code> · Ancien du Village <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, il choisit un joueur qui aura automatiquement deux votes contre lui s’il est accusé au Tribunal du jour suivant.</p>
      <p><strong>Si empoisonné :</strong><br>Les votes du joueur choisi seront doublés.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v12 — Gitane -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v12">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v12_final.png" alt="Carte : Gitane" width="130">
    <div><code>v12</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v12</code> · Gitane <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, choisit un joueur et le Meneur révèlera si entre lui et ses voisins il y a quelqu’un empoisonné.</p>
      <p>Si c’est le cas, elle sera avertie (👍/👎), le joueur perd le poison et la Gitane devient empoisonnée.</p>
      <p><strong>Si empoisonné :</strong><br>Ses votes sont doublés.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v13 — Juge -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v13">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v13_final.png" alt="Carte : Juge" width="130">
    <div><code>v13</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v13</code> · Juge <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Deux fois dans tous le jeu</span>, il peut se révéler et annuler une exécution au Tribunal.</p>
      <p>Il ne peut utiliser ce pouvoir qu&#x27;une fois par jour.</p>
      <p><span class="rule-red">Si assassiné</span>, son Fantôme <span class="rule-red">peut continuer à voter</span> et son vote sera doublé.</p>
      <p><strong>Si empoisonné :</strong><br>L’annulation n’aura aucun effet.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v14 — Accusateur -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v14">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v14_final.png" alt="Carte : Accusateur" width="130">
    <div><code>v14</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v14</code> · Accusateur <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Deux fois dans tout le jeu</span>, il peut se révéler et forcer une exécution au Tribunal.</p>
      <p>Il ne peut utiliser ce pouvoir qu&#x27;une fois par jour.</p>
      <p><strong>Si empoisonné :</strong><br>L’exécution n’aura aucun effet.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v15 — Pyromane -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v15">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v15_final.png" alt="Carte : Pyromane" width="130">
    <div><code>v15</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v15</code> · Pyromane <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Quand un joueur est accusé au Tribunal, mais <span class="rule-red">n’est pas exécuté</span>, le Pyromane <span class="rule-red">peut choisir</span> la <span class="rule-red">nuit suivante</span> d&#x27;incendier la maison de ce joueur (👍/👎).</p>
      <p>Ce joueur meurt s’il est un Loup-garou, sinon, perd ses pouvoirs de façon permanente.</p>
      <p><strong>Si empoisonné :</strong><br>Il incendie la mauvaise maison.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v16 — Somnambule -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v16">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v16_final.png" alt="Carte : Somnambule" width="130">
    <div><code>v16</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v16</code> · Somnambule <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Au début de chaque nuit</span>, il choisit un joueur qu’il visitera.</p>
      <p><br>Ce joueur sera touché et ne sera pas appelé cette nuit-là.</p>
      <p>Si ce joueur est tout de même appelé (par ex. Loup-garou), il ne se réveille pas.</p>
      <p><strong>Si empoisonné :</strong><br>Va dormir chez le mauvais joueur.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v17 — Sauveur -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v17">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v17_final.png" alt="Carte : Sauveur" width="130">
    <div><code>v17</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v17</code> · Sauveur <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, il choisit un joueur qui sera immune <span class="rule-red">pendant une nuit et un jour</span>.</p>
      <p>Il peut aussi se choisir soi-même.</p>
      <p><strong>Si empoisonné :</strong><br>Donne immunité au mauvais joueur.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v18 — Ange -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v18">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v18_final.png" alt="Carte : Ange" width="130">
    <div><code>v18</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v18</code> · Ange <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Peut ressusciter <span class="rule-red">deux</span> Fantômes <span class="rule-red">durant tout le jeu</span>.</p>
      <p>Si le Fantôme avait un pouvoir avec des utilisations limitées, il les récupère.</p>
      <p>(Il peut demander discrètement d’utiliser son pouvoir à tout moment au Meneur ; le Fantôme sera ressuscité la nuit suivante.)</p>
      <p><strong>Si empoisonné :</strong><br>Ressuscite le mauvais joueur.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v19 — Prophète -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v19">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v19_final.png" alt="Carte : Prophète" width="130">
    <div><code>v19</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v19</code> · Prophète <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">À la fin de chaque nuit</span>, le Prophète montre un joueur qu’il croit avoir été tué durant cette nuit.</p>
      <p>Si sa prophétie est correcte (👍), le joueur sera touché et pourra utiliser son pouvoir en tant que Fantôme durant le jour et la nuit suivants.</p>
      <p>Cela inclut notamment les rôles à pouvoirs limités.</p>
      <p><strong>Si empoisonné :</strong><br>La prophétie sera de toute façon fausse.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v20 — Domestique -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v20">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v20_final.png" alt="Carte : Domestique" width="130">
    <div><code>v20</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v20</code> · Domestique <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, le Meneur lui révèle la distance de la personne empoisonné</p>
      <p>(Ex. : 3 = la troisième personne à droite ou à gauche).</p>
      <p><strong>Si empoisonné :</strong><br>Recevra de fausses informations.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v21 — Falotier -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v21">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v21_final.png" alt="Carte : Falotier" width="130">
    <div><code>v21</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v21</code> · Falotier <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, il est montré un rôle en jeu qui a des utilisations limitées de son pouvoir et combien d’utilisations lui reste.</p>
      <p><strong>Si empoisonné :</strong><br>Recevra de fausses informations.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v22 — Enfant -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v22">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v22_final.png" alt="Carte : Enfant" width="130">
    <div><code>v22</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v22</code> · Enfant <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Chaque fois qu’il accuse quelqu’un au Tribunal, il lui sera révélé la <span class="rule-red">nuit suivante</span> si ce joueur était un Loup-garou ou pas.</p>
      <p><span class="rule-red">Ne peut jamais amener le même joueur au Tribunal deux fois</span>.</p>
      <p><strong>Si empoisonné :</strong><br>Recevra de fausses informations.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE v23 — Maître de l’Araignée -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v23">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v23_final.png" alt="Carte : Maître de l’Araignée" width="130">
    <div><code>v23</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v23</code> · Maître de l’Araignée <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Villageois · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">La première nuit</span>, il choisit un joueur chez qui il fera une toile d’araignée.</p>
      <p><span class="rule-red">Chaque nuit après la première</span>, le Meneur révèle au Maître de l’Araignée chaque carte qui a pointé le joueur avec la toile cette nuit-là.</p>
      <p><span class="rule-red">La nuit suivant la mort du joueur avec la toile d’araignée</span>, le Maître de l’Araignée est réveillé et en choisit un nouveau.</p>
      <p><span class="rule-red">Une fois</span> dans le jeu, <span class="rule-red">pendant le jour</span>, il peut dire <span class="rule-red">discrètement</span> au Meneur s’il souhaite changer le joueur avec la toile avant la mort de celui-ci.</p>
      <p><strong>Si empoisonné :</strong><br>Recevra de fausses informations.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="creatures-malefiques"></a>

### Créatures Maléfiques

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carte</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONNAGE m01 — Méchant Loup-garou -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="m01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/m01_final.png" alt="Carte : Méchant Loup-garou" width="130">
    <div><code>m01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>m01</code> · Méchant Loup-garou <span class="role-badge">Créatures Maléfiques</span></div>
    <div class="role-meta">Catégorie : Créatures Maléfiques · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Deux fois</span> par jeu, il choisit s’il veut se déguiser en Grand-maman (👍/👎), ce qui lui donne immunité pendant un jour et une nuit.</p>
      <p><span class="rule-red">Même étant immune</span>, il peut être <span class="rule-red">exécuté</span> au Tribunal si accusé par le Petit Chaperon Rouge. Dans ce cas spécifiquement, si le Chasseur vote, le Méchant Loup-garou est exécuté automatiquement.</p>
      <p><strong>Si n’importe quel Loup-garou est empoisonné :</strong><br>Ils ne peuvent pas tuer.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Villageois.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE m02 — Loup-garou Voyante -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="m02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/m02_final.png" alt="Carte : Loup-garou Voyante" width="130">
    <div><code>m02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>m02</code> · Loup-garou Voyante <span class="role-badge">Créatures Maléfiques</span></div>
    <div class="role-meta">Catégorie : Créatures Maléfiques · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Après que les Loups-garous ont choisi leur victime, le Loup-garou Voyante peut <span class="rule-red">choisir</span> NE PAS TUER ce joueur mais, à la place, voir son pouvoir.</p>
      <p><strong>Si n’importe quel Loup-garou est empoisonné :</strong><br>Ils ne peuvent pas tuer.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Villageois.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE m03 — Loup-garou Vampire -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="m03">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/m03_final.png" alt="Carte : Loup-garou Vampire" width="130">
    <div><code>m03</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>m03</code> · Loup-garou Vampire <span class="role-badge">Créatures Maléfiques</span></div>
    <div class="role-meta">Catégorie : Créatures Maléfiques · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Une seule fois dans tout le jeu</span>, il peut transformer la victime des Loups-garous en Loup-garou.</p>
      <p>La victime sera touchée. Elle <span class="rule-red">gardera ses pouvoirs de Villageois si elle le souhaite</span> (👍/👎) mais jouera avec l’objectif des Créatures Méchantes.</p>
      <p>Si la victime avait un pouvoir avec des utilisations limitées, elle les récupère.</p>
      <p><strong>Si n’importe quel Loup-garou est empoisonné :</strong><br>Ils ne peuvent pas tuer.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Villageois.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE m04 — Ankou -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="m04">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/m04_final.png" alt="Carte : Ankou" width="130">
    <div><code>m04</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>m04</code> · Ankou <span class="role-badge">Créatures Maléfiques</span></div>
    <div class="role-meta">Catégorie : Créatures Maléfiques · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">NE</span> SE RÉVEILLE <span class="rule-red">PAS</span> AVEC LES LOUPS-GAROUS.</p>
      <p><span class="rule-red">Si exécuté</span>, son Fantôme <span class="rule-red">peut continuer à voter</span> et son vote sera doublé.</p>
      <p><strong>Si empoisonné :</strong><br>Sans effet.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Villageois.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE m05 — Méchant Cupidon -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="m05">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/m05_final.png" alt="Carte : Méchant Cupidon" width="130">
    <div><code>m05</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>m05</code> · Méchant Cupidon <span class="role-badge">Créatures Maléfiques</span></div>
    <div class="role-meta">Catégorie : Créatures Maléfiques · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">NE</span> SE RÉVEILLE <span class="rule-red">PAS</span> AVEC LES LOUPS-GAROUS.</p>
      <p><strong><span class="rule-red">La première nuit</span> est appelé pour choisir deux joueurs qui seront Ennemis :</strong></p>
      <p>Si un Ennemi arrive à amener l’autre à <span class="rule-red">exécution</span>, le premier reçoit immunité contre le prochain <span class="rule-red">assassinat</span>.</p>
      <p><span class="rule-red">Après la mort de chaque Ennemi</span>, le Méchant Cupidon est réveillé pour choisir un nouvel Ennemi pour le survivant.</p>
      <p><strong>Si empoisonné :</strong><br>Sans effet.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Villageois.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="personnages-independants"></a>

### Personnages indépendants

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carte</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONNAGE s01 — Cupidon -->
<!-- ============================================================ -->
<tr class="role-row faction-independent" id="s01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/s01_final.png" alt="Carte : Cupidon" width="130">
    <div><code>s01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟪 <code>s01</code> · Cupidon <span class="role-badge">Indépendant</span></div>
    <div class="role-meta">Catégorie : Personnages indépendants · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><strong><span class="rule-red">La première nuit</span>, il est appelé pour choisir deux joueurs qui seront Amoureux :</strong></p>
      <p>Si un Amoureux meurt, l’autre se suicide.</p>
      <p><span class="rule-red">L’objectif des Amoureux est qu&#x27;ils soient les derniers survivants</span>.</p>
      <p><span class="rule-red">Deux fois pendant le jeu</span>, Cupidon peut choisir de donner immunité aux Amoureux pendant cette nuit-là (👍).</p>
      <p><strong>Si empoisonné :</strong><br>La protection ne fonctionne pas.</p>
      <p><strong>Objectif :</strong><br>Que les Amoureux soient les derniers survivants.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE s02 — Loup-garou Blanc -->
<!-- ============================================================ -->
<tr class="role-row faction-independent" id="s02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/s02_final.png" alt="Carte : Loup-garou Blanc" width="130">
    <div><code>s02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟪 <code>s02</code> · Loup-garou Blanc <span class="role-badge">Indépendant</span></div>
    <div class="role-meta">Catégorie : Personnages indépendants · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Il se réveille et agit comme un Loup-garou, mais <span class="rule-red">à chaque trois nuits, il doit</span> aussi assassiner un Loup-garou.</p>
      <p><span class="rule-red">Si le Loup-garou Blanc est le seul Loup-garou restant</span>, il continue d’être appelé à chaque trois nuits, pour assassiner un joueur supplémentaire.</p>
      <p><strong>Si empoisonné :</strong><br>Peut tuer un Loup-garou de plus.</p>
      <p><strong>Objectif :</strong><br>Être le dernier survivant.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="personnages-flexibles"></a>

### Personnages flexibles

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carte</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONNAGE f01 — Voleur -->
<!-- ============================================================ -->
<tr class="role-row faction-flex" id="f01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/f01_final.png" alt="Carte : Voleur" width="130">
    <div><code>f01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟨 <code>f01</code> · Voleur <span class="role-badge">Flexible</span></div>
    <div class="role-meta">Catégorie : Personnages flexibles · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, il choisit un joueur qui n’aura pas de votes au prochain Tribunal.</p>
      <p><span class="rule-red">La deuxième nuit</span>, il devra <span class="rule-red">choisir</span> être du côté des Villageois (👍) ou des Loups-garous (👎).</p>
      <p><span class="rule-red">NE</span> SE RÉVEILLE <span class="rule-red">PAS</span> AVEC LES LOUPS-GAROUS.</p>
      <p><strong>Si empoisonné :</strong><br>Le vote n’est pas volé.</p>
      <p><strong>Objectif :</strong><br>À choix.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE f02 — Espion -->
<!-- ============================================================ -->
<tr class="role-row faction-flex" id="f02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/f02_final.png" alt="Carte : Espion" width="130">
    <div><code>f02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟨 <code>f02</code> · Espion <span class="role-badge">Flexible</span></div>
    <div class="role-meta">Catégorie : Personnages flexibles · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, il est appelé et voit la carte d’un rôle en jeu. Il ne verra jamais le rôle d’un même joueur deux fois.</p>
      <p><span class="rule-red">La deuxième nuit</span>, il devra <span class="rule-red">choisir</span> être du côté des Villageois (👍) ou des Loups-garous (👎).</p>
      <p><span class="rule-red">NE</span> SE RÉVEILLE <span class="rule-red">PAS</span> AVEC LES LOUPS-GAROUS.</p>
      <p><strong>Si empoisonné :</strong><br>Il verra un rôle qui n’est pas en jeu.</p>
      <p><strong>Objectif :</strong><br>À choix.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="personnages-complexes"></a>

### Personnages complexes

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carte</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONNAGE a01 — Ivrogne -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="a01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/a01_final.png" alt="Carte : Ivrogne" width="130">
    <div><code>a01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>a01</code> · Ivrogne <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Personnages complexes · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Ne sait pas qu’il est l&#x27;ivrogne</span>.</p>
      <p><span class="rule-red">Remplace</span> la Voyante, la Petite Fille, le Somnambule, le Maître de l’Ours, le Maître des Lapins, le Maître du Corbeau, le Maître du Renard ou le Maître de l’Araignée (aléatoire à chaque jeu).</p>
      <p>Mais toutes les informations reçues sont comme si la carte était empoisonnée.</p>
      <p><strong>Si empoisonné :</strong><br>Reçoit les bonnes informations.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE a02 — Chien-Loup -->
<!-- ============================================================ -->
<tr class="role-row faction-flex" id="a02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/a02_final.png" alt="Carte : Chien-Loup" width="130">
    <div><code>a02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟨 <code>a02</code> · Chien-Loup <span class="role-badge">Flexible</span></div>
    <div class="role-meta">Catégorie : Personnages complexes · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><strong><span class="rule-red">Le deuxième nuit</span>, il peut <span class="rule-red">choisir</span> entre être un simple Loup-garou (👎) <span class="rule-red">ou</span> être un Chien (👍) :</strong></p>
      <p>Le Chien choisit un maître copie ses pouvoirs.</p>
      <p><span class="rule-red">Chaque nuit</span>, il se réveille avec son maître et peut ainsi agir indépendamment de ce dernier.</p>
      <p><strong>Si empoisonné :</strong><br>Effet du maître qu’il copie ou Loup-garou.</p>
      <p><strong>Objectif :</strong><br>À choix ou selon maître</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE a03 — Mime -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="a03">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/a03_final.png" alt="Carte : Mime" width="130">
    <div><code>a03</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>a03</code> · Mime <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Personnages complexes · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, il est appelé et voit la carte d’un rôle en jeu.</p>
      <p>Aussitôt la carte révélée, le Mime indique l’action qu’il souhaite prendre selon le pouvoir.</p>
      <p>Toutes les interactions entre le Mime et le Meneur sont complètement silencieuses, indépendamment du rôle copié.</p>
      <p><strong>Si empoisonné :</strong><br>Effet du personnage qu’il copie.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE a04 — Comédien -->
<!-- ============================================================ -->
<tr class="role-row faction-shifting" id="a04">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/a04_final.png" alt="Carte : Comédien" width="130">
    <div><code>a04</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩🟨 <code>a04</code> · Comédien <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Personnages complexes · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">La première nuit</span>, il choisit un joueur qui devient son Idole et dont il copiera les pouvoirs aussitôt que ce dernier meurt. Le rôle lui est seulement révélé après la mort de l’Idole.</p>
      <p>Il peut changer son Idole <span class="rule-red">deux fois par jeu</span> (👈/👎).</p>
      <p><strong>Si empoisonné :</strong><br>Effet du personnage qu’il copie.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous. (flexible)</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE a05 — Pilleur de Tombes -->
<!-- ============================================================ -->
<tr class="role-row faction-shifting" id="a05">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/a05_final.png" alt="Carte : Pilleur de Tombes" width="130">
    <div><code>a05</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩🟨 <code>a05</code> · Pilleur de Tombes <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Personnages complexes · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span> est montré les joueurs  <span class="rule-red">assassinés</span>.</p>
      <p>Sans savoir leurs pouvoirs, le Pilleur de Tombe peut choisir changer de carte avec une des victimes (👈/👎).</p>
      <p>Une fois choisi, le rôle lui sera révélé.</p>
      <p>Le Pilleur de Tombes devient permanemment le rôle volé. La victime devient Pilleur de Tombes.</p>
      <p>Le Pilleur de Tombes sera dorénavant appelé par le nom de son nouveau rôle.</p>
      <p><strong>Si empoisonné :</strong><br>Ne se réveille pas.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous. (flexible)</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE a06 — Illusionniste -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="a06">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/a06_final.png" alt="Carte : Illusionniste" width="130">
    <div><code>a06</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>a06</code> · Illusionniste <span class="role-badge">Créatures Maléfiques</span></div>
    <div class="role-meta">Catégorie : Personnages complexes · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">NE</span> SE RÉVEILLE <span class="rule-red">PAS</span> AVEC LES LOUPS-GAROUS.</p>
      <p><span class="rule-red">Chaque nuit</span>, il choisit un joueur (qui peut être soi-même). Celui-ci sera offusqué par une Illusion.</p>
      <p>Si la Voyante, Loup-garou Voyante, le Maître de l’Araignée, le Falotier ou l’Espion voient une Illusion, ils verront le rôle “Illusionniste”.</p>
      <p>Si le Mime copie une Illusion, il copiera l&#x27;Illusionniste.</p>
      <p>Si l’une des cibles des Maîtres des Animaux est une Illusion, l’animal sera confus. Dans le cas du Maître de l’Araignée, si le joueur avec la toile d’araignée est une Illusion, l’araignée sera confuse.</p>
      <p>Si l’assassin de la victime choisi par la Petite Fille est une Illusion, la Petite Fille verra le rôle “Illusionniste”.</p>
      <p>Si le joueur accusé par l’Enfant est une Illusion, l’Enfant recevra l’information que le joueur n’était pas un Loup-garou, même s’il s’en agissait d’un.</p>
      <p><strong>Si empoisonné :</strong><br>L’Illusion ne sera pas créée.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Villageois.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE as01b — Arnacœur -->
<!-- ============================================================ -->
<tr class="role-row faction-independent" id="as01b">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/as01b_final.png" alt="Carte : Arnacœur" width="130">
    <div><code>as01b</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟪 <code>as01b</code> · Arnacœur <span class="role-badge">Indépendant</span></div>
    <div class="role-meta">Catégorie : Personnages complexes · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">Chaque nuit</span>, il montre un joueur du doigt et le Meneur lui révèle s’il s’agit d’un des Amoureux (👍) ou pas (👎).</p>
      <p>Si le joueur est un des Amouruex, celui-ci sera informé, et l’Arnacoeur <span class="rule-red">remplacera l’autre Amoureux</span> sans que celui-ci le sache.</p>
      <p>Si le Traître ou l’Arnacoeur meurt, le Trahi ne mourra pas.</p>
      <p>La flèche de protection de Cupidon protège également l&#x27;identité des Amoureux (la réponse sera 👎).</p>
      <p><strong>Si empoisonné :</strong><br>Le Meneur annonce qu’un des Amoureux a été remplacé.</p>
      <p><strong>Objectif :</strong><br>Que l’Arnacoeur et le Traître soient les derniers survivants.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="personnages-nuls-pour-quand-il-y-a-beaucoup-de-joueurs"></a>

### Personnages nuls (pour quand il y a beaucoup de joueurs)

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carte</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONNAGE l01 — Villageois Triste -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="l01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/l01_final.png" alt="Carte : Villageois Triste" width="130">
    <div><code>l01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>l01</code> · Villageois Triste <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Personnages nuls (pour quand il y a beaucoup de joueurs) · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Sans pouvoir spéciaux.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE l02 — Enfant Sauvage -->
<!-- ============================================================ -->
<tr class="role-row faction-shifting" id="l02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/l02_final.png" alt="Carte : Enfant Sauvage" width="130">
    <div><code>l02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩🟨 <code>l02</code> · Enfant Sauvage <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Personnages nuls (pour quand il y a beaucoup de joueurs) · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p><span class="rule-red">La deuxième nuit</span>, il choisit un joueur comme Père Adoptif.</p>
      <p><span class="rule-red">Si le Père Adoptif meurt</span>, l’Enfant Sauvage se transforme en Loup-garou.</p>
      <p><strong>Si empoisonné :</strong><br>Il se transforme en Loup-garou.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous. (flexible)</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE l03 — Sœurs -->
<!-- ============================================================ -->
<tr class="role-row faction-shifting" id="l03">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/l03_final.png" alt="Carte : Sœurs" width="130">
    <div><code>l03</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩🟨 <code>l03</code> · Sœurs <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Personnages nuls (pour quand il y a beaucoup de joueurs) · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Les Soeurs se connaissent.</p>
      <p>Si une soeur est <span class="rule-red">exécutée</span>, l’autre peut <span class="rule-red">choisir</span> de se venger, se transformant en Créature Maléfique.</p>
      <p>Elle se réveille <span class="rule-red">UNE FOIS</span> avec les Loups-garous la nuit suivante pour qu’ils sachent qu’elle les aidera.</p>
      <p><strong>Si empoisonnée en tant que Créature Maléfique :</strong><br>Elle se transforme en Loup-garou.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous. (flexible)</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE l04 — Frères -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="l04">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/l04_final.png" alt="Carte : Frères" width="130">
    <div><code>l04</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>l04</code> · Frères <span class="role-badge">Villageois</span></div>
    <div class="role-meta">Catégorie : Personnages nuls (pour quand il y a beaucoup de joueurs) · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Les Frères se connaissent.</p>
      <p>Tant qu’au moins deux survivent la nuit, aucun d’eux ne meurt.</p>
      <p><strong>Si  n’importe quel Frère empoisonné :</strong><br>Il meurt tout de même.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="extras"></a>

### Extras

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carte</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONNAGE x01 — Villageois -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/x01_card.png" alt="Carte : Villageois" width="130">
    <div><code>x01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x01</code> · Villageois <span class="role-badge">Extra</span></div>
    <div class="role-meta">Catégorie : Extras · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Effrayés et méfiants, les Villageois mentent, tentent de trouver des personnes dignes de confiance et utilisent leurs pouvoirs pour tuer et exécuter tous les Loups-garous et autres Créatures Maléfiques avant que ceux-ci ne s&#x27;emparent du village.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Loups-garous.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE x02 — Créatures Maléfiques -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/x02_card.png" alt="Carte : Créatures Maléfiques" width="130">
    <div><code>x02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x02</code> · Créatures Maléfiques <span class="role-badge">Extra</span></div>
    <div class="role-meta">Catégorie : Extras · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Inclut tous les ennemis des Villageois, ceux-là étant les Loups-garous ou les autres personnages maléfiques.</p>
      <p>L’objectif de toutes les Créatures Maléfiques est le même : tuer tous les Villageois, avant que ces derniers ne trouvent tous les Loups-garous.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Villageois.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE x02.1 — Loups-garous -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x02.1">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/x021_card.png" alt="Carte : Loups-garous" width="130">
    <div><code>x02.1</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x02.1</code> · Loups-garous <span class="role-badge">Extra</span></div>
    <div class="role-meta">Catégorie : Extras · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>C’est le groupe qui terrorise le plus les Villageois.</p>
      <p>Chacun doit choisir unanimement qui ils assassineront, dans le but de tuer les Villageois plus puissants en premier, avec l’aide des autres Créatures Maléfiques.</p>
      <p><strong>Si n’importe quel Loup-garou est empoisonné :</strong><br>Ils ne peuvent pas tuer.</p>
      <p><strong>Objectif :</strong><br>Tuer tous les Villageois.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE x03 — Fantômes -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x03">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/x03_card.png" alt="Carte : Fantômes" width="130">
    <div><code>x03</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x03</code> · Fantômes <span class="role-badge">Extra</span></div>
    <div class="role-meta">Catégorie : Extras · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Il existe deux types de mort : <span class="rule-red">EXÉCUTION</span> (condamnés par le village) ou <span class="rule-red">ASSASSINAT</span> (tués par le pouvoir d&#x27;un personnage).</p>
      <p>Lorsqu&#x27;un joueur est tué pendant la nuit, il ne meurt réellement que le matin, au réveil, et peut donc continuer à utiliser ses pouvoirs pendant la nuit.</p>
      <p>Les joueurs morts se transforment en Fantômes, qui peuvent continuer à communiquer avec le village pendant la journée, mais ne peuvent ni parler ni voter au tribunal, et <span class="rule-red">perdent tous les pouvoirs qu&#x27;ils avaient</span> (sauf indication contraire dans la fiche de personnage).</p>
      <p><strong>Objectif :</strong><br>Les Fantômes gardent le même objectif que lorsqu&#x27;ils étaient vivants.</p>
      <p><span class="rule-red">Les fantômes DORMENT ÉGALEMENT LA NUIT</span>.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE x.v09 — Soldat -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x.v09">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/xv09_card.png" alt="Carte : Soldat" width="130">
    <div><code>x.v09</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x.v09</code> · Soldat <span class="role-badge">Extra</span></div>
    <div class="role-meta">Catégorie : Extras · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Créé par le Capitaine.</p>
      <p><span class="rule-red">Une fois mort</span>, il sera réveillé la prochaine nuit et choisira <span class="rule-red">un</span> joueur qui sera assassiné.</p>
      <p><strong>Si empoisonné :</strong><br>Sans effet.</p>
      <p><strong>Objectif :</strong><br>Ne change pas.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE x.s01 — Amoureux -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x.s01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/xs01_card.png" alt="Carte : Amoureux" width="130">
    <div><code>x.s01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x.s01</code> · Amoureux <span class="role-badge">Extra</span></div>
    <div class="role-meta">Catégorie : Extras · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Les Amoureux se connaissent.</p>
      <p>Si l’un meurt, l’autre se suicide.</p>
      <p>Si la victime de l’assassinat est immune ou sauvée, aucun des deux ne meurt.</p>
      <p>Si le suicidaire est immune ou sauvé, seul lui survivra.</p>
      <p><strong>Objectif :</strong><br>Que les Amoureux soient les derniers survivants.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE x.as01b.1 — Traître -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x.as01b.1">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/x.as01b.1_card.png" alt="Carte : Traître" width="130">
    <div><code>x.as01b.1</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x.as01b.1</code> · Traître <span class="role-badge">Extra</span></div>
    <div class="role-meta">Catégorie : Extras · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Connaît l’Arnacoeur.</p>
      <p>Si l’un meurt, l’autre se suicide.</p>
      <p>Si la victime de l’assassinat est immune ou sauvée, aucun des deux ne meurt.</p>
      <p>Si le suicidaire est immune ou sauvé, seul lui survivra.</p>
      <p><strong>Objectif :</strong><br>Que l’Arnacoeur et le Traître soient les derniers survivants..</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE x.as01b.2 — Trahi -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x.as01b.2">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/x.as01b.2_card.png" alt="Carte : Trahi" width="130">
    <div><code>x.as01b.2</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x.as01b.2</code> · Trahi <span class="role-badge">Extra</span></div>
    <div class="role-meta">Catégorie : Extras · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Ne sait pas qu’il est Trahi, continue d’agir comme un Amoureux tant qu’il ne le découvre pas.</p>
      <p>Si le Traître ou l’Arnacoeur meurt, le Trahi ne meurt pas.</p>
      <p><strong>Objectif :</strong><br>Celui du rôle original.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONNAGE x.m05 — Ennemi -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x.m05">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/xm05_card.png" alt="Carte : Ennemi" width="130">
    <div><code>x.m05</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x.m05</code> · Ennemi <span class="role-badge">Extra</span></div>
    <div class="role-meta">Catégorie : Extras · <a href="#liste-rapide-de-personnages">retour à la liste rapide</a></div>
    <div class="role-description">
      <p>Si un Ennemis arrive à amener l’autre à <span class="rule-red">exécution</span>, le premier reçoit immunité contre le prochain <span class="rule-red">assassinat</span>.</p>
      <p><span class="rule-red">Après la mort de chaque Ennemie</span>, le Méchant Cupidon est réveillé pour choisir un nouvel Ennemi pour le survivant.</p>
      <p><strong>Objectif :</strong><br>Ne change pas.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="la-nuit"></a>

## La Nuit
<a id="premiere-nuit"></a>

### Première Nuit
> [!NOTE]
> Cette nuit n’aura pas de morts.
> Lancer un d12.

- Cupidon se réveille et choisit deux joueurs qui seront Amoureux.  Cupidon s’endort et les Amoureux seront maintenant touchés pour qu’ils se connaissent. Si un Amoureux meurt, l’autre se suicide. L’objectif des Amoureux et de Cupidon est que les Amoureux soient les derniers survivants. Tant que les Amoureux sont en vie, le jeu continue.
- Le Méchant Cupidon se réveille et choisit deux joueurs qui seront Ennemis.  Le Méchant Cupidon s’endort et les Ennemis seront maintenant touchés pour qu’ils se connaissent. Si un Ennemi parvient à amener l’autre à exécution, le premier reçoit immunité contre le prochain assassinat.
- Les Sœurs se réveillent pour se connaître.
- Les Frères se réveillent pour se connaître.
- Le Comédien se réveille et choisit une Idole dont il copiera le pouvoir lorsque l’Idole mourra. Son nouveau rôle ne lui sera révélé que la nuit suivant la mort de l’Idole.
- Le Maître de l’Araignée se réveille et choisit un joueur sur lequel il tisse une toile d’araignée. Chaque nuit, le Maître de l’Araignée apprend quels personnages ont désigné ce joueur durant cette nuit.
- Le Maître du Corbeau se réveille et apprend le nombre de Créatures Maléfiques en jeu.
- Le Maître du Renard se réveille et indique trois joueurs voisins. Il lui sera révélé, par le pouce, si oui ou non un des joueurs est une Créature Maléfique.
- L’Ours grogne / ne grogne pas.
- L’Ancien du Village se réveille et choisit un joueur qui aura automatiquement deux votes contre lui au prochain Tribunal.
- En fin de nuit, le village entend l’hurlement d’un loup. Les villageois savent que les Loups-garous sont en ville, et se réveillent méfiants.

<a id="debut-de-la-deuxieme-nuit"></a>

### Début de la Deuxième Nuit
- Le Voleur se réveille et choisit du pouce s’il veut être du côté du village ou des loups-garous.
- L‘Espion se réveille et choisit du pouce s’il veut être du côté du village ou des loups-garous.
- Le Chien-loup se réveille et choisit du pousse s’il veut devenir Chien ou un Loup-garou.  S’il choisit être Chien, il choisit ensuite un maître qui sera touché et se réveillera pour le connaître. Son rôle est révélé au Chien. Dès lors, le Chien se réveille avec son maître et agit sur ses pouvoirs indépendamment.  S’il choisit être Loup-garou, il peut simplement se rendormir.
- L’Enfant Sauvage se réveille et choisit son Père Adoptif. Si celui-ci meurt pendant le jeu, l’Enfant Sauvage devient un Loup-garou.
- Les Loups-garous se réveillent et les Créatures Maléfiques leur sont présentées.

<a id="nuit-normale"></a>

### Nuit Normale
> [!NOTE]
> Lancer un d12.
> Ressusciter le joueur sauvé par l’Ange.

> SOUVIENS-TOI (Si le Chevalier Rouillé est mort le jour, tuer le Loup-garou le plus proche lors de la prochaine journée)

- (Si le joueur pris dans la toile est mort) Le Maître de l’Araignée se réveille et choisit un nouveau joueur sur lequel il tisse sa toile.
- (Si le Petit Chaperon Rouge a été exécuté) Le Chasseur se réveille et indique qui il veut assassiner.
- (Si le Chasseur est mort) Le Fantôme du Chasseur se réveille et indique qui il veut assassiner.
- (Si le SOLDAT est mort) Le Fantôme du Soldat se réveille et indique qui il veut assassiner.
- Le Comédien se réveille.  Si son Idol est mort, le rôle lui est révélé et il répondra à celui-ci dès lors.  Sinon il peut indiquer un joueur s’il souhaite changer d’Idol.
- (Si un Ennemi meurt) Le Méchant Cupidon se réveille et choisit un nouvel ennemi.  Le Méchant Cupidon s’endort et les Ennemis seront maintenant touchés pour qu’ils se connaissent. Si un Ennemi arrive à amener l’autre à exécution, le premier reçoit immunité contre le prochain assassinat.
- Le Somnambule se réveille et indique quel joueur il visitera cette nuit. Un fois le choix fait, il s’endort chez le dernier.  Cette peresonne sera touché et saura que même si appelée, elle ne se réveilera pas.
- La Méchante Sorcière se réveille et indique quel joueur elle souhaite empoisonner.
- La Domestique se réveille et la distance de la personne empoisonnée lui est révélée.
- La Gitane se réveille et indique trois joueurs voisins. Si l’un d’eux est empoisonné, il perd son poison et la Gitane devient empoisonnée.
- L&#x27;Illusionniste se réveille et indique un joueur dont l’identité sera offusquée.
- (Si quelqu’un est mort) La Voyante se réveille et les rôles des morts d’hier lui sont révélés. (Effacer « Morts de hier »)
- L’Espion se réveille et un rôle en jeu lui est révélé.
- Le Maître du Corbeau se réveille et apprend le nombre de Créatures Maléfiques en jeu. (ou si le Corbeau est confus)
- Le Maître du Renard se réveille et indique trois joueurs voisins. Il lui sera révélé, par le pouce, si oui ou non un des joueurs est une Créature Maléfique. (ou si le Renard est confus)
- L’Ours grogne / ne grogne pas. (/ est confus)
- L’Ancien du Village se réveille et choisit un joueur qui aura automatiquement deux votes contre lui au prochain Tribunal.
- Le Voleur se réveille et indique à qui il souhaite voler le vote au prochain Tribunal.
- Le Capitaine se réveille et indique le joueur qui sera un SOLDAT pendant un jour et une nuit.
- Cupidon se réveille et indique s’il veut utiliser une de ses deux flèches de protection pour donner immunité aux Amoureux.
- L’Arnaœur se réveille et indique un joueur. Il apprend s’il s’agit d’un des Amoureux. Si c’est le cas, cet Amoureux sera touché pour découvrir son nouvel amant, qui remplacera l’autre Amoureux.
- Le Sauveur se réveille et choisit qui sera immune durant une nuit et un jour.
- Le Pyromane se réveille / ne se réveille pas. Les personnes innocentées au dernier Tribunal lui sont montrées. Il décide, en pointant ou par un pousse vers le bas, s’il veut brûler la maison d’un d’entre eux.
- L’Enfant se réveille (toutes les nuits). S’il a accusé quelqu’un au dernier Tribunal, il apprend s’il s’aggissait d’un Loup-garou. Je rappelle que l’Enfant ne peut pas accuser une même personne au Tribunal deux fois.
- Les Loups-garous se réveillent / ne se réveillent pas si empoisonnés. Ils choisissent ensemble leurs victime pour cette nuit.
- Le Méchant Loup-garou se réveille et indique di pouce s’il veut ou on se déguiser en Grand-maman aujourd’hui. Il ne peut utiliser ce pouvoir que deux fois par jeu.
- Le Loup-garou Voyant se réveillent / ne se réveillent pas si empoisonnés. Il indique du pouce s’il veut sauver la victime pour savoir son rôle ou la laisser mourir.
- Le Loup-garou Vampire se réveillent / ne se réveillent pas si empoisonnés ou victime sauvé par Loup-garou Voyant. Il indique du pouce s’il veut sauver la victime ou non.  Si oui, la victime sera touchée, ne se réveillera pas, et passera à se réveiller avec les Loups-garous. La victime indique du pouce si elle souhaite ou non garder ses pouvoirs.
- (Chaque troisième nuit) Le Loup-garou Blanc se réveille et chosit un Loup-garou qu’il souhaite tuer. Le Loup-garou Blanc se réveille et chosit un autre joueur qu’il souhaite tuer.
- Le Maître des Lapins entend les lapins effrayés cette nuit / [rien] (/ les Lapins sont confus)
- Le Chaman se réveille  (/ ne se réveille pas s’il n’y a pas de victimes) et les victimes de cette nuit lui sont révélées. Il choisit s’il souhaite sauver une des victimes. Il ne peut utiliser ce pouvoir que deux fois par jeu.
- Le Falotier se réveille et apprend d’une carte en jeu avec un pouvoir limité et découvre combien d’utilisations restent encore au pouvoir.
- Le Mime se réveille et voit la carte d’un rôle en jeu. Il agit silencieusement selon le pouvoir de la carte ou reçoit les informations.
- (Si le Chevalier Rouillé est mort cette nuit, tuer le Loup-garou le plus proche.)
- Le Pilleur de Tombes se réveille (/ ne se réveille pas s’il n’y a pas de victimes) et les victimes lui sont présentées. Il décide, en pointant ou par le pouce vers le bas, s’il veut prendre la place d’une d’entre elles.  S’il chosit une d’elles, le Pilleur de Tombes change de rôle avec le Fantôme de la victime.
- La Petite Fille se réveille (/ ne se réveille pas s’il n’y a pas de victime) et découvre comment les victimes de cette nuit sont mortes.
- Le Prophète se réveille (/ ne se réveille pas s’il n’y a pas de victimes) et les victimes lui sont présentées. Il indique en pointant un joueur qu’il croit avoir été tué cette nuit. S’il est correct, le joueur sera touché pour savoir qu’il pourra, même en tant que Fantôme, utiliser son pouvoir pendant encore un jour et une nuit.
- Le Maître de l’Araignée se réveille (/ ne se réveille pas si nécessaire). Les rôles de tous les joueurs qui ont été pris dans la toile cette nuit lui sont alors révélés.

---
<a id="code-pour-le-script-interactif"></a>

## Code pour le script interactif
- <https://wotct.lovable.app>

---