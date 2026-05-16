# Obsidian Admin (Templater) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Umožnit správu obsahu webu KOVS přímo v Obsidianu — při vytvoření nového souboru v `koncerty/` nebo `interpreti/` Templater plugin automaticky aplikuje šablonu, vyžádá si potřebné údaje, vyplní frontmatter a přejmenuje soubor podle slug pravidel.

**Architecture:** Templater plugin „Folder Templates" mapují složky obsahu na šablony v `_templates/`. Šablony jsou markdown soubory s inline JS bloky (`<%* %>`) pro prompty, slugifikaci a `tp.file.rename`. Eleventy si složku `_templates/` ignoruje. Konfigurace pluginu se commituje do gitu, aby fungovala napříč zařízeními.

**Tech Stack:** Obsidian + Templater plugin, Eleventy (build), Git (obsidian-git plugin pro commity z Obsidianu).

---

## File Structure

**Soubory, které se vytvoří:**
- `_templates/koncert.md` — Templater šablona pro nový koncert
- `_templates/interpret.md` — Templater šablona pro nového interpreta
- `.obsidian/plugins/templater-obsidian/data.json` — konfigurace pluginu (folder mappings)

**Soubory, které se upraví:**
- `.eleventyignore` — přidat `_templates/`

**Žádné JS/CSS změny ve weboveém kódu.** Žádné změny ve schématu existujících `koncerty/*.md` a `interpreti/*.md`.

---

## Poznámka k testování

Tento projekt nemá automatizovaný unit-test framework — testování probíhá ručně skrz Obsidian + Eleventy build. Každý task má proto kontrolní krok, který musí provést uživatel (ne agent), označený **MANUÁL:**. Agent v takovém případě napíše instrukce a počká na potvrzení uživatele (nebo si poznamená, že je potřeba ručně ověřit).

---

## Task 1: Přidat `_templates/` do `.eleventyignore`

**Files:**
- Modify: `.eleventyignore`

- [ ] **Step 1: Načíst současný obsah `.eleventyignore`**

Současný obsah:
```
docs/superpowers/
```

- [ ] **Step 2: Přidat řádek pro `_templates/`**

Nový obsah:
```
docs/superpowers/
_templates/
```

- [ ] **Step 3: Ověřit, že build neselže (MANUÁL — nebo agent může spustit)**

```bash
npx @11ty/eleventy --dryrun
```

Expected: build dokončí bez chyb. (Složka `_templates/` zatím neexistuje, takže `.eleventyignore` řádek nemá co ignorovat — to je v pořádku.)

- [ ] **Step 4: Commit**

```bash
git add .eleventyignore
git commit -m "chore: ignore _templates/ in eleventy build"
```

---

## Task 2: Vytvořit šablonu pro koncert

**Files:**
- Create: `_templates/koncert.md`

- [ ] **Step 1: Vytvořit složku `_templates/`**

```bash
mkdir -p _templates
```

- [ ] **Step 2: Napsat šablonu**

Vytvořit soubor `_templates/koncert.md` s tímto obsahem:

````
<%*
const title = await tp.system.prompt("Název koncertu (program)", "");
const place = await tp.system.prompt("Místo (Profesní dům, Salvátor, …)", "");
const date = await tp.system.prompt("Datum (YYYY-MM-DD)", tp.date.now("YYYY-MM-DD"));
const hasPdf = await tp.system.suggester(["ne","ano"], [false,true], false, "PDF pozvánka?");

const slugify = s => s.normalize("NFD")
  .replace(/[̀-ͯ]/g, "")              // U+0300–U+036F: combining diacritical marks
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const slug = slugify(place);
const filename = `${date}-${slug}`;
await tp.file.rename(filename);
-%>
---
title: "<% title %>"
place: "<% place %>"
date: "<% date %>"
tags: "koncerty"
layout: "concert.njk"
<% hasPdf ? `pdf: "${filename}.pdf"` : `# pdf: "${filename}.pdf"` %>
interpreti: []
templateEngineOverride: njk,md
---

