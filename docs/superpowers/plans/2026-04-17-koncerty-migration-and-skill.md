# Koncerty — migrace frontmatter a skill `new-concert` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Přepnout frontmatter 22 existujících koncertů: prohodit `title`↔`desc`, přejmenovat `desc`→`place` s hodnotou z `## nadpisu`. (2) Vytvořit projektový skill `new-concert`, který z PDF/textu interaktivně vytvoří nový koncert včetně souboru, zkopírování PDF a git commitu.

**Architecture:** Jednorázový Node.js migrační skript s unit testem nad extrakční logikou, následně update dvou šablon (`_includes/concert.njk`, `koncerty/index.md`). Skill je markdown soubor v `.claude/skills/new-concert/SKILL.md` s procesním návodem pro Claude Code.

**Tech Stack:** Node.js 22 built-in `node:test`, gray-matter (už v `node_modules` jako transitive dep z Eleventy), Eleventy 3, Tailwind 4.

---

## File Structure

**Nové soubory:**
- `scripts/migrate-koncerty-frontmatter.mjs` — migrační skript (po použití se smaže).
- `scripts/migrate-koncerty-frontmatter.test.mjs` — unit testy pro extrakční funkce (po použití se smažou).
- `.claude/skills/new-concert/SKILL.md` — definice skillu.

**Upravené soubory:**
- Všech 22 `koncerty/*.md` (kromě `index.md`) — frontmatter mutace.
- `_includes/concert.njk:41-42` — `desc` → `place`.
- `koncerty/index.md:33-34` — `desc` → `place`.

**Mimo scope:** `_includes/gallery.njk` a `fotogalerie/**` používají `desc` — neměníme (nesouvisí s koncerty).

**Poznámka k `_head.njk`:** Používá `{{ desc or description }}` pro `<meta name="description">`. Po migraci koncertů nebude mít koncertní stránka nastaven meta description. Toto není řešeno tímto plánem — pokud bude potřeba, uživatel vyřeší samostatně.

---

## Task 1: Migrační skript — kostra + test pro `extractPlace`

**Files:**
- Create: `scripts/migrate-koncerty-frontmatter.mjs`
- Create: `scripts/migrate-koncerty-frontmatter.test.mjs`

Skript má dvě pure funkce: `extractPlace(headingLine)` a `rewriteFrontmatter(fileText, newFields)`. Testujeme je unit testy, spouštění nad filesystémem pak přes flag.

- [ ] **Step 1.1: Vytvořit `scripts/migrate-koncerty-frontmatter.test.mjs` s failing testem pro `extractPlace`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractPlace } from "./migrate-koncerty-frontmatter.mjs";

test("extractPlace: bere část před první čárkou", () => {
  assert.equal(
    extractPlace("## Kostel ČCE U Salvátora, Salvátorská 1, Praha 1, Staré Město"),
    "Kostel ČCE U Salvátora"
  );
});

test("extractPlace: bez čárky vrací celý nadpis", () => {
  assert.equal(extractPlace("## České muzeum hudby"), "České muzeum hudby");
});

test("extractPlace: trimuje whitespace", () => {
  assert.equal(extractPlace("##   Zpěvácký spolek Hlahol   "), "Zpěvácký spolek Hlahol");
});

