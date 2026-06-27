# Lobisomens da Torre Sangrenta

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
- Cada personagem começa com um separador “PERSONAGEM”.
- Para texto vermelho, usar apenas: <span class="rule-red">texto</span>
- Manter espaços, pontuação e símbolos de escolha (👍/👎) fora da etiqueta vermelha.
-->



## Sumário

- [Base](#base)
  - [Contexto](#contexto)
  - [Decorrer do dia](#decorrer-do-dia)
  - [Tribunal](#tribunal)
  - [Noite](#noite)
  - [Fantasmas](#fantasmas)
  - [Objetivos de vitória](#objetivos-de-vitoria)
- [Lista rápida de personagens](#lista-rapida-de-personagens)
- [Personagens](#personagens)
  - [Essenciais](#essenciais)
  - [Aldeões](#aldeoes)
  - [Personagens malvados](#personagens-malvados)
  - [Personagens independentes](#personagens-independentes)
  - [Personagens flexíveis](#personagens-flexiveis)
  - [Personagens complexos](#personagens-complexos)
  - [Personagens forretas (para quando há muita gente)](#personagens-forretas-para-quando-ha-muita-gente)
  - [Extras](#extras)
- [A Noite](#a-noite)
  - [Primeira Noite](#primeira-noite)
  - [Início da Segunda Noite](#inicio-da-segunda-noite)
  - [Noite Normal](#noite-normal)
- [Código para o guião interativo](#codigo-para-o-guiao-interativo)

---
<a id="base"></a>

## Base
<a id="contexto"></a>

### Contexto
A aldeia tem um problema com Criaturas Malvadas: os Lobisomens e os seus Aliados! Os Lobisomens matando todas as noites, os Aldeões têm que executar essas Criaturas Malvadas. Mas como é que os Aldeões vão escolher quem executar?
<a id="decorrer-do-dia"></a>

### Decorrer do dia
Durante o dia (5 minutos), os jogadores andam livremente pelos diferentes lugares na aldeia (a sala ou o edifício), mas como estão todos a suspeitar uns dos outros, podem dizer qualquer coisa (incluindo revelar ou mentir sobre o seu papel e o que sabe sobre os outros), o objetivo é convencer os outros, criar alianças, planejar assassinatos, etc. No fim do dia (3 minutos) toda a aldeia se encontra no tribunal (centro da sala) para decidir quem irão executar. É importante que todos os jogadores guardem sempre os mesmos lugares!
<a id="tribunal"></a>

### Tribunal
No tribunal, nenhuma informação específica pode ser divulgada por um jogador que não esteja num processo (podem simplesmente dizer se estão a suspeitar de alguém, não o porquê). Um jogador pode nomear um outro para um interrogatório.

1. O jogador que nomeia se posiciona no lugar de Prosecutor, o nomeado se posiciona no lugar do Acusado.
2. O Prosecutor pode então explicar a sua acusação.
3. Em seguida, o Acusado pode se defender.
4. Finalmente, a aldeia pode questionar o Acusado.
5. Uma vez o questionário terminado, a aldeia vota se querem executar o acusado.
6. No mínimo metade da aldeia tem que votar SIM para o acusado ser executado.

> [!IMPORTANT]
> PODE HAVER VÁRIAS NOMEAÇÕES POR DIA.
<a id="noite"></a>

### Noite
Após o tribunal, toda a aldeia vai dormir (fechar os olhos no tribunal). É importante que os jogadores guardem sempre os mesmos lugares! Durante a noite, o Narrador guia toda a aldeia a cumprir as suas funções de personagem.
<a id="fantasmas"></a>

### Fantasmas
Há dois tipos de morte: EXECUÇÃO (condenados pela aldeia) ou ASSASSINATO (mortos pelo poder de um personagem).

Quando um jogador é morto durante a noite, só morre mesmo de manhã, ao acordar, assim durante aquela noite podem continuar a usar os seus poderes.

Os jogadores mortos transformam-se em fantasmas, que podem continuar a comunicar com a aldeia durante o dia, mas não podem falar ou votar no tribunal, e perdem qualquer poder que tinham (a não ser que esteja escrito o contrário na ficha de personagem.) Fantasmas guardam o mesmo objetivo que enquanto vivos. Os Fantasmas TAMBÉM DORMEM À NOITE.
<a id="objetivos-de-vitoria"></a>

### Objetivos de vitória
- **Aldeões:** Matar todos os Lobisomens
- **Criaturas Malvadas:** Matar todos os Aldeões
- **Namorados e Cupido:** Os Namorados serem os únicos sobreviventes
- **Amante Secreto:** Ser o único sobrevivente com um dos Namorados
- **Lobisomem branco:** Ser o único sobrevivente

---

<a id="quick-list"></a>
<a id="lista-rapida-de-personagens"></a>

## Lista rápida de personagens
Usa esta lista como mapa de navegação para saltar diretamente para uma ficha na tabela.

### Essenciais

| Código | Personagem | Ficha |
|---|---|---|
| `e01` | Lobisomem | [ver ficha](#e01) |
| `e02` | Bruxa Malvada | [ver ficha](#e02) |
| `e03` | Chaman | [ver ficha](#e03) |
| `e04` | Vidente | [ver ficha](#e04) |

### Aldeões

| Código | Personagem | Ficha |
|---|---|---|
| `v01` | Menina | [ver ficha](#v01) |
| `v02` | Domador do Urso | [ver ficha](#v02) |
| `v03` | Domador do Corvo | [ver ficha](#v03) |
| `v04` | Domador da Raposa | [ver ficha](#v04) |
| `v05` | Domador dos Coelhos | [ver ficha](#v05) |
| `v06` | Marionetista | [ver ficha](#v06) |
| `v07` | Cavaleiro Enferrujado | [ver ficha](#v07) |
| `v08` | Caçador | [ver ficha](#v08) |
| `v08b` | Capuchinho Vermelho | [ver ficha](#v08b) |
| `v09` | Capitão | [ver ficha](#v09) |
| `v10` | Paranoico | [ver ficha](#v10) |
| `v11` | Chefe da Aldeia | [ver ficha](#v11) |
| `v12` | Cigana | [ver ficha](#v12) |
| `v13` | Juiz | [ver ficha](#v13) |
| `v14` | Acusador | [ver ficha](#v14) |
| `v15` | Piromaníaco | [ver ficha](#v15) |
| `v16` | Sonâmbulo | [ver ficha](#v16) |
| `v17` | Salvador | [ver ficha](#v17) |
| `v18` | Anjo | [ver ficha](#v18) |
| `v19` | Profeta | [ver ficha](#v19) |
| `v20` | Empregada | [ver ficha](#v20) |
| `v21` | Faroleiro | [ver ficha](#v21) |
| `v22` | Pedro | [ver ficha](#v22) |
| `v23` | Domador da Aranha | [ver ficha](#v23) |

### Personagens malvados

| Código | Personagem | Ficha |
|---|---|---|
| `m01` | Lobisomem Mau | [ver ficha](#m01) |
| `m02` | Lobisomem Vidente | [ver ficha](#m02) |
| `m03` | Lobisomem Vampiro | [ver ficha](#m03) |
| `m04` | Ankou | [ver ficha](#m04) |
| `m05` | Cupido Malvado | [ver ficha](#m05) |

### Personagens independentes

| Código | Personagem | Ficha |
|---|---|---|
| `s01` | Cupido | [ver ficha](#s01) |
| `s02` | Lobisomem Branco | [ver ficha](#s02) |

### Personagens flexíveis

| Código | Personagem | Ficha |
|---|---|---|
| `f01` | Ladrão | [ver ficha](#f01) |
| `f02` | Espião | [ver ficha](#f02) |

### Personagens complexos

| Código | Personagem | Ficha |
|---|---|---|
| `a01` | Bêbado | [ver ficha](#a01) |
| `a02` | Cão-Lobo | [ver ficha](#a02) |
| `a03` | Mimo | [ver ficha](#a03) |
| `a04` | Ator | [ver ficha](#a04) |
| `a05` | Rouba-Túmulos | [ver ficha](#a05) |
| `a06` | Ilusionista | [ver ficha](#a06) |
| `as01b` | Amante Secreto | [ver ficha](#as01b) |

### Personagens forretas (para quando há muita gente)

| Código | Personagem | Ficha |
|---|---|---|
| `l01` | Aldeão Triste | [ver ficha](#l01) |
| `l02` | Criança Selvagem | [ver ficha](#l02) |
| `l03` | Irmãs | [ver ficha](#l03) |
| `l04` | Irmãos | [ver ficha](#l04) |

### Extras

| Código | Personagem | Ficha |
|---|---|---|
| `x01` | Aldeões | [ver ficha](#x01) |
| `x02` | Criaturas Malvadas | [ver ficha](#x02) |
| `x02.1` | Lobisomens | [ver ficha](#x02.1) |
| `x03` | Fantasma | [ver ficha](#x03) |
| `x.v09` | Soldado | [ver ficha](#x.v09) |
| `x.s01` | Namorado | [ver ficha](#x.s01) |
| `x.as01b.1` | Traidor | [ver ficha](#x.as01b.1) |
| `x.as01b.2` | Traído | [ver ficha](#x.as01b.2) |
| `x.m05` | Inimigo | [ver ficha](#x.m05) |

---
<a id="personagens"></a>

## Personagens

<a id="essenciais"></a>

### Essenciais

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carta</th>
<th>Descrição</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONAGEM e01 — Lobisomem -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="e01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/e01_final.png" alt="Carta: Lobisomem" width="130">
    <div><code>e01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>e01</code> · Lobisomem <span class="role-badge">Criaturas Malvadas</span></div>
    <div class="role-meta">Categoria: Essenciais · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Cada noite</span>, escolhe com os outros Lobisomens quem vão assassinar.</p>
      <p><strong>Se qualquer Lobisomem estiver envenenado:</strong><br>Não podem matar.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Aldeões.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM e02 — Bruxa Malvada -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="e02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/e02_final.png" alt="Carta: Bruxa Malvada" width="130">
    <div><code>e02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>e02</code> · Bruxa Malvada <span class="role-badge">Criaturas Malvadas</span></div>
    <div class="role-meta">Categoria: Essenciais · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">NÃO</span> ACORDA COM OS LOBISOMENS.</p>
      <p><span class="rule-red">Cada noite</span>, a Bruxa pode envenenar um jogador.</p>
      <p>O jogador afetado terá problemas ao usar os seus poderes (receberá informações erradas).</p>
      <p><strong>Se envenenada:</strong><br>É imune a todos os ataques.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Aldeões.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM e03 — Chaman -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="e03">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/e03_final.png" alt="Carta: Chaman" width="130">
    <div><code>e03</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>e03</code> · Chaman <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Essenciais · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Cada noite</span> é avisado sobre os jogadores <span class="rule-red">assassinados</span> e pode escolher salvá-los.</p>
      <p>O Chaman pode salvar (👍) <span class="rule-red">dois</span> jogadores <span class="rule-red">durante todo o jogo</span>.</p>
      <p><strong>Se envenenado:</strong><br>Não salva o jogador.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM e04 — Vidente -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="e04">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/e04_final.png" alt="Carta: Vidente" width="130">
    <div><code>e04</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>e04</code> · Vidente <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Essenciais · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Cada vez que um jogador é morto</span>, a Vidente descobre qual era o seu poder <span class="rule-red">(será informada na próxima noite)</span>.</p>
      <p><strong>Se envenenada:</strong><br>Não receberá a informação correta.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="aldeoes"></a>

### Aldeões

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carta</th>
<th>Descrição</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONAGEM v01 — Menina -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v01_final.png" alt="Carta: Menina" width="130">
    <div><code>v01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v01</code> · Menina <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Cada noite</span> é avisada sobre os jogadores <span class="rule-red">assassinados</span> e vê como eles morreram.</p>
      <p>O Narrador mostrará o papel cujo o poder assassinou a vítima.</p>
      <p>Se for um Namorado que se suicidou, é-lhe mostrado o papel do Cupido.</p>
      <p>Se o assassino era um Soldado, é-lhe mostrado o papel do Capitão.</p>
      <p><strong>Se envenenado:</strong><br>Receberá a informação errada.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v02 — Domador do Urso -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v02_final.png" alt="Carta: Domador do Urso" width="130">
    <div><code>v02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v02</code> · Domador do Urso <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">A cada noite</span>, se um dos seus vizinhos for uma Criatura Malvada, o Urso rosna.</p>
      <p><strong>Se envenenado:</strong><br>Receberá a informação errada.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v03 — Domador do Corvo -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v03">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v03_final.png" alt="Carta: Domador do Corvo" width="130">
    <div><code>v03</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v03</code> · Domador do Corvo <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">A cada noite</span>, é-lhe revelado silenciosamente quantas Criaturas Malvadas vivas estão em jogo.</p>
      <p><strong>Se envenenado:</strong><br>Receberá a informação errada.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v04 — Domador da Raposa -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v04">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v04_final.png" alt="Carta: Domador da Raposa" width="130">
    <div><code>v04</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v04</code> · Domador da Raposa <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">A cada noite</span>, escolhe um jogador e o Narrador revela-lhe se entre ele e os 2 vizinhos há uma Criatura Malvada (👍) ou não (👎).</p>
      <p><span class="rule-red">A partir da segunda noite</span>, se os três forem Aldeões, a Raposa foge e o Domador da Raposa perde o seu poder.</p>
      <p><strong>Se envenenado:</strong><br>Receberá a informação errada.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v05 — Domador dos Coelhos -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v05">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v05_final.png" alt="Carta: Domador dos Coelhos" width="130">
    <div><code>v05</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v05</code> · Domador dos Coelhos <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">A cada noite</span>, se um dos vizinhos ou ele próprio foi atacado pelos Lobisomens ou envenenado pela Bruxa, os coelhos assustam-se.</p>
      <p><strong>Se envenenado:</strong><br>Receberá a informação errada.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v06 — Marionetista -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v06">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v06_final.png" alt="Carta: Marionetista" width="130">
    <div><code>v06</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v06</code> · Marionetista <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Faz de conta que é um Lobisomem.</p>
      <p><span class="rule-red">Acorda ao mesmo tempo que os Lobisomens</span> e vota com eles.</p>
      <p><strong>Se envenenado:</strong><br>Não acorda; será tocado pelo Narrador uma vez que a Bruxa Malvada adormeça.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v07 — Cavaleiro Enferrujado -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v07">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v07_final.png" alt="Carta: Cavaleiro Enferrujado" width="130">
    <div><code>v07</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v07</code> · Cavaleiro Enferrujado <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Quando morre</span>, o Lobisomem mais próximo morrerá <span class="rule-red">durante o próximo dia</span>. A morte será anunciada no início do Tribunal.</p>
      <p><strong>Se envenenado quando morto:</strong><br>Assassina o jogador errado.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v08 — Caçador -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v08">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v08_final.png" alt="Carta: Caçador" width="130">
    <div><code>v08</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v08</code> · Caçador <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Uma vez morto</span>, será acordado na próxima noite para escolher <span class="rule-red">um</span> jogador que deverá assassinar.</p>
      <p><span class="rule-red">Se o Capuchinho Vermelho foi executado</span>, será acordado na próxima noite para escolher <span class="rule-red">um</span> jogador que deverá ser assassinado (Poderá na mesma usar o seu poder quando morrer).</p>
      <p><strong>Se envenenado no momento da morte:</strong><br>Assassina o jogador errado.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v08b — Capuchinho Vermelho -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v08b">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v08b_final.png" alt="Carta: Capuchinho Vermelho" width="130">
    <div><code>v08b</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v08b</code> · Capuchinho Vermelho <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>É imune aos <span class="rule-red">assassinatos dos Lobisomens</span> enquanto o <span class="rule-red">Caçador estiver vivo</span>.</p>
      <p>Se for <span class="rule-red">executada enquanto o Caçador estiver vivo</span>, o Caçador pode matar alguém na próxima noite.</p>
      <p><strong>Se envenenado:</strong><br>Perde a imunidade essa noite.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v09 — Capitão -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v09">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v09_final.png" alt="Carta: Capitão" width="130">
    <div><code>v09</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v09</code> · Capitão <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Cada noite</span>, escolhe um jogador que será um Soldado durante essa noite e dia. O Soldado será tocado pelo Narrador.</p>
      <p>Se o Soldado morrer, poderá matar alguém na noite seguinte.</p>
      <p><strong>Se envenenado:</strong><br>O poder afeta o jogador errado.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v10 — Paranoico -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v10">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v10_final.png" alt="Carta: Paranoico" width="130">
    <div><code>v10</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v10</code> · Paranoico <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Duas vezes</span> no jogo, <span class="rule-red">durante o dia</span>, pode dizer <span class="rule-red">discretamente</span> ao Narrador para <span class="rule-red">assassinar</span> uma pessoa cuja morte será anunciada no início do Tribunal.</p>
      <p><strong>Se envenenado:</strong><br>Assassina o jogador errado.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v11 — Chefe da Aldeia -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v11">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v11_final.png" alt="Carta: Chefe da Aldeia" width="130">
    <div><code>v11</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v11</code> · Chefe da Aldeia <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">A cada noite</span>, escolhe um jogador que terá automaticamente 2 votos a mais contra ele se for a Tribunal nesse dia.</p>
      <p><strong>Se envenenado:</strong><br>Os votos do jogador escolhido contam a dobrar.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v12 — Cigana -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v12">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v12_final.png" alt="Carta: Cigana" width="130">
    <div><code>v12</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v12</code> · Cigana <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">A cada noite</span>, escolhe um jogador e o Narrador revela-lhe se entre ele e os 2 vizinhos há um jogador envenenado.</p>
      <p>Se for o caso, ela será avisada (👍/👎), esse jogador perde o veneno e a Cigana fica envenenada.</p>
      <p><strong>Se envenenado :</strong><br>O voto dela conta a dobrar.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v13 — Juiz -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v13">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v13_final.png" alt="Carta: Juiz" width="130">
    <div><code>v13</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v13</code> · Juiz <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Duas vezes durante todo o jogo</span>, pode-se revelar e anular uma execução durante o Tribunal.</p>
      <p>Só pode usar este poder uma vez por dia.</p>
      <p><span class="rule-red">Se assassinado</span>, o Fantasma <span class="rule-red">pode continuar a votar</span> e o seu voto conta o dobro.</p>
      <p><strong>Se envenenado:</strong><br>A anulação não tem efeito.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v14 — Acusador -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v14">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v14_final.png" alt="Carta: Acusador" width="130">
    <div><code>v14</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v14</code> · Acusador <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Duas vezes durante todo o jogo</span>, pode-se revelar e forçar uma execução durante o Tribunal.</p>
      <p>Só pode usar o poder uma vez por dia.</p>
      <p><strong>Se envenenado:</strong><br>A execução não tem efeito.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v15 — Piromaníaco -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v15">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v15_final.png" alt="Carta: Piromaníaco" width="130">
    <div><code>v15</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v15</code> · Piromaníaco <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Quando um jogador é chamado ao tribunal, mas <span class="rule-red">não é executado</span>, o Piromaníaco <span class="rule-red">pode escolher</span> na <span class="rule-red">noite seguinte</span> incendiar a casa desse jogador (👍/👎).</p>
      <p>Esse jogador morre se for um Lobisomem, senão, perde os seus poderes permanentemente.</p>
      <p><strong>Se envenenado :</strong><br>Incendiará a casa errada.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v16 — Sonâmbulo -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v16">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v16_final.png" alt="Carta: Sonâmbulo" width="130">
    <div><code>v16</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v16</code> · Sonâmbulo <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Cada início de noite</span> escolhe um jogador para visitar.</p>
      <p>Esse jogador será tocado e não será chamado essa noite.</p>
      <p>Se esse jogador for chamado na mesma (por ex. Lobisomens), não acorda.</p>
      <p><strong>Se envenenado na noite passada:</strong><br>Vai dormir na casa do jogador errado.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v17 — Salvador -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v17">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v17_final.png" alt="Carta: Salvador" width="130">
    <div><code>v17</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v17</code> · Salvador <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Cada noite</span>, escolhe um jogador que será imune <span class="rule-red">durante essa noite e esse dia</span>.</p>
      <p>Também se pode escolher a si próprio.</p>
      <p><strong>Se envenenado:</strong><br>Dá imunidade ao jogador errado.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v18 — Anjo -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v18">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v18_final.png" alt="Carta: Anjo" width="130">
    <div><code>v18</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v18</code> · Anjo <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Pode ressuscitar <span class="rule-red">dois</span> Fantasmas <span class="rule-red">durante todo o jogo</span>.</p>
      <p>Se o Fantasma tinha um poder com usos limitados, recupera todos os usos quando ressuscitado.</p>
      <p>(Pode pedir discretamente a qualquer momento ao Narrador; o jogador ressuscitará na próxima noite)</p>
      <p><strong>Se envenenado:</strong><br>Ressuscita o jogador errado.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v19 — Profeta -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v19">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v19_final.png" alt="Carta: Profeta" width="130">
    <div><code>v19</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v19</code> · Profeta <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Cada fim de noite</span>, o Profeta aponta para um jogador que acha que morreu durante essa noite.</p>
      <p>Se a profecia estiver certa (👍), esse jogador será tocado e guardará os seus poderes enquanto Fantasma durante o próximo dia e noite.</p>
      <p>Se era um personagem com um poder com usos limitados, pode usar o poder de qualquer maneira.</p>
      <p><strong>Se envenenado:</strong><br>A profecia está errada de qualquer maneira.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v20 — Empregada -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v20">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v20_final.png" alt="Carta: Empregada" width="130">
    <div><code>v20</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v20</code> · Empregada <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Cada noite</span>, é-lhe revelada a distância até a pessoa envenenada</p>
      <p>(Ex.: 3 = a terceira pessoa à esquerda ou à direita).</p>
      <p><strong>Se envenenado:</strong><br>Receberá a informação errada.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v21 — Faroleiro -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v21">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v21_final.png" alt="Carta: Faroleiro" width="130">
    <div><code>v21</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v21</code> · Faroleiro <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Cada noite</span>, é-lhe mostrado um personagem em jogo com um poder com usos limitados e é informado de quantos usos esse personagem ainda tem.</p>
      <p><strong>Se envenenado:</strong><br>Receberá a informação errada.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v22 — Pedro -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v22">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v22_final.png" alt="Carta: Pedro" width="130">
    <div><code>v22</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v22</code> · Pedro <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Cada vez que leva um jogador a Tribunal, é-lhe revelado na <span class="rule-red">noite seguinte</span> se esse jogador era um Lobisomem ou não.</p>
      <p><span class="rule-red">Nunca pode levar o mesmo jogador a Tribunal duas vezes</span>.</p>
      <p><strong>Se envenenado:</strong><br>Receberá a informação errada.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM v23 — Domador da Aranha -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="v23">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/v23_final.png" alt="Carta: Domador da Aranha" width="130">
    <div><code>v23</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>v23</code> · Domador da Aranha <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Aldeões · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Na primeira noite</span>, escolhe um jogador no qual tece uma teia de aranha.</p>
      <p><span class="rule-red">Cada noite depois da primeira</span>, o Domador da Aranha será mostrado as cartas que durante a noite apontaram o jogador com a teia.</p>
      <p><span class="rule-red">Na noite seguinte à morte do jogador com a teia de aranha</span>, o Domador da Aranha é acordado para escolher um novo.</p>
      <p><span class="rule-red">Uma vez</span> no jogo, <span class="rule-red">durante o dia</span>, pode dizer <span class="rule-red">discretamente</span> ao Narrador para mudar o jogador com a teia antes da morte dele.</p>
      <p><strong>Se envenenado:</strong><br>Receberá a informação errada.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="personagens-malvados"></a>

### Personagens malvados

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carta</th>
<th>Descrição</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONAGEM m01 — Lobisomem Mau -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="m01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/m01_final.png" alt="Carta: Lobisomem Mau" width="130">
    <div><code>m01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>m01</code> · Lobisomem Mau <span class="role-badge">Criaturas Malvadas</span></div>
    <div class="role-meta">Categoria: Personagens malvados · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Duas vezes</span> por jogo, escolhe se quer se mascarar de Avózinha (👍/👎), dando-lhe imunidade durante um dia e uma noite.</p>
      <p><span class="rule-red">Mesmo imune</span>, pode ser <span class="rule-red">executado</span> se quem o levar a tribunal for o Capuchinho Vermelho. E nesse caso, se o Caçador votar, o Lobisomem Mau é automaticamente executado.</p>
      <p><strong>Se qualquer Lobisomem estiver envenenado:</strong><br>Não podem matar.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Aldeões.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM m02 — Lobisomem Vidente -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="m02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/m02_final.png" alt="Carta: Lobisomem Vidente" width="130">
    <div><code>m02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>m02</code> · Lobisomem Vidente <span class="role-badge">Criaturas Malvadas</span></div>
    <div class="role-meta">Categoria: Personagens malvados · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Após os Lobisomens terem escolhido a sua vítima, o Lobisomem Vidente pode <span class="rule-red">escolher</span> NÃO DEIXAR MATAR esse jogador, mas em vez disso, ver o seu papel.</p>
      <p><strong>Se qualquer Lobisomem estiver envenenado:</strong><br>Não podem matar.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Aldeões.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM m03 — Lobisomem Vampiro -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="m03">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/m03_final.png" alt="Carta: Lobisomem Vampiro" width="130">
    <div><code>m03</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>m03</code> · Lobisomem Vampiro <span class="role-badge">Criaturas Malvadas</span></div>
    <div class="role-meta">Categoria: Personagens malvados · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Uma só vez durante todo o jogo</span>, pode transformar a vítima dos Lobisomens em Lobisomem.</p>
      <p>A vítima será avisada e <span class="rule-red">guarda os seus poderes de Aldeão se quiser</span> (👍/👎) mas joga com o objetivo dos Lobisomens.</p>
      <p>Se a vítima tiver um poder com usos limitados, recupera todos os usos quando transformada.</p>
      <p><strong>Se qualquer Lobisomem estiver envenenado:</strong><br>Não podem matar.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Aldeões.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM m04 — Ankou -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="m04">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/m04_final.png" alt="Carta: Ankou" width="130">
    <div><code>m04</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>m04</code> · Ankou <span class="role-badge">Criaturas Malvadas</span></div>
    <div class="role-meta">Categoria: Personagens malvados · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">NÃO</span> ACORDA COM OS LOBISOMENS.</p>
      <p>Se morto por <span class="rule-red">execução</span>, o Fantasma pode continuar a votar e seu voto vale o dobro.</p>
      <p><strong>Se envenenado:</strong><br>Sem efeito.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Aldeões.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM m05 — Cupido Malvado -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="m05">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/m05_final.png" alt="Carta: Cupido Malvado" width="130">
    <div><code>m05</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>m05</code> · Cupido Malvado <span class="role-badge">Criaturas Malvadas</span></div>
    <div class="role-meta">Categoria: Personagens malvados · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">NÃO</span> ACORDA COM OS LOBISOMENS.</p>
      <p><strong><span class="rule-red">Na primeira noite</span> é chamado a escolher dois jogadores que serão Inimigos:</strong><br>Se um Inimigo conseguir condenar o outro a <span class="rule-red">execução</span>, o primeiro recebe imunidade contra a próxima tentativa de <span class="rule-red">assassinato</span>.</p>
      <p><span class="rule-red">A cada vez que um dos Inimigos morre</span>, o Cupido Malvado é acordado para escolher um novo Inimigo para o sobrevivente.</p>
      <p><strong>Se envenenado:</strong><br>Sem efeito.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Aldeões.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="personagens-independentes"></a>

### Personagens independentes

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carta</th>
<th>Descrição</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONAGEM s01 — Cupido -->
<!-- ============================================================ -->
<tr class="role-row faction-independent" id="s01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/s01_final.png" alt="Carta: Cupido" width="130">
    <div><code>s01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟪 <code>s01</code> · Cupido <span class="role-badge">Independente</span></div>
    <div class="role-meta">Categoria: Personagens independentes · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><strong><span class="rule-red">Na primeira noite</span> escolhe dois jogadores que serão Namorados:</strong><br>Se um Namorado morrer, o outro se suicida.</p>
      <p><span class="rule-red">O objetivo dos Namorados é de serem os últimos sobreviventes</span>.</p>
      <p><span class="rule-red">Duas vezes durante o jogo</span> pode escolher se quer dar imunidade aos Namorados durante aquela noite (👍).</p>
      <p><strong>Se envenenado:</strong><br>A proteção não funciona.</p>
      <p><strong>Objetivo:</strong><br>Os Namorados serem os únicos sobreviventes.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM s02 — Lobisomem Branco -->
<!-- ============================================================ -->
<tr class="role-row faction-independent" id="s02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/s02_final.png" alt="Carta: Lobisomem Branco" width="130">
    <div><code>s02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟪 <code>s02</code> · Lobisomem Branco <span class="role-badge">Independente</span></div>
    <div class="role-meta">Categoria: Personagens independentes · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Acorda e age como um Lobisomem, mas <span class="rule-red">a cada três noites tem</span> também de assassinar um Lobisomem.</p>
      <p><span class="rule-red">Se o Lobisomem Branco for o único Lobisomem vivo</span>, ele continua a ser chamado a cada três noites para assassinar um jogador a mais.</p>
      <p><strong>Se envenenado:</strong><br>Pode matar um Lobisomem a mais.</p>
      <p><strong>Objetivo:</strong><br>Ser o último sobrevivente.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="personagens-flexiveis"></a>

### Personagens flexíveis

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carta</th>
<th>Descrição</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONAGEM f01 — Ladrão -->
<!-- ============================================================ -->
<tr class="role-row faction-flex" id="f01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/f01_final.png" alt="Carta: Ladrão" width="130">
    <div><code>f01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟨 <code>f01</code> · Ladrão <span class="role-badge">Flexível</span></div>
    <div class="role-meta">Categoria: Personagens flexíveis · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Cada noite</span>, escolhe um jogador que não poderá votar no próximo tribunal.</p>
      <p><span class="rule-red">Na segunda noite</span> deverá <span class="rule-red">escolher</span> se quer jogar do lado dos Aldeões (👍) ou do lado dos Lobisomens (👎).</p>
      <p><span class="rule-red">NÃO</span> ACORDA COM OS LOBISOMENS.</p>
      <p><strong>Se envenenado:</strong><br>O voto não será retirado.</p>
      <p><strong>Objetivo:</strong><br>à escolha.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM f02 — Espião -->
<!-- ============================================================ -->
<tr class="role-row faction-flex" id="f02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/f02_final.png" alt="Carta: Espião" width="130">
    <div><code>f02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟨 <code>f02</code> · Espião <span class="role-badge">Flexível</span></div>
    <div class="role-meta">Categoria: Personagens flexíveis · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Cada noite</span>, é chamado e é-lhe mostrada uma carta de um jogador em jogo. Nunca verá a carta de um mesmo jogador duas vezes.</p>
      <p><span class="rule-red">Na segunda noite</span> deverá <span class="rule-red">escolher</span> se quer jogar do lado dos Aldeões (👍) ou do lado dos Lobisomens (👎).</p>
      <p><span class="rule-red">NÃO</span> ACORDA COM OS LOBISOMENS.</p>
      <p><strong>Se envenenado:</strong><br>Verá uma carta que não está em jogo.</p>
      <p><strong>Objetivo:</strong><br>à escolha.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="personagens-complexos"></a>

### Personagens complexos

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carta</th>
<th>Descrição</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONAGEM a01 — Bêbado -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="a01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/a01_final.png" alt="Carta: Bêbado" width="130">
    <div><code>a01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>a01</code> · Bêbado <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Personagens complexos · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Não sabe que é o Bêbado</span>.</p>
      <p><span class="rule-red">Substitui</span> a Vidente, a Menina, o Sonâmbulo, o Domador do Urso, o Domador dos Coelhos, o Domador do Corvo, o Domador da Raposa ou o Domador da Aranha (aleatório a cada jogo).</p>
      <p>Mas todas as informações que lhe são dadas são como se o personagem estivesse envenenado.</p>
      <p><strong>Se envenenado:</strong><br>Recebe as informações certas.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM a02 — Cão-Lobo -->
<!-- ============================================================ -->
<tr class="role-row faction-flex" id="a02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/a02_final.png" alt="Carta: Cão-Lobo" width="130">
    <div><code>a02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟨 <code>a02</code> · Cão-Lobo <span class="role-badge">Flexível</span></div>
    <div class="role-meta">Categoria: Personagens complexos · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Na segunda noite</span> pode <span class="rule-red">escolher</span> se quer ser um simples Lobisomem (👎) <span class="rule-red">ou</span> ser um Cão (👍) :</p>
      <p>O Cão escolhe um dono e ganha os poderes do dono.</p>
      <p><span class="rule-red">A cada noite</span> o cão acorda com o seu dono e nesse caso, cada um terá direito a fazer a sua ação independentemente.</p>
      <p><strong>Se envenenado:</strong><br>O mesmo efeito que o dono ou que um Lobisomem.</p>
      <p><strong>Objetivo:</strong><br>à escolha ou segundo o dono.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM a03 — Mimo -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="a03">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/a03_final.png" alt="Carta: Mimo" width="130">
    <div><code>a03</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>a03</code> · Mimo <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Personagens complexos · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">A cada noite</span>, é chamado e é-lhe mostrada uma carta de um jogador em jogo.</p>
      <p>Mal a carta lhe é revelada, o Mimo indica a ação que quer fazer segundo o poder que lhe foi mostrado.</p>
      <p>Todas as interações entre o Narrador e o Mimo são silenciosas, independentemente do poder do personagem.</p>
      <p><strong>Se envenenado:</strong><br>Efeito do personagem que está a substituir.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM a04 — Ator -->
<!-- ============================================================ -->
<tr class="role-row faction-shifting" id="a04">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/a04_final.png" alt="Carta: Ator" width="130">
    <div><code>a04</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩🟨 <code>a04</code> · Ator <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Personagens complexos · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Na primeira noite</span>, escolhe um jogador que será o seu Ídolo e que copiará se esse jogador morrer. O poder só lhe é revelado quando o Ídolo morrer.</p>
      <p>Pode trocar de Ídolo <span class="rule-red">duas vezes durante o jogo</span> (👈/👎).</p>
      <p><strong>Se envenenado:</strong><br>Efeito do personagem que está a substituir.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens. (flexivel)</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM a05 — Rouba-Túmulos -->
<!-- ============================================================ -->
<tr class="role-row faction-shifting" id="a05">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/a05_final.png" alt="Carta: Rouba-Túmulos" width="130">
    <div><code>a05</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩🟨 <code>a05</code> · Rouba-Túmulos <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Personagens complexos · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">A cada noite</span>, é-lhe mostrado as vítimas.</p>
      <p>Sem saber os seus poderes, o Rouba-Túmulos pode escolher trocar de papel com uma delas (👈/👎).</p>
      <p>Uma vez a vítima escolhida, o seu papel lhe será revelado.</p>
      <p>O Rouba-Túmulos usa permanentemente esses poderes em vez do seu. A vítima se torna Rouba-Túmulos.</p>
      <p>O Rouba-Túmulos será chamado pelo nome do personagem que substituiu desde então.</p>
      <p><strong>Se envenenado:</strong><br>Não acorda.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens. (flexivel)</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM a06 — Ilusionista -->
<!-- ============================================================ -->
<tr class="role-row faction-evil" id="a06">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/a06_final.png" alt="Carta: Ilusionista" width="130">
    <div><code>a06</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟥 <code>a06</code> · Ilusionista <span class="role-badge">Criaturas Malvadas</span></div>
    <div class="role-meta">Categoria: Personagens complexos · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">NÃO</span> ACORDA COM OS LOBISOMENS.</p>
      <p><span class="rule-red">Cada noite</span>, escolhe um jogador (pode ser a si próprio). Esse jogador estará escondido por uma Ilusão.</p>
      <p>Se a Vidente, Lobisomem-Vidente, Domador da Aranha, Faroleiro ou Espião virem uma Ilusão, verão o papel “Ilusionista”.</p>
      <p>Se o Mimo copia uma Ilusão, ele copia o Ilusionista.</p>
      <p>Se o alvo de um dos Domadores de Animais for uma Ilusão, o animal ficará confuso. No caso do Domador da Aranha, se o jogador com a teia de aranha for uma Ilusão, a aranha estará confusa.</p>
      <p>Se o assassino da vítima escolhida pela Menina for uma Ilusão, a Menina verá o papel “Ilusionista”.</p>
      <p>Se o jogador acusado pelo Pedro for uma Ilusão, o Pedro recebe como informação que esse jogador não é Lobisomem, mesmo se for.</p>
      <p><strong>Se envenenado:</strong><br>A ilusão não acontecerá.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Aldeões.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM as01b — Amante Secreto -->
<!-- ============================================================ -->
<tr class="role-row faction-independent" id="as01b">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/as01b_final.png" alt="Carta: Amante Secreto" width="130">
    <div><code>as01b</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟪 <code>as01b</code> · Amante Secreto <span class="role-badge">Independente</span></div>
    <div class="role-meta">Categoria: Personagens complexos · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">A cada noite</span> aponta para um jogador e o Narrador informa-lhe se é um dos <span class="rule-red">Namorado</span>s (👍) ou não (👎).</p>
      <p>Se o jogador for um dos Namorados, este será informado, e o Amante Secreto <span class="rule-red">substituirá o outro</span> Namorado sem que esse o saiba.</p>
      <p>Se o Traidor ou o Amante Secreto morrerem, o Traído não morre.</p>
      <p>A flecha de proteção do Cupido também protege a identidade dos Namorados (a resposta será 👎).</p>
      <p><strong>Se envenenado:</strong><br>O Narrador anuncia que um dos Namorados foi traído.</p>
      <p><strong>Objetivo:</strong><br>O Amante Secreto e o Traidor serem os únicos sobreviventes.</p>
    </div>
  </td>
</tr>
</tbody>
</table>
---

<a id="personagens-forretas-para-quando-ha-muita-gente"></a>

### Personagens forretas (para quando há muita gente)

<table class="character-table">
<colgroup>
<col class="image-col" width="150">
<col>
</colgroup>
<thead>
<tr>
<th width="150">Carta</th>
<th>Descrição</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONAGEM l01 — Aldeão Triste -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="l01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/l01_final.png" alt="Carta: Aldeão Triste" width="130">
    <div><code>l01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>l01</code> · Aldeão Triste <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Personagens forretas (para quando há muita gente) · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Sem poder especial.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM l02 — Criança Selvagem -->
<!-- ============================================================ -->
<tr class="role-row faction-shifting" id="l02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/l02_final.png" alt="Carta: Criança Selvagem" width="130">
    <div><code>l02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩🟨 <code>l02</code> · Criança Selvagem <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Personagens forretas (para quando há muita gente) · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p><span class="rule-red">Na segunda noite</span> escolhe um jogador como Pai Adotivo.</p>
      <p><span class="rule-red">Se o Pai Adotivo morrer</span>, a Criança Selvagem, se transforma em Lobisomem.</p>
      <p><strong>Se envenenado:</strong><br>Transforma-se em Lobisomem.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens. (flexível)</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM l03 — Irmãs -->
<!-- ============================================================ -->
<tr class="role-row faction-shifting" id="l03">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/l03_final.png" alt="Carta: Irmãs" width="130">
    <div><code>l03</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩🟨 <code>l03</code> · Irmãs <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Personagens forretas (para quando há muita gente) · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>As Irmãs conhecem-se.</p>
      <p>Se uma irmã for <span class="rule-red">executada</span>, a outra pode <span class="rule-red">escolher</span> se vingar, tornando-se uma Criatura Malvada.</p>
      <p>Ela acorda <span class="rule-red">SÓ UMA VEZ</span> com os Lobisomens na próxima noite, para que eles saibam que ela os vai ajudar durante o dia.</p>
      <p><strong>Se envenenada enquanto Criatura Malvada:</strong><br>Se torna num Lobisomem.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens. (flexível)</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM l04 — Irmãos -->
<!-- ============================================================ -->
<tr class="role-row faction-good" id="l04">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/final/l04_final.png" alt="Carta: Irmãos" width="130">
    <div><code>l04</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">🟩 <code>l04</code> · Irmãos <span class="role-badge">Aldeões</span></div>
    <div class="role-meta">Categoria: Personagens forretas (para quando há muita gente) · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Os Irmãos conhecem-se.</p>
      <p>Enquanto pelo menos dois irmãos sobreviverem à noite, nenhum morre.</p>
      <p><strong>Se qualquer um estiver envenenado:</strong><br>Morre na mesma.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
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
<th width="150">Carta</th>
<th>Descrição</th>
</tr>
</thead>
<tbody>
<!-- ============================================================ -->
<!-- PERSONAGEM x01 — Aldeões -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/x01_card.png" alt="Carta: Aldeões" width="130">
    <div><code>x01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x01</code> · Aldeões <span class="role-badge">Extra</span></div>
    <div class="role-meta">Categoria: Extras · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Assustados e desconfiados, os Aldeões mentem, tentam encontrar em quem podem confiar e usam os seus poderes para matar e executar todos os Lobisomens e outras Criaturas Malvadas antes que esses consigam apoderar-se da Aldeia.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Lobisomens.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM x02 — Criaturas Malvadas -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x02">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/x02_card.png" alt="Carta: Criaturas Malvadas" width="130">
    <div><code>x02</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x02</code> · Criaturas Malvadas <span class="role-badge">Extra</span></div>
    <div class="role-meta">Categoria: Extras · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Inclui todos os inimigos dos Aldeões, esses sendo Lobisomens ou outros personagens malvados.</p>
      <p>O objetivo de todas as Criaturas Malvadas é o mesmo: matar todos os Aldeões, antes destes conseguirem encontrar todos os Lobisomens.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Aldeões.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM x02.1 — Lobisomens -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x02.1">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/x021_card.png" alt="Carta: Lobisomens" width="130">
    <div><code>x02.1</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x02.1</code> · Lobisomens <span class="role-badge">Extra</span></div>
    <div class="role-meta">Categoria: Extras · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>É o grupo que mais aterroriza os Aldeões.</p>
      <p>Cada noite têm que escolher em unanimidade quem querem assassinar, tentando eliminar os Aldeões mais poderosos primeiro, com a ajuda das outras Criaturas Malvadas.</p>
      <p><strong>Se qualquer Lobisomem estiver envenenado:</strong><br>Não podem matar.</p>
      <p><strong>Objetivo:</strong><br>Matar todos os Aldeões.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM x03 — Fantasma -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x03">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/x03_card.png" alt="Carta: Fantasma" width="130">
    <div><code>x03</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x03</code> · Fantasma <span class="role-badge">Extra</span></div>
    <div class="role-meta">Categoria: Extras · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Há dois tipos de morte: <span class="rule-red">EXECUÇÃO</span> (condenados pela aldeia) ou <span class="rule-red">ASSASSINATO</span> (mortos pelo poder de um personagem).</p>
      <p>Quando um jogador é morto durante a noite, só morre mesmo de manhã, ao acordar, assim durante aquela noite podem continuar a usar os seus poderes.</p>
      <p>Os jogadores mortos transformam-se em fantasmas, que podem continuar a comunicar com a aldeia durante o dia, mas não podem falar ou votar no tribunal, e <span class="rule-red">perdem qualquer poder que tinham</span> (a não ser que esteja escrito o contrário na ficha de personagem.)</p>
      <p><strong>Objetivo:</strong><br>Fantasmas guardam o mesmo objetivo que enquanto vivos.</p>
      <p><span class="rule-red">Os Fantasmas TAMBÉM DORMEM À NOITE</span>.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM x.v09 — Soldado -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x.v09">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/xv09_card.png" alt="Carta: Soldado" width="130">
    <div><code>x.v09</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x.v09</code> · Soldado <span class="role-badge">Extra</span></div>
    <div class="role-meta">Categoria: Extras · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Criado pelo Capitão.</p>
      <p><span class="rule-red">Uma vez morto</span>, será acordado na próxima noite para escolher <span class="rule-red">um</span> jogador que deverá assassinar.</p>
      <p><strong>Se envenenado:</strong><br>Sem efeito.</p>
      <p><strong>Objetivo:</strong><br>Não muda.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM x.s01 — Namorado -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x.s01">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/xs01_card.png" alt="Carta: Namorado" width="130">
    <div><code>x.s01</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x.s01</code> · Namorado <span class="role-badge">Extra</span></div>
    <div class="role-meta">Categoria: Extras · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Conhece a identidade do outro Namorado.</p>
      <p>Se um morrer, o outro suicida-se.</p>
      <p>Se a vítima for imune ou for salva, ninguém morre.</p>
      <p>Se o suicida for imune ou salvo, ele não morre.</p>
      <p><strong>Objetivo:</strong><br>Os Namorados serem os únicos sobreviventes.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM x.as01b.1 — Traidor -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x.as01b.1">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/x.as01b.1_card.png" alt="Carta: Traidor" width="130">
    <div><code>x.as01b.1</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x.as01b.1</code> · Traidor <span class="role-badge">Extra</span></div>
    <div class="role-meta">Categoria: Extras · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Conhece a identidade do Amante Secreto.</p>
      <p>Se um morrer, o outro suicida-se.</p>
      <p>Se a vítima for imune ou for salva, ninguém morre.</p>
      <p>Se o suicida for imune ou salvo, ele não morre.</p>
      <p><strong>Objetivo:</strong><br>O Amante Secreto e o Traidor serem os únicos sobreviventes.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM x.as01b.2 — Traído -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x.as01b.2">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/x.as01b.2_card.png" alt="Carta: Traído" width="130">
    <div><code>x.as01b.2</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x.as01b.2</code> · Traído <span class="role-badge">Extra</span></div>
    <div class="role-meta">Categoria: Extras · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Não sabe que é o Traído, continua a agir como um Namorado até o descobrir.</p>
      <p>Se o Traidor ou o Amante Secreto morrerem, o Traído não morre.</p>
      <p><strong>Objetivo:</strong><br>O do papel original.</p>
    </div>
  </td>
</tr>
<!-- ============================================================ -->
<!-- PERSONAGEM x.m05 — Inimigo -->
<!-- ============================================================ -->
<tr class="role-row faction-extra" id="x.m05">
  <td class="role-image-cell" width="150" valign="top" align="center">
    <img src="art/xtras_cards/xm05_card.png" alt="Carta: Inimigo" width="130">
    <div><code>x.m05</code></div>
  </td>
  <td class="role-text-cell" valign="top">
    <div class="role-title">⬜ <code>x.m05</code> · Inimigo <span class="role-badge">Extra</span></div>
    <div class="role-meta">Categoria: Extras · <a href="#lista-rapida-de-personagens">voltar à lista rápida</a></div>
    <div class="role-description">
      <p>Se um Inimigo conseguir condenar o outro a <span class="rule-red">execução</span>, o primeiro recebe imunidade contra a próxima tentativa de <span class="rule-red">assassinato</span>.</p>
      <p><span class="rule-red">A cada vez que um dos Inimigos morre</span>, o Cupido Malvado é acordado para escolher um novo Inimigo para o sobrevivente.</p>
      <p><strong>Objetivo:</strong><br>Não muda.</p>
    </div>
  </td>
</tr>
</tbody>
</table>

---
<a id="a-noite"></a>

## A Noite
<a id="primeira-noite"></a>

### Primeira Noite
> [!NOTE]
> Esta noite não terá mortos.
> Lançar um d12.

- O Cupido acorda e escolhe dois jogadores que serão Namorados. O Cupido adormece e os Namorados serão agora tocados e podem se conhecer. Se um Namorado morre, o outro se suicida. O objetivo dos Namorados e do Cupido é que os Namorados sejam os últimos sobreviventes. Enquanto os Namorados estiverem vivos, o jogo continua.
- O Cupido Malvado acorda e escolhe dois jogadores que serão Inimigos. O Cupido Malvado adormece e os Inimigos serão tocados e podem se conhecer. Se um Inimigo consegue condenar o outro a execução, o primeiro recebe imunidade na próxima tentativa de assassinato.
- As Irmãs acordam para se conhecerem.
- Os Irmãos acordam para se conhecerem.
- O Ator acorda e escolhe um Ídolo cujo poder copiará quando o Ídolo morrer. Só lhe será revelado o poder do Ídolo, na noite a seguir à morte do Ídolo.
- O Domador da Aranha acorda e escolhe um jogador no qual tece uma teia de aranhã. O Domador da Aranha, a cada noite, descobre quais personagens apontaram para esse jogador naquela noite.
- O Domador do Corvo acorda e é-lhe revelado o número de Criaturas Malvadas que vivem na Aldeia.
- O Domador da Raposa acorda e indica três vizinhos. Será-lhe revelado, com o polegar, se um desses três jogadores é uma Criatura Malvada.
- O Urso rosna/não rosna.
- O Chefe da Aldeia acorda e escolhe um jogador que automaticamente terá 2 votos contra ele no próximo Tribunal.
- No fim desta noite ouve-se um uivar. A Aldeia sabe então que os Lobisomens se revelaram e estão com fome. A Aldeia acorda desconfiada de toda a gente.

### Início da Segunda Noite
- O Ladrão acorda e escolhe com o polegar se quer jogar do lado dos Aldeões ou do lado dos Lobisomens.
- O Cão-Lobo acorda e diz com o polegar se quer ser um Cão ou um Lobisomem. Se escolher ser um Cão vai indicar um dono, que vai ser tocado e que poderá acordar para conhecer o seu cachorro. É revelado ao Cão o papel do seu dono. A partir deste momento, o Cão acorda sempre com o seu dono e deve também usar o seu poder independentemente do dono. Se escolher ser um Lobisomem, pode voltar a dormir.
- A Criança Selvagem acorda e escolhe o seu Pai Adotivo. Se este morrer durante o jogo, a Criança Selvagem se tornará um Lobisomem.
- Os Lobisomens acordam e são-lhe apresentados as Criaturas Malvadas.

### Noite Normal
> [!NOTE]
> Lançar um d12.
> Ressuscitar o jogador salvo pelo Anjo, se aplicável.

> Se o Cavaleiro Enferrujado morreu durante o dia, matar o Lobisomem mais próximo durante o próximo dia.

- (Se o jogador com a teia morreu) O Domador da Aranha acorda e escolhe um novo jogador no qual tece uma teia.
- (Se o Capuchinho Vermelho foi executado) O Caçador acorda furioso e escolhe quem quer assassinar.
- (Se o Caçador morreu) O Fantasma do Caçador acorda e escolhe quem quer assassinar.
- (Se o SOLDADO morreu) O Fantasma do Soldado acorda e escolhe quem quer assassinar.
- O Ator acorda. Se o seu Ídolo morreu, é-lhe mostrado o papel ao qual irá responder de agora em diante, senão o Ator indica ao apontar outra pessoa se quer trocar de Ídolo.
- (Se um Inimigo morrer) O Cupido Malvado acorda e escolhe um segundo Inimigo. O Cupido Malvado adormece e os Inimigos serão tocados e podem se conhecer. Se um Inimigo consegue condenar o outro a execução, o primeiro recebe imunidade na próxima tentativa de assassinato.
- O Sonâmbulo acorda e escolhe um jogador para visitar, uma vez a escolha feita, adormece na casa dessa pessoa. Essa pessoa vai ser tocada e sabe que mesmo se for chamada, não acordará.
- A Bruxa Malvada acorda e escolhe um jogador que irá envenenar esta noite.
- A Empregada acorda e é-lhe revelada a distância até a pessoa envenenada.
- A Cigana acorda e indica 3 vizinhos. Se um deles estiver envenenado, ele perde o veneno e a Cigana passa a estar envenenada.
- O Ilusionista acorda e indica o jogador cuja a identidade será obstruída.
- (Se alguém morreu) A Vidente acorda e é-lhe revelado o papel dos mortos de ontem. (Limpar “† de ontem”).
- O Espião acorda e é-lhe revelado um papel em jogo.
- O Domador do Corvo acorda e é-lhe revelado o número de Criaturas Malvadas que ainda vivem na Aldeia (ou o Corvo está confuso).
- O Domador da Raposa acorda e indica três vizinhos. Será-lhe revelado, com o polegar, se um desses três jogadores é uma Criatura Malvada (ou se a Raposa está confusa).
- O Urso rosna/não rosna (/está confuso).
- O Chefe da Aldeia acorda e escolhe um jogador que automaticamente terá 2 votos contra ele no próximo Tribunal.
- O Ladrão acorda e indica a quem quer retirar o voto no próximo Tribunal.
- O Capitão acorda e escolhe um jogador que será um SOLDADO durante esta noite e o próximo dia.
- O Cupido acorda e decide com o polegar se quer usar uma das suas duas flechas de proteção para dar imunidade aos Namorados esta noite.
- O Amante Secreto acorda e aponta para um jogador, e será revelado se é um dos Namorados. Se for o caso, esse Namorado será tocado e pode acordar para lhe ser revelado o seu Amante, que substitui o antigo Namorado.
- O Salvador acorda e indica quem será imune durante esta noite e o dia.
- O Piromaníaco acorda/não acorda. São-lhe mostradas as pessoas inocentadas no último tribunal. Ele decide, ao indicar ou mostrar o polegar para baixo, se quer ou não incendiar a casa de uma delas.
- O Pedro acorda (todas as noites). Se ele acusou alguém em Tribunal, é-lhe indicado se essas pessoas são Lobisomens. Relembro que o Pedro não pode levar a mesma pessoa a Tribunal duas vezes.
- Os Lobisomens acordam/não acordam se envenenados e escolhem em conjunto uma vítima que irão assassinar esta noite.
- O Lobisomem Mau acorda e escolhe com o polegar se quer se mascarar de Avózinha esta noite e dia, ou não. Pode usar esse poder duas vezes durante todo o jogo.
- O Lobisomem Vidente acorda/não acorda se envenenados e decide com o polegar se quer salvar a vítima para ver o seu papel ou deixá-la morrer.
- O Lobisomem Vampiro acorda/não acorda se salvo pela Vidente ou se envenenados e diz com o polegar se quer transformar a vítima em Lobisomem. Se for o caso, a vítima será tocada, e passará a acordar sempre com os Lobisomens. A vítima diz com o polegar se quer guardar os seus poderes ou não.
- (A cada 3 noites) O Lobisomem Branco acorda e escolhe o Lobisomem que quer matar. / O Lobisomem Branco acorda e escolhe mais um jogador que quer matar.
- O Domador dos Coelhos ouviu os Coelhos assustados esta noite/ [nada] (/os Coelhos estão confusos)
- O Chaman acorda/não acorda se não houver vítimas e são-lhe apresentadas as vítimas. Ele escolhe então com o polegar se as quer salvar ou não. Relembro que pode salvar duas pessoas durante o jogo todo.
- O Faroleiro acorda e é-lhe mostrado um personagem em jogo com um poder limitado e é informado de quantos usos esse personagem ainda tem.
- O Mimo acorda e é-lhe mostrado um papel em jogo. Ele age silenciosamente segundo esse papel ou recebe as informações que esse papel receberia.
- (Se o Cavaleiro Enferrujado morreu durante a noite, matar o Lobisomem mais próximo.)
- O Rouba-Túmulos acorda/não acorda se não houver vítimas e lhe são apresentadas as vítimas. Ele decide, ao indicar ou mostrar com o polegar para baixo, se quer ou não tomar o lugar de uma delas. Se escolher substituir uma das vítimas, o Rouba-Túmulos troca de poder com esse fantasma.
- A Menina acorda/não acorda se não houver vítimas e vê como as vítimas desta noite morreram.
- O Profeta acorda/não acorda se não houver vítimas e indica, ao apontar um jogador que acha que morreu esta noite. Se estiver correto, o jogador será tocado, para saber que pode guardar o seu poder, mesmo como Fantasma, durante o próximo dia e a noite.
- O Domador da Aranha acorda/não acorda se não houver necessidade e é-lhe mostrado todas os papeis dos jogadores que foram apanhados pela teia esta noite.

---
<a id="codigo-para-o-guiao-interativo"></a>

## Código para o guião interativo
- <https://wotct.lovable.app>

---