## <% place %>, <adresa>

**Program:**


**Sólisté:**


**Diriguje:** Michael Housa
````

**Klíčové detaily:**
- `<%*` (s hvězdičkou) označuje JS execution blok bez output.
- `-%>` na konci JS bloku potlačí trailing newline, aby frontmatter začal hned.
- `<% expr %>` (bez hvězdičky) vypisuje hodnotu.
- `tp.system.suggester(labels, values, throw_on_cancel, placeholder)` — vrací zvolenou hodnotu z `values`, ale uživatel vidí `labels`.
- `tp.file.rename(filename)` — bez přípony `.md`, Templater ji doplní.
- Pokud `hasPdf` je `false`, řádek `pdf:` bude zakomentovaný (`# pdf: "..."`) — odpovídá konvenci v existujícím souboru `2026-06-02-profesni-dum.md`.

- [ ] **Step 3: Ověřit, že soubor existuje a má správnou strukturu**

```bash
cat _templates/koncert.md | head -20
```

Expected: vidíš začátek šablony s `<%*` blokem.

- [ ] **Step 4: Commit (zatím bez testu — testy proběhnou po dokončení Templater configu v Tasku 4)**

```bash
git add _templates/koncert.md
git commit -m "feat: add Templater template for new concerts"
```

---

## Task 3: Vytvořit šablonu pro interpreta

**Files:**
- Create: `_templates/interpret.md`

- [ ] **Step 1: Napsat šablonu**

Vytvořit soubor `_templates/interpret.md` s tímto obsahem:

````
<%*
const name = await tp.system.prompt("Jméno (Křestní Příjmení)", "");
const instrument = await tp.system.prompt("Nástroj/role (klavír, housle, dirigent, …)", "");

const slugify = s => s.normalize("NFD")
  .replace(/[̀-ͯ]/g, "")              // U+0300–U+036F: combining diacritical marks
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const slug = slugify(name);
await tp.file.rename(slug);
-%>
---
name: "<% name %>"
instrument: "<% instrument %>"
slug: "<% slug %>"
photo: "<% slug %>"
tags: "interpreti"
layout: "interpret.njk"
templateEngineOverride: njk,md
---


````

**Klíčové detaily:**
- Slug se generuje ze `name` (ne z `instrument`).
- `photo` má stejnou hodnotu jako `slug` — uživatel pak ručně uloží obrázek do `interpreti/img/{slug}.jpg`.
- Tělo souboru je prázdné (jen prázdný řádek na konci) — uživatel doplní bio ručně.

- [ ] **Step 2: Ověřit obsah**

```bash
cat _templates/interpret.md | head -15
```

Expected: vidíš začátek šablony s `<%*` blokem a frontmatter.

- [ ] **Step 3: Commit**

```bash
git add _templates/interpret.md
git commit -m "feat: add Templater template for new performers"
```

---

## Task 4: Nakonfigurovat Templater plugin

**Files:**
- Create: `.obsidian/plugins/templater-obsidian/data.json`

- [ ] **Step 1: Vytvořit `data.json`**

Obsah:

```json
{
  "templates_folder": "_templates",
  "trigger_on_file_creation": true,
  "enable_folder_templates": true,
  "folder_templates": [
    { "folder": "koncerty", "template": "_templates/koncert.md" },
    { "folder": "interpreti", "template": "_templates/interpret.md" }
  ],
  "syntax_highlighting": true,
  "enable_system_commands": false,
  "user_scripts_folder": ""
}
```

**Klíčové detaily:**
- `trigger_on_file_creation: true` — bez tohoto folder templates nefungují automaticky.
- `folder_templates` je pole — pořadí položek určuje prioritu (první match vyhrává), ale `koncerty` a `interpreti` se neoverlapují.
- `enable_system_commands: false` — nepoužíváme `<% tp.system.exec %>`, takže to může zůstat vypnuté.