test("extractPlace: respektuje uvozovky v nadpisu", () => {
  assert.equal(
    extractPlace("## Konferenční a společenské centrum „Profesní dům\" (refektář)"),
    "Konferenční a společenské centrum „Profesní dům\" (refektář)"
  );
});
```

- [ ] **Step 1.2: Vytvořit `scripts/migrate-koncerty-frontmatter.mjs` s prázdnou exportovanou funkcí**

```js
export function extractPlace(headingLine) {
  return "";
}
```

- [ ] **Step 1.3: Spustit test — ověřit, že padá**

Run: `node --test scripts/migrate-koncerty-frontmatter.test.mjs`
Expected: 4 tests fail (4 !== očekávaná hodnota).

- [ ] **Step 1.4: Implementovat `extractPlace`**

Nahradit tělo funkce v `scripts/migrate-koncerty-frontmatter.mjs`:

```js
export function extractPlace(headingLine) {
  const withoutMarker = headingLine.replace(/^##\s*/, "");
  const firstComma = withoutMarker.indexOf(",");
  const raw = firstComma === -1 ? withoutMarker : withoutMarker.slice(0, firstComma);
  return raw.trim();
}
```

- [ ] **Step 1.5: Spustit test — ověřit, že prochází**

Run: `node --test scripts/migrate-koncerty-frontmatter.test.mjs`
Expected: 4/4 PASS.

---

## Task 2: Migrační skript — `rewriteFrontmatter`

**Files:**
- Modify: `scripts/migrate-koncerty-frontmatter.mjs`
- Modify: `scripts/migrate-koncerty-frontmatter.test.mjs`

Funkce `rewriteFrontmatter(fileText)` parsuje frontmatter řádek po řádku (format `key: "value"` nebo `key: value`), provede transformaci (swap title/desc → title/place, reorder), a vrátí nový text souboru. Preferuje zachování původního formátování (uvozovky, odsazení) — proto hand-roll parser, ne gray-matter.

- [ ] **Step 2.1: Přidat failing testy pro `rewriteFrontmatter`**

Append do `scripts/migrate-koncerty-frontmatter.test.mjs`:

```js
import { rewriteFrontmatter } from "./migrate-koncerty-frontmatter.mjs";

const SAMPLE_WITH_PDF = `---
title: "Salvátor"
desc: "Corelli, Mozart, Vivaldi"
date: "2025-12-15"
tags: "koncerty"
layout: "concert.njk"
pdf: "2025-12-15-salvator.pdf"
templateEngineOverride: njk,md
---

## Kostel ČCE U Salvátora, Salvátorská 1, Praha 1, Staré Město

**Program:** A. Corelli: Concerto grosso č. 8
`;

const EXPECTED_WITH_PDF = `---
title: "Corelli, Mozart, Vivaldi"
place: "Kostel ČCE U Salvátora"
date: "2025-12-15"
tags: "koncerty"
layout: "concert.njk"
pdf: "2025-12-15-salvator.pdf"
templateEngineOverride: njk,md
---

## Kostel ČCE U Salvátora, Salvátorská 1, Praha 1, Staré Město

**Program:** A. Corelli: Concerto grosso č. 8
`;

test("rewriteFrontmatter: prohodí title/desc, přejmenuje na place, zachová pdf", () => {
  assert.equal(rewriteFrontmatter(SAMPLE_WITH_PDF), EXPECTED_WITH_PDF);
});

const SAMPLE_NO_PDF = `---
title: "Muzeum hudby"
desc: "Grieg, Britten, Sarasate, Wirén"
date: "2018-06-25"
tags: "koncerty"
layout: "concert.njk"
templateEngineOverride: njk,md
---

## České muzeum hudby

**Program:** E. Grieg - Suita
`;

const EXPECTED_NO_PDF = `---
title: "Grieg, Britten, Sarasate, Wirén"
place: "České muzeum hudby"
date: "2018-06-25"
tags: "koncerty"
layout: "concert.njk"
templateEngineOverride: njk,md
---

## České muzeum hudby

**Program:** E. Grieg - Suita
`;

test("rewriteFrontmatter: funguje bez pdf", () => {
  assert.equal(rewriteFrontmatter(SAMPLE_NO_PDF), EXPECTED_NO_PDF);
});

test("rewriteFrontmatter: vyhodí chybu když není ## heading", () => {
  const bad = `---
title: "X"
desc: "Y"
---

žádný heading tady
`;
  assert.throws(() => rewriteFrontmatter(bad), /heading/i);
});
```

- [ ] **Step 2.2: Spustit test — ověřit, že padá**

Run: `node --test scripts/migrate-koncerty-frontmatter.test.mjs`
Expected: 3 nové testy fail (`rewriteFrontmatter is not a function`).

- [ ] **Step 2.3: Implementovat `rewriteFrontmatter`**

Append do `scripts/migrate-koncerty-frontmatter.mjs`:

```js
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
const KEY_ORDER = ["title", "place", "date", "tags", "layout", "pdf", "templateEngineOverride"];

function parseFrontmatter(block) {
  const entries = [];
  for (const line of block.split("\n")) {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!match) continue;
    entries.push([match[1], match[2]]);
  }
  return Object.fromEntries(entries);
}

function serializeFrontmatter(obj) {
  const lines = [];
  for (const key of KEY_ORDER) {
    if (obj[key] === undefined) continue;
    lines.push(`${key}: ${obj[key]}`);
  }
  return lines.join("\n");
}

