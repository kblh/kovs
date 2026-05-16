# Obsidian admin pro web KOVS — design

**Datum:** 2026-05-16
**Status:** Schváleno k implementaci

## Cíl

Umožnit správu obsahu webu (koncerty, interpreti) přímo v Obsidianu místo ruční editace markdown souborů. Při vytvoření nového souboru ve složce `koncerty/` nebo `interpreti/` Obsidian automaticky aplikuje příslušnou šablonu, vyplní frontmatter podle existujících konvencí a přejmenuje soubor podle slug pravidel.

## Kontext

Web KOVS je statický (Eleventy + Tailwind). Obsah žije v gitu jako markdown:
- `koncerty/YYYY-MM-DD-{slug}.md` — frontmatter s `title`, `place`, `date`, `tags`, `layout`, volitelně `pdf` a `interpreti`.
- `interpreti/{slug}.md` — frontmatter s `name`, `instrument`, `slug`, `photo`, `tags`, `layout`.

Obsidian vault je už inicializovaný (`.obsidian/` s pluginy `templater-obsidian` a `obsidian-git`). PDF přihlášky a fotky interpretů se ukládají do `koncerty/pdf/` a `interpreti/img/`.

## Architektura

### Komponenta 1: Složka `_templates/`

Nová složka v rootu repa obsahuje Templater šablony. Prefix `_` ji odděluje od webového obsahu, ale Eleventy ji neignoruje automaticky — proto se přidá řádek do `.eleventyignore`.

**Soubory:**
- `_templates/koncert.md` — šablona pro nový koncert
- `_templates/interpret.md` — šablona pro nového interpreta

### Komponenta 2: Templater plugin config

Soubor `.obsidian/plugins/templater-obsidian/data.json` (commitnutý do gitu):

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

Klíčové chování: `trigger_on_file_creation: true` + `enable_folder_templates: true` znamená, že jakýkoliv nový soubor v dané složce automaticky dostane obsah šablony.

### Komponenta 3: Šablona pro koncert

Soubor `_templates/koncert.md`:

```
<%*
const title = await tp.system.prompt("Název koncertu (program)", "");
const place = await tp.system.prompt("Místo (Profesní dům, Salvátor, …)", "");
const date = await tp.system.prompt("Datum (YYYY-MM-DD)", tp.date.now("YYYY-MM-DD"));
const hasPdf = await tp.system.suggester(["ne","ano"], [false,true], false, "PDF pozvánka?");

const slugify = s => s.normalize("NFD")
  .replace(/[̀-ͯ]/g, "")              // range U+0300–U+036F = combining diacritical marks
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
```

**Workflow:**
1. Uživatel v Obsidianu vytvoří `Untitled.md` ve složce `koncerty/`.
2. Templater vyvolá 4 prompty (title, place, date, pdf).
3. Soubor se přejmenuje na `YYYY-MM-DD-{slug}.md`.
4. Frontmatter se vyplní; pokud `pdf=ne`, řádek `pdf:` je zakomentovaný (konzistentní se současným stylem v existujících souborech).
5. Pole `interpreti` zůstane prázdné — uživatel doplní ručně.

### Komponenta 4: Šablona pro interpreta

Soubor `_templates/interpret.md`:

```
<%*
const name = await tp.system.prompt("Jméno (Křestní Příjmení)", "");
const instrument = await tp.system.prompt("Nástroj/role (klavír, housle, dirigent, …)", "");

const slugify = s => s.normalize("NFD")
  .replace(/[̀-ͯ]/g, "")              // range U+0300–U+036F = combining diacritical marks
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


```

**Workflow:**
1. Uživatel vytvoří `Untitled.md` ve složce `interpreti/`.
2. Templater se zeptá na jméno a nástroj.
3. Soubor se přejmenuje na `{slug}.md`.
4. Frontmatter je vyplněn, body zůstane prázdné — uživatel doplní bio.
5. Foto se musí samostatně uložit do `interpreti/img/{slug}.jpg` (mimo Obsidian).

### Komponenta 5: Slugifikace

Pravidla:
1. Unicode NFD normalizace (rozloží `á` na `a` + spojovací akut).
2. Odstranění všech spojovacích znaků (`̀-ͯ`).
3. Lowercase.
4. Vše co není `[a-z0-9]` → `-`.
5. Trim pomlček na začátku/konci.