- [ ] **Step 2: Ověřit JSON validitu**

```bash
node -e "JSON.parse(require('fs').readFileSync('.obsidian/plugins/templater-obsidian/data.json'))"
```

Expected: žádný výstup (= JSON je valid). Pokud chyba, zkontroluj escapování.

- [ ] **Step 3: MANUÁL — Reload Obsidianu**

Uživatel: v Obsidianu spusť command `Reload app without saving` (Cmd-P → reload) nebo restartuj Obsidian. Templater plugin musí znovu načíst `data.json`.

- [ ] **Step 4: MANUÁL — Ověřit nastavení Templateru v UI**

Uživatel: otevři Obsidian Settings → Templater. Ověř:
- Template folder location = `_templates`
- Trigger Templater on new file creation = ON
- Folder Templates = ON, s dvěma řádky:
  - `koncerty` → `_templates/koncert.md`
  - `interpreti` → `_templates/interpret.md`

- [ ] **Step 5: Commit**

```bash
git add .obsidian/plugins/templater-obsidian/data.json
git commit -m "chore: configure Templater folder mappings for koncerty and interpreti"
```

---

## Task 5: Smoke test — nový koncert s PDF

**Files (testovací, k smazání):**
- Vznikne v: `koncerty/`

- [ ] **Step 1: MANUÁL — Vytvořit nový soubor v `koncerty/`**

Uživatel: v Obsidianu klikni pravým na složku `koncerty/` → `New note`. Obsidian vytvoří `Untitled.md`.

Templater okamžitě otevře sérii promptů:
1. Název koncertu → zadej `Testovací koncert`
2. Místo → zadej `Salvátor`
3. Datum → ponech default (dnešní datum)
4. PDF pozvánka? → vyber `ano`

- [ ] **Step 2: MANUÁL — Ověřit přejmenování a frontmatter**

Po dokončení promptů soubor musí být přejmenován na `YYYY-MM-DD-salvator.md` (kde YYYY-MM-DD je dnešní datum).

Otevři soubor a ověř, že frontmatter vypadá takto (s aktivním `pdf:` řádkem):

```yaml
---
title: "Testovací koncert"
place: "Salvátor"
date: "YYYY-MM-DD"
tags: "koncerty"
layout: "concert.njk"
pdf: "YYYY-MM-DD-salvator.pdf"
interpreti: []
templateEngineOverride: njk,md
---
```

A tělo:
```
## Salvátor, <adresa>

**Program:**


**Sólisté:**


**Diriguje:** Michael Housa
```

- [ ] **Step 3: Ověřit Eleventy build (může spustit agent)**

```bash
npx @11ty/eleventy --dryrun
```

Expected: build proběhne bez chyb. Testovací stránka se vyrenderuje (nebudeme ji deployovat, jen ověříme, že parser nezhavaroval).

- [ ] **Step 4: MANUÁL — Smazat testovací soubor**

```bash
git status --short    # ověř, že existuje untracked koncerty/YYYY-MM-DD-salvator.md
rm koncerty/YYYY-MM-DD-salvator.md
```

(Nepoužíváme `git rm`, protože soubor zatím není v gitu.)

---

## Task 6: Smoke test — nový koncert bez PDF

- [ ] **Step 1: MANUÁL — Vytvořit další testovací soubor v `koncerty/`**

Uživatel: pravý klik na `koncerty/` → `New note`. Vyplň prompty:
1. Název → `Testovací koncert bez PDF`
2. Místo → `Test Misto`
3. Datum → default
4. PDF pozvánka? → vyber `ne`

- [ ] **Step 2: MANUÁL — Ověřit, že `pdf:` řádek je zakomentovaný**

Soubor: `koncerty/YYYY-MM-DD-test-misto.md`

Frontmatter musí obsahovat:
```yaml
# pdf: "YYYY-MM-DD-test-misto.pdf"
```

(s `#` na začátku, tj. zakomentovaný řádek — odpovídá stylu v `2026-06-02-profesni-dum.md`).