export function rewriteFrontmatter(fileText) {
  const m = fileText.match(FRONTMATTER_RE);
  if (!m) throw new Error("No frontmatter delimited by --- found");
  const [, block, body] = m;
  const data = parseFrontmatter(block);

  const headingMatch = body.match(/^##\s+(.+)$/m);
  if (!headingMatch) throw new Error("No ## heading found in body");
  const placeValue = extractPlace(headingMatch[0]);

  const newData = {
    title: data.desc,
    place: `"${placeValue}"`,
    date: data.date,
    tags: data.tags,
    layout: data.layout,
    pdf: data.pdf,
    templateEngineOverride: data.templateEngineOverride,
  };

  const newBlock = serializeFrontmatter(newData);
  return `---\n${newBlock}\n---\n${body}`;
}
```

- [ ] **Step 2.4: Spustit test — ověřit, že prochází**

Run: `node --test scripts/migrate-koncerty-frontmatter.test.mjs`
Expected: 7/7 PASS.

- [ ] **Step 2.5: Commit**

```bash
git add scripts/migrate-koncerty-frontmatter.mjs scripts/migrate-koncerty-frontmatter.test.mjs
git commit -m "scripts: add koncerty frontmatter migration (with tests)"
```

---

## Task 3: Migrační skript — CLI runner

**Files:**
- Modify: `scripts/migrate-koncerty-frontmatter.mjs`

Přidat do skriptu CLI část, která: najde všechny `koncerty/*.md` kromě `index.md`, aplikuje `rewriteFrontmatter`, zapíše zpět. Výpis upravených souborů.

- [ ] **Step 3.1: Přidat runner do `scripts/migrate-koncerty-frontmatter.mjs`**

Append:

```js
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

function runCli() {
  const here = dirname(fileURLToPath(import.meta.url));
  const koncertyDir = join(here, "..", "koncerty");
  const files = readdirSync(koncertyDir)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((f) => join(koncertyDir, f));

  let changed = 0;
  for (const file of files) {
    const before = readFileSync(file, "utf8");
    const after = rewriteFrontmatter(before);
    if (before !== after) {
      writeFileSync(file, after);
      console.log(`upraveno: ${file}`);
      changed++;
    } else {
      console.log(`beze změny: ${file}`);
    }
  }
  console.log(`\nCelkem upraveno: ${changed} z ${files.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
```

- [ ] **Step 3.2: Spustit testy — ověřit, že stále procházejí**

Run: `node --test scripts/migrate-koncerty-frontmatter.test.mjs`
Expected: 7/7 PASS.

---

## Task 4: Spustit migraci nad všemi koncerty

**Files:**
- Modify: všech 22 `koncerty/*.md` kromě `index.md`

- [ ] **Step 4.1: Spustit migrační skript**

Run: `node scripts/migrate-koncerty-frontmatter.mjs`
Expected: 22 řádků `upraveno: koncerty/...md`, pak `Celkem upraveno: 22 z 22`.

- [ ] **Step 4.2: Ověřit výstup u tří reprezentativních souborů**

Run: `head -9 koncerty/2018-06-25-muzeum-hudby.md koncerty/2025-12-15-salvator.md koncerty/2022-04-08-refektar.md`

Expected:

```
==> koncerty/2018-06-25-muzeum-hudby.md <==
---
title: "Grieg, Britten, Sarasate, Wirén"
place: "České muzeum hudby"
date: "2018-06-25"
tags: "koncerty"
layout: "concert.njk"
templateEngineOverride: njk,md
---

==> koncerty/2025-12-15-salvator.md <==
---
title: "Corelli, Mozart, Vivaldi"
place: "Kostel ČCE U Salvátora"
date: "2025-12-15"
tags: "koncerty"
layout: "concert.njk"
pdf: "2025-12-15-salvator.pdf"
templateEngineOverride: njk,md
---

==> koncerty/2022-04-08-refektar.md <==
---
title: "Richter, Bach, Donizetti, Šostakovič"
place: "Konferenční a společenské centrum „Profesní dům" (refektář)"
date: "2022-04-08"
tags: "koncerty"
layout: "concert.njk"
pdf: "2022-04-08-refektar.pdf"
templateEngineOverride: njk,md
---
```

Poznámka: u refektáře obsahuje `place` uvozovky uvnitř (kvůli zdvojeným quotům ze zdroje). Pokud by to rozbilo YAML parsing v Eleventy, opraví se ručně v Tasku 7.

- [ ] **Step 4.3: Grep: žádný `desc:` v koncerty/**

Run: `grep -l "^desc:" koncerty/*.md || echo "OK - žádný desc nezbyl"`
Expected: `OK - žádný desc nezbyl`.

---

## Task 5: Update `_includes/concert.njk`

**Files:**
- Modify: `_includes/concert.njk:41-42`

- [ ] **Step 5.1: Otevřít `_includes/concert.njk` a najít řádky 41-42**

Stávající:

```njk
              {% if desc %}
                <p class="text-muted text-lg leading-relaxed max-w-xl">{{ desc }}</p>
```

- [ ] **Step 5.2: Nahradit `desc` za `place`**

Nový obsah (řádky 41-42):

```njk
              {% if place %}
                <p class="text-muted text-lg leading-relaxed max-w-xl">{{ place }}</p>
```

---

## Task 6: Update `koncerty/index.md`

**Files:**
- Modify: `koncerty/index.md:33-34`

- [ ] **Step 6.1: Otevřít `koncerty/index.md` a najít řádky 33-34**

Stávající:

```njk
              {% if item.data.desc %}
                <p class="text-muted text-sm mt-2 leading-relaxed">{{ item.data.desc }}</p>
```

- [ ] **Step 6.2: Nahradit `item.data.desc` za `item.data.place`**

Nový obsah:

```njk
              {% if item.data.place %}
                <p class="text-muted text-sm mt-2 leading-relaxed">{{ item.data.place }}</p>
```

---

## Task 7: Ověřit build Eleventy

**Files:** žádný nový / nemodifikovaný — ověření.

- [ ] **Step 7.1: Spustit Eleventy build**

Run: `npx @11ty/eleventy 2>&1 | tail -10`
Expected: žádná chyba parseru YAML, bez warnings pro koncertní stránky, vypíše se počet wrote X files.

- [ ] **Step 7.2: Pokud Eleventy hlásí YAML chybu (např. u `2022-04-08-refektar.md` kvůli vnitřním uvozovkám)**

Otevřít dotčený soubor a opravit `place` hodnotu ručně — např. escapovat vnitřní uvozovky nebo použít single-quoted formu:

```yaml
place: 'Konferenční a společenské centrum „Profesní dům" (refektář)'
```

Pak znovu Step 7.1.

- [ ] **Step 7.3: Grep v `_site/koncerty/` zkontrolovat, že `place` se skutečně vykresluje**

Run: `grep -l "České muzeum hudby" _site/koncerty/2018/06/25/* 2>/dev/null || grep -r "České muzeum hudby" _site/koncerty/ | head -3`
Expected: nalezeny řádky z vykreslené HTML stránky s tímto textem.

---

## Task 8: Smazat migrační skript

**Files:**
- Delete: `scripts/migrate-koncerty-frontmatter.mjs`
- Delete: `scripts/migrate-koncerty-frontmatter.test.mjs`

- [ ] **Step 8.1: Smazat oba skripty**

Run:

```bash
rm scripts/migrate-koncerty-frontmatter.mjs scripts/migrate-koncerty-frontmatter.test.mjs
rmdir scripts 2>/dev/null || true
```

- [ ] **Step 8.2: Commit migrace**

```bash
git add -A
git commit -m "koncerty: migrate desc/title swap, rename to place

- swap title and desc values in all 22 concert files
- rename desc -> place (from ## heading before first comma)
- update concert.njk and koncerty/index.md templates
- remove one-shot migration script"
```

---

## Task 9: Vytvořit skill `new-concert` — SKILL.md

**Files:**
- Create: `.claude/skills/new-concert/SKILL.md`

Skill je procedurální návod pro Claude Code. Spouští se na žádost uživatele (např. „přidej koncert", „nový koncert z PDF", `/new-concert`). Výsledek: vytvořený `koncerty/YYYY-MM-DD-<slug>.md`, případně zkopírované PDF a git commit.

- [ ] **Step 9.1: Vytvořit adresář `.claude/skills/new-concert/`**

Run: `mkdir -p .claude/skills/new-concert`

- [ ] **Step 9.2: Zapsat `SKILL.md`**

```md
---
name: new-concert
description: Vytvoř nový koncert (markdown + volitelně PDF) do `koncerty/`. Použij, když uživatel řekne „přidej koncert", „nový koncert z PDF", „vytvoř koncert" apod. Přijímá PDF pozvánku (cesta nebo `@soubor.pdf`) nebo volný text. Interaktivně doptá chybějící pole, navrhne title a slug, zkopíruje PDF, nabídne git commit.
---

# Skill: new-concert

Slouží k vytvoření nového koncertu v tomto repozitáři. Pracuješ v adresáři `/Users/petr.kolacek/_kblh_/dev/kovs/kovs` (nebo aktuálním worktree). Struktura koncertu je definována v `docs/superpowers/specs/2026-04-17-koncerty-migration-and-skill-design.md`.

## Vstup

Uživatel může poskytnout:
- PDF pozvánku (cesta k souboru, `@soubor.pdf` reference, nebo URL ke stažení).
- Volný text s informacemi o koncertu.
- Jen záměr („přidej koncert") — skill se doptá na vše.

## Cílová struktura

**Soubor:** `koncerty/YYYY-MM-DD-<slug>.md`

```md
---
title: "<skladatelé / zkrácený program>"
place: "<krátký název místa>"
date: "YYYY-MM-DD"
tags: "koncerty"
layout: "concert.njk"
pdf: "YYYY-MM-DD-<slug>.pdf"
templateEngineOverride: njk,md
---

## <Plný název místa + adresa>

**Program:** <program>

**Sólisté:** <seznam>
<volný popis souboru, např. "Naši pěvci">
**Sbormistr:** <jméno>
**Diriguje:** <jméno>
```

Pole `pdf` vynech, pokud není PDF.
Volitelné bloky (`Sólisté`, popis souboru, `Sbormistr`) vynech, pokud jsou prázdné.

## Postup (striktně v tomto pořadí)

### 1. Sběr dat ze vstupu

- Pokud je vstupem PDF (cesta nebo `@`): použij tool **Read** na PDF. Extrahuj z textu:
  - `date` (datum koncertu, formát `YYYY-MM-DD`)
  - plný název místa včetně adresy (pro `## heading`)
  - `program` (seznam skladeb)
  - `solists` (sólisté/hosté, pokud jsou)
  - `ensembleNote` (účinkující soubor nebo další volný text, pokud je)
  - `choirmaster` (sbormistr, pokud je)
  - `conductor` (dirigent)
- Pokud je vstupem text: analyzuj stejná pole.
- Pokud vstup není žádný: začni rovnou bodem 2 s prázdnými poli.

### 2. Potvrzení / doplnění polí

Zobraz uživateli tabulku extrahovaných polí (i prázdná). Pro každé z povinných polí, které je prázdné nebo nejisté, se zeptej (jedna otázka na zprávu):

- Povinná: `date`, `place` (krátký název, např. „Kostel U Salvátora"), `## heading` (plný název + adresa), `program`, `conductor`.
- Volitelná (ptej se jen stručně v jedné zprávě zda doplnit): `solists`, `ensembleNote`, `choirmaster`.

Pokud uživatel dodá PDF a chce, aby `place`/heading byly ponechány na auto: použij krátkou část před první čárkou v heading jako `place` (stejná logika jako migrace).

### 3. Návrh `title`

Navrhni `title` podle programu — zkrácený seznam skladatelů (např. program obsahující Mozarta a Strausse → `"Mozart, Strauss"`). U sólového díla preferuj `"Skladatel – Název"` (např. `"Dvořák – Stabat Mater"`).

Zeptej se uživatele: „Navrhuji title: `<návrh>`. Potvrdit, nebo upravit?" Pokud odpoví jinak než potvrzením, použij jeho hodnotu.

### 4. Návrh `slug`

Z `place` vygeneruj kandidát na slug:

1. Normalizovat diakritiku (např. `Č→c`, `á→a`, `ř→r`, `ž→z`, `š→s`, `ě→e`, …).
2. Lowercase.
3. Nealfanumerické znaky nahradit pomlčkou, víc pomlček redukovat na jednu.
4. Odfiltrovat „šumová" slova: `kostel`, `u`, `v`, `na`, `svateho`, `svate`, `cce`, `ccsh`, zkratky ze 2–3 písmen.
5. Pokud zbývá víc než dvě slova, vzít první dvě.

Příklady očekávaných slugů (sladit s existujícími):
- `Kostel ČCE U Salvátora` → `salvator`
- `České muzeum hudby` → `muzeum-hudby`
- `Zpěvácký spolek Hlahol` → `hlahol`
- `Černošice` → `cernosice`
- `Refektář profesního domu` → `refektar`
- `Kostel Nanebevzetí Panny Marie Korunní` → `korunni`
- `Arcibiskupské gymnázium` → `arcibiskupske-gymnazium`
- `Kostel sv. Václava v Dejvicích` → `dejvice`

Ukaž slug: „Navrhuji slug: `<slug>`. Výsledný soubor: `koncerty/<date>-<slug>.md`. Potvrdit, nebo upravit?"

### 5. Kontrola kolize

Zkontroluj, zda `koncerty/<date>-<slug>.md` už neexistuje. Pokud ano:

- Zeptej se: „Soubor existuje. (A) přepsat / (B) změnit slug / (C) přerušit?"
- Podle odpovědi: přepiš / zeptej se na nový slug a opakuj krok 5 / ukonči skill.

### 6. Zápis souboru + kopírování PDF

- Sestav finální obsah podle šablony v sekci „Cílová struktura". Vynech `pdf` řádek, pokud není PDF. Vynech volitelné bloky, které jsou prázdné.
- Zapiš `koncerty/<date>-<slug>.md` (tool **Write**).
- Pokud uživatel dodal PDF: zkopíruj ho do `koncerty/pdf/<date>-<slug>.pdf` (tool **Bash** příkazem `cp <zdroj> koncerty/pdf/<date>-<slug>.pdf`).

### 7. Preview a git

- Ukaž uživateli diff (`git diff --stat` + `git status`).
- Zeptej se: „Commitnout? (ano / ne)".
- Pokud ano:

```bash
git add koncerty/<date>-<slug>.md koncerty/pdf/<date>-<slug>.pdf
git commit -m "koncert: <place> <date>"
```

Pokud PDF není, vynech jeho cestu z `git add`.

**Nedělej `git push`** — to je na uživateli.

## Pravidla

- **Jedna otázka na zprávu** — neptej se na 5 věcí najednou.
- **Nikdy automaticky nepřepisuj** existující soubor bez explicitního potvrzení.
- **Čeština** ve veškeré komunikaci s uživatelem.
- **Pole `title` se ptej vždy** (i když máš dobrý návrh) — uživatel má finální slovo.
- **Neotvírej soubor v editoru** automaticky.
- **Nepoužívej `git push`** automaticky.
- Když uživatel řekne „přeskoč", „nevím", „nech prázdné" u volitelného pole, vynech celý řádek/blok z výstupu.
```

- [ ] **Step 9.3: Commit skillu**

```bash
git add .claude/skills/new-concert/SKILL.md
git commit -m "skill: add new-concert for creating concert markdown from PDF/text"
```

---

## Task 10: End-to-end ověření

**Files:** žádný (manual check).

- [ ] **Step 10.1: Seznam souborů v nových / upravených cestách**

Run:

```bash
git log --oneline -5
ls -la .claude/skills/new-concert/
head -8 koncerty/2018-06-25-muzeum-hudby.md
```

Expected:
- Poslední 3 commity pokrývají: scripts/add migration, koncerty: migrate, skill: add new-concert.
- `.claude/skills/new-concert/SKILL.md` existuje.
- První koncert má `title: "Grieg, Britten, Sarasate, Wirén"` a `place: "České muzeum hudby"` ve frontmatteru, žádné `desc:`.

- [ ] **Step 10.2: Rebuild Eleventy a ověření indexu**

Run: `npx @11ty/eleventy 2>&1 | tail -5`
Expected: úspěšný build.

Run: `grep -c "České muzeum hudby" _site/koncerty/index.html`
Expected: alespoň 1 výskyt (na index stránce se vykresluje `place`).

---

## Self-Review

**Spec coverage:**

- Migrace frontmatter → Tasks 1–4 ✓
- Update šablon (`concert.njk`, `index.md`) → Tasks 5, 6 ✓
- `_head.njk` — vyloučeno ze scope, dokumentováno v sekci File Structure ✓
- Skill umístění `.claude/skills/new-concert/SKILL.md` → Task 9 ✓
- Skill vstupy (PDF, text, interaktivní) → krok 1 a 2 ve SKILL.md ✓
- Skill 7 kroků → zdokumentovány v SKILL.md ✓
- Skill šablona výstupu → sekce „Cílová struktura" ve SKILL.md ✓
- Slug heuristika → krok 4 ve SKILL.md ✓
- Git commit → krok 7 ve SKILL.md ✓

**Placeholder scan:** žádné TBD/TODO/implement later — vše má konkrétní kód nebo postup.

**Type consistency:** `extractPlace`, `rewriteFrontmatter` konzistentní v Tasks 1–4. Jména polí (`title`, `place`, `date`, ...) konzistentní napříč testy, migrací, šablonou skillu.