**Pokrytí češtiny:** všechny standardní znaky (`á č ď é ě í ň ó ř š ť ú ů ý ž`) se rozkládají správně. Jedinou nestandardní entitou by mohlo být něco mimo NFKC základ — pro typická česká jména a názvy míst toto stačí.

**Příklady:**
- `Kostel ČCE U Salvátora` → `kostel-cce-u-salvatora`
- `Bronislava Smržová` → `bronislava-smrzova`
- `Miroslav Sekera` → `miroslav-sekera`

### Komponenta 6: `.eleventyignore`

Současný stav:
```
docs/superpowers/
```

Změna:
```
docs/superpowers/
_templates/
```

## Datový tok

```
[Obsidian: Nový soubor v koncerty/]
       │
       ▼
[Templater plugin]
       │  čte: _templates/koncert.md
       │  spustí: prompts + slugify + tp.file.rename
       ▼
[Soubor: koncerty/YYYY-MM-DD-slug.md s frontmatterem]
       │
       ▼
[Uživatel doplní program/sólisty/interpreti v Obsidianu]
       │
       ▼
[Obsidian-git plugin: commit & push] (manuální trigger)
       │
       ▼
[GitHub Pages → Eleventy build → publish]
```

## Zpracování chyb

| Situace | Chování |
|---|---|
| Slug už existuje (duplicitní soubor) | Obsidian/Templater `tp.file.rename` zfailne tiše; uživatel uvidí původní `Untitled.md` s vyplněným obsahem. Manuální resoluce. |
| Uživatel zruší prompt | Templater zaloguje chybu, soubor zůstane s defaultním obsahem. |
| Uživatel zadá neplatné datum | Šablona datum nevaliduje; uloží se jak zadané. Případné chyby se odhalí při Eleventy buildu. |

Validace data ani slug unikátnosti záměrně neřešíme — režie není adekvátní frekvenci tvorby obsahu (cca 5–10 koncertů ročně, několik interpretů ročně).

## Testovací strategie

Manuální smoke test po implementaci:

1. **Koncert s PDF:** Vytvořit nový soubor v `koncerty/`, vyplnit „Testovací koncert" / „Salvátor" / dnešní datum / pdf=ano. Ověřit:
   - Soubor se přejmenoval na `YYYY-MM-DD-salvator.md`.
   - Frontmatter obsahuje aktivní řádek `pdf: "YYYY-MM-DD-salvator.pdf"`.
   - `npm run start` build proběhne bez chyb a nová stránka se vyrenderuje.
2. **Koncert bez PDF:** Stejné, ale pdf=ne. Řádek `pdf:` musí být zakomentovaný.
3. **Interpret:** Vytvořit nový soubor v `interpreti/`, vyplnit „Test Interpretovič" / „klavír". Ověřit:
   - Soubor se přejmenoval na `test-interpretovic.md`.
   - `slug` ve frontmatteru = `test-interpretovic`.
   - `photo` = `test-interpretovic`.
4. **České znaky:** Místo = „Žďár nad Sázavou" → slug `zdar-nad-sazavou`. Jméno = „Bronislava Smržová" → slug `bronislava-smrzova`.
5. **Eleventy ignore:** Po vytvoření `_templates/` ověřit, že `_site/_templates/` neexistuje po buildu.

Po smoke testech: commit, push, ověřit deploy na GitHub Pages.

## Mimo scope (YAGNI)

- Šablony pro fotogalerie / historii / kontakt — statický obsah, řeší se ručně.
- Auto-doplňování pole `interpreti` v šabloně koncertu (komplexní logika, jejíž režie nevyváží úsporu).
- Auto-commit přes obsidian-git (uživatel commituje manuálně).
- Generování image thumbnailů.
- Validace duplicitních slugů.
- Šablony pro úpravu existujících souborů (Templater folder templates triggerují pouze při vytvoření).

## Otevřené body pro implementační plán

1. Vytvořit `_templates/` se dvěma šablonami.
2. Vytvořit / přepsat `.obsidian/plugins/templater-obsidian/data.json` s folder templates konfigurací (currently nelze ověřit obsah — možná existuje s defaulty).
3. Upravit `.eleventyignore`.
4. Manuální smoke testy v Obsidianu.
5. Commit do gitu.