- [ ] **Step 3: MANUÁL — Smazat testovací soubor**

```bash
rm koncerty/YYYY-MM-DD-test-misto.md
```

---

## Task 7: Smoke test — nový interpret s českou diakritikou

- [ ] **Step 1: MANUÁL — Vytvořit nový soubor v `interpreti/`**

Uživatel: pravý klik na `interpreti/` → `New note`. Vyplň prompty:
1. Jméno → `Žofie Říhová`
2. Nástroj → `klavír`

- [ ] **Step 2: MANUÁL — Ověřit přejmenování a slug**

Soubor musí být přejmenován na `interpreti/zofie-rihova.md`.

Frontmatter:
```yaml
---
name: "Žofie Říhová"
instrument: "klavír"
slug: "zofie-rihova"
photo: "zofie-rihova"
tags: "interpreti"
layout: "interpret.njk"
templateEngineOverride: njk,md
---
```

**Kritické:** žádné diakritické znaky ve slugu (`ž → z`, `ř → r`, `í → i`, `á → a`). Pokud najdeš nějaký, slugify regex nefunguje správně — viz Sekce 5 spec, zkontroluj že regex `/[̀-ͯ]/g` v šabloně obsahuje literální spojovací znaky U+0300–U+036F (ne escape sekvenci).

- [ ] **Step 3: Ověřit Eleventy build**

```bash
npx @11ty/eleventy --dryrun
```

Expected: build OK, nová stránka interpreta se vyrenderuje na adrese odpovídající slugu.

- [ ] **Step 4: MANUÁL — Smazat testovací soubor**

```bash
rm interpreti/zofie-rihova.md
```

---

## Task 8: Finální ověření a dokumentace zadání

- [ ] **Step 1: MANUÁL — Ověřit, že `git status` je čistý**

```bash
git status --short
```

Expected: žádné untracked nebo modifikované soubory (kromě případných `.obsidian/workspace.json` změn, které vznikají běžným používáním Obsidianu — ty můžeš ignorovat / nepushovat).

- [ ] **Step 2: Aktualizovat zadání jako splněné**

Modifikovat `docs/zadani/obsidian.md` — přidat na konec poznámku:

```markdown

---

**Implementováno 2026-05-16:**
- Šablony v `_templates/koncert.md` a `_templates/interpret.md`.
- Templater nakonfigurován v `.obsidian/plugins/templater-obsidian/data.json`.
- Spec: `docs/superpowers/specs/2026-05-16-obsidian-admin-design.md`.
- Plan: `docs/superpowers/plans/2026-05-16-obsidian-admin.md`.
```

(Pozn.: zadání obsahuje typo `_temptales` — implementace používá `_templates` jako standardní pojmenování. Schválené v brainstormingu.)

- [ ] **Step 3: Commit**

```bash
git add docs/zadani/obsidian.md
git commit -m "docs: mark Obsidian admin task as implemented"
```

- [ ] **Step 4: MANUÁL — Push do GitHubu (volitelné, na rozhodnutí uživatele)**

```bash
git push origin main
```

---

## Hotovo — jak používat výsledek

Po implementaci:

**Nový koncert:**
1. V Obsidianu: pravý klik na `koncerty/` → `New note`.
2. Vyplň 4 prompty.
3. Doplň ručně: `<adresa>`, program, sólisty, pole `interpreti` (např. `["michael-housa","leos-cepicky"]`).
4. Pokud `pdf=ano`: ulož PDF do `koncerty/pdf/{název-souboru}.pdf`.
5. Commit přes obsidian-git plugin (Ctrl/Cmd+P → "Commit and push").

**Nový interpret:**
1. V Obsidianu: pravý klik na `interpreti/` → `New note`.
2. Vyplň 2 prompty.
3. Doplň bio do těla souboru.
4. Ulož fotku do `interpreti/img/{slug}.jpg`.
5. Commit přes obsidian-git plugin.
