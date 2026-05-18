# Aktuality — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přidat na web kolekci Aktuality s oknem viditelnosti (`date-from` / `date-to`), listingem, detail-stránkami, sekcí na homepage (poslední 3) a podmíněným odkazem v hlavním menu.

**Architecture:** Auto-kolekce `aktuality` (přes `tags: "aktuality"`) drží zdrojový obsah. Custom kolekce `aktualityActive` v `eleventy.config.js` filtruje podle dnešního data a slouží jako jediný zdroj pro listing, homepage sekci i podmínku zobrazení menu (single source of truth). Šablony `_includes/aktualita.njk` (detail) a `_includes/aktuality.njk` (listing) napodobují vzor `concert.njk` / `interpreti.njk`.

**Tech Stack:** Eleventy 3.x (Nunjucks templates), Luxon (přes existující date filter), Tailwind CSS 4.x utility classes, Alpine.js (nedotčeno). Obsidian + Templater pro autorský workflow.

**Spec:** `docs/superpowers/specs/2026-05-18-aktuality-design.md`

**Dnešní datum (pro testy edge-case viditelnosti):** 2026-05-18

**Poznámka k „TDD":** Projekt nemá unit test framework pro šablony — „test" pro každý krok je úspěšný `npx @11ty/eleventy` build + grep na vyrenderovaném HTML v `_site/`. Verifikační kroky používají `grep`/`ls` na výstupních souborech, aby se ověřilo, že očekávaný markup vznikl.

---

## File Structure

| Soubor | Akce | Odpovědnost |
|---|---|---|
| `eleventy.config.js` | **Modify** | Přidat `addCollection("aktualityActive", …)` s filtrem podle dnešního data |
| `aktuality/aktuality.11tydata.js` | **Create** | Adresářový data soubor s `eleventyComputed` aliasy `dateFrom`/`dateTo` (Nunjucks nepřistupuje k hyphenated klíčům jako identifiers) |
| `aktuality/index.md` | **Create** | Listing entry-point (`layout: aktuality.njk`, `tags: nav`) |
| `aktuality/2018-06-25-hledame-nove-posily.md` | **Create** | Ukázková aktualita (`tags: aktuality`) |
| `_includes/aktualita.njk` | **Create** | Standalone HTML šablona detailu (vzor `concert.njk`) |
| `_includes/aktuality.njk` | **Create** | Standalone HTML šablona listingu (vzor `interpreti.njk`) |
| `index.njk` | **Modify** | Vložit sekci „Aktuality" mezi „Následující koncert" a „Poslechnout" |
| `_includes/navigation.njk` | **Modify** | Přidat statický odkaz „Aktuality" do desktop i mobile menu |
| `_templates/aktualita.md` | **Create** | Templater scaffold pro novou aktualitu |
| `.obsidian/plugins/templater-obsidian/data.json` | **Modify** | Folder mapping `aktuality` → `_templates/aktualita.md` |

---

## Task 1: Custom kolekce `aktualityActive` v `eleventy.config.js`

Přidání filtrované kolekce. V tomto kroku ještě nejsou žádné aktuality, takže `aktualityActive` bude prázdná — to je v pořádku, build nesmí spadnout.

**Files:**
- Modify: `eleventy.config.js`

- [ ] **Step 1: Otevři `eleventy.config.js` a najdi blok `addCollection("nextConcert", …)`**

Hledej řádky obsahující `eleventyConfig.addCollection("nextConcert"`. Pod tento blok přidáme novou kolekci.

- [ ] **Step 2: Přidej `aktualityActive` kolekci hned za `nextConcert`**

Vlož **pod** uzavírací `});` definice `nextConcert` (a před `return { … };`) tento blok:

```js
  // Aktivní aktuality: date-from <= dnes <= date-to (nebo bez date-to), seřazeno sestupně
  eleventyConfig.addCollection("aktualityActive", (api) => {
    const today = DateTime.now().toISODate();
    return api
      .getFilteredByTag("aktuality")
      .filter((item) => {
        const from = item.data["date-from"];
        const to = item.data["date-to"];
        if (!from || from > today) return false;
        if (to && to < today) return false;
        return true;
      })
      .sort((a, b) =>
        (b.data["date-from"] || "").localeCompare(a.data["date-from"] || "")
      );
  });
```

Pozn.: `DateTime` je už importováno na začátku souboru (`const { DateTime } = require("luxon");`). Žádný nový import není potřeba.

- [ ] **Step 3: Build neselže (žádný obsah, kolekce je prázdná)**

Run: `npx @11ty/eleventy`
Expected: build skončí bez chyb (kolekce `aktualityActive` neexistuje žádné položky, ale to nevadí).

- [ ] **Step 4: Commit**

```bash
git add eleventy.config.js
git commit -m "feat: add aktualityActive collection with visibility-window filter"
```

---

## Task 2: Adresářový data soubor + detail-šablona + ukázková aktualita

Vytvoříme adresářový data soubor (computed aliases pro hyphenated klíče), jeden ukázkový obsah a jeho detail-šablonu. Po buildu se musí vyrenderovat `_site/aktuality/2018-06-25-hledame-nove-posily/index.html`.

**Files:**
- Create: `aktuality/aktuality.11tydata.js`
- Create: `_includes/aktualita.njk`
- Create: `aktuality/2018-06-25-hledame-nove-posily.md`

- [ ] **Step 0: Vytvoř adresářový data soubor `aktuality/aktuality.11tydata.js`**

```js
module.exports = {
  eleventyComputed: {
    dateFrom: (data) => data["date-from"],
    dateTo: (data) => data["date-to"],
  },
};
```

Tento soubor přidá ke každé položce v adresáři `aktuality/` automaticky vlastnosti `dateFrom` a `dateTo` (mirroring kebab-case originálů). Šablony pak používají čitelnější `{{ dateFrom }}` místo bracket notation.

Pozn.: V `eleventy.config.js` (Task 1) i nadále filtruje přes `item.data["date-from"]` — JavaScript bracket notation funguje vždy.

- [ ] **Step 1: Vytvoř ukázkový obsah `aktuality/2018-06-25-hledame-nove-posily.md`**

```markdown
---
title: "Hledáme nové posily"
date-from: "2018-06-25"
date-to: ""
tags: "aktuality"
layout: "aktualita.njk"
templateEngineOverride: njk,md
---

Hledáme posily do houslové sekce. Pokud máš zájem zahrát si s námi, ozvi se přes kontaktní formulář.
```

Pozn.: `date-to: ""` znamená „bez horního omezení" — aktualita je aktivní od 2018-06-25 dodnes.

- [ ] **Step 2: Vytvoř detail-šablonu `_includes/aktualita.njk`**

```njk
<!DOCTYPE html>
<html lang="cs">
  <head>
    <title>{{ title }} | Komorní orchestr Vlasty Škampové</title>
    {% include "_head.njk" %}
    <script defer src="{{ baseUrl }}/js/alpine.js?v={{ version or '1' }}"></script>
  </head>
  <body>

    {% include "navigation.njk" %}

    <article>

      {# ── HEADER ──────────────────────────────────────────────── #}
      <header class="border-b border-foreground/15">
        <div class="max-w-container-2xl mx-auto px-8 lg:px-16 py-8 lg:py-8">
          <div class="lg:grid lg:grid-cols-12 lg:gap-8 items-end">
            <div class="lg:col-start-2 lg:col-span-9">
              <p class="u-label mb-6 flex items-center gap-3">
                <span class="u-line"></span>
                Aktualita
              </p>
              {% if dateFrom %}
                <time class="text-muted text-sm uppercase tracking-time block mb-4"
                      datetime="{{ dateFrom }}">
                  {{ dateFrom | date }}
                </time>
              {% endif %}
              <h1 class="font-heading text-h1 leading-heading tracking-tight mb-6">
                {{ title }}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {# ── CONTENT ─────────────────────────────────────────────── #}
      {% if content %}
        <section class="border-b border-foreground/15">
          <div class="max-w-container-2xl mx-auto px-8 lg:px-16 py-8 lg:py-8">
            <div class="lg:grid lg:grid-cols-12 lg:gap-8">
              <div class="lg:col-start-2 lg:col-span-8 prose leading-relaxed space-y-5">
                {{ content | safe }}
              </div>
            </div>
          </div>
        </section>
      {% endif %}

    </article>
    {% include "footer.njk" %}
  </body>
</html>
```

Pozn.: V Nunjucks šabloně vstupují všechna data z frontmatteru přímo do scope (např. `title`, `content`), ale klíče s pomlčkou (`date-from`) nelze přistupovat jako identifiers (Nunjucks by je parsoval jako odčítání). Proto se používají camelCase aliasy `dateFrom` / `dateTo` z adresářového data souboru (Step 0).

- [ ] **Step 3: Build**

Run: `npx @11ty/eleventy`
Expected: build proběhne bez chyb.

- [ ] **Step 4: Ověř, že detail-stránka vznikla**

Run: `ls _site/aktuality/2018-06-25-hledame-nove-posily/index.html`
Expected: soubor existuje.

- [ ] **Step 5: Ověř obsah detail-stránky**

Run: `grep -c "Hledáme nové posily" _site/aktuality/2018-06-25-hledame-nove-posily/index.html`
Expected: alespoň `2` (titulek v `<title>` a v `<h1>`).

Run: `grep -c "25. 6. 2018" _site/aktuality/2018-06-25-hledame-nove-posily/index.html`
Expected: `1` (datum vyformátované přes `date` filter).

Run: `grep -c "houslové sekce" _site/aktuality/2018-06-25-hledame-nove-posily/index.html`
Expected: `1` (markdown body se vyrenderoval).

Run: `grep -c '>Aktualita<' _site/aktuality/2018-06-25-hledame-nove-posily/index.html`
Expected: `1` (u-label „Aktualita").

- [ ] **Step 6: Commit**

```bash
git add aktuality/aktuality.11tydata.js _includes/aktualita.njk aktuality/2018-06-25-hledame-nove-posily.md
git commit -m "feat: add aktualita detail template, computed-data aliases, sample entry"
```

---

## Task 3: Listing šablona `_includes/aktuality.njk` + `aktuality/index.md`

**Files:**
- Create: `aktuality/index.md`
- Create: `_includes/aktuality.njk`

- [ ] **Step 1: Vytvoř `aktuality/index.md`**

```markdown
---
title: "Aktuality"
layout: "aktuality.njk"
tags: "nav"
templateEngineOverride: njk
---
```

Pozn.: `tags: "nav"` je sémantický marker (NEvkládá tuto stránku do `collections.aktuality`, protože tag se liší). Šablona obsahuje veškerý markup, takže body MD souboru je prázdný.

- [ ] **Step 2: Vytvoř `_includes/aktuality.njk`**

```njk
<!DOCTYPE html>
<html lang="cs">
  <head>
    <title>{{ title }} | Komorní orchestr Vlasty Škampové</title>
    {% include "_head.njk" %}
    <script defer src="{{ baseUrl }}/js/alpine.js?v={{ version or '1' }}"></script>
  </head>
  <body>

    {% include "navigation.njk" %}

    <article>

      {# ── HEADER ──────────────────────────────────────────────── #}
      <header class="border-b border-foreground/15">
        <div class="max-w-container-2xl mx-auto px-8 lg:px-16 py-16 lg:py-24">
          <div class="lg:grid lg:grid-cols-12 lg:gap-8 items-end">
            <div class="lg:col-start-2 lg:col-span-9">
              <h1 class="font-heading text-h1 leading-heading tracking-tight">
                {{ title }}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {# ── LIST ────────────────────────────────────────────────── #}
      <section class="border-b border-foreground/15">
        <div class="max-w-container-2xl mx-auto px-8 lg:px-16 py-16 lg:py-24">
          <div class="lg:grid lg:grid-cols-12 lg:gap-8">
            <div class="lg:col-start-2 lg:col-span-10">

              <p class="u-label mb-8 flex items-center gap-3">
                <span class="u-line"></span>
                Přehled aktualit
              </p>

              <div class="divide-y divide-foreground/10">
                {% for item in collections.aktualityActive %}
                  <div class="group py-6 first:pt-0">
                    <a href="{{ baseUrl }}{{ item.url }}"
                       class="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-2 hover:text-accent transition-colors duration-500 -mx-4 px-4">
                      <h2 class="font-heading text-2xl lg:text-3xl group-hover:text-accent transition-colors duration-500">
                        {{ item.data.title }}
                      </h2>
                      {% if item.data.dateFrom %}
                        <time class="text-muted text-micro uppercase tracking-time shrink-0"
                              datetime="{{ item.data.dateFrom }}">
                          {{ item.data.dateFrom | date }}
                        </time>
                      {% endif %}
                    </a>
                  </div>
                {% endfor %}
              </div>

            </div>
          </div>
        </div>
      </section>

    </article>
    {% include "footer.njk" %}
  </body>
</html>
```

Pozn.: Iteruje `collections.aktualityActive` — ne `collections.aktuality`. Tím se v listingu zobrazí jen aktivní aktuality (filtr je aplikován na jednom místě — v `eleventy.config.js`). U položek v kolekci přistupujeme přes `item.data.dateFrom` (camelCase alias z `aktuality.11tydata.js` — eleventyComputed se aplikuje i na položky v kolekcích).

- [ ] **Step 3: Build**

Run: `npx @11ty/eleventy`
Expected: bez chyb.

- [ ] **Step 4: Ověř, že listing vznikl**

Run: `ls _site/aktuality/index.html`
Expected: soubor existuje.

- [ ] **Step 5: Ověř, že listing obsahuje ukázkovou aktualitu**

Run: `grep -c "Hledáme nové posily" _site/aktuality/index.html`
Expected: alespoň `2` (titulek stránky „Aktuality" v `<title>` plus odkaz v listingu).

Run: `grep -c "Přehled aktualit" _site/aktuality/index.html`
Expected: `1`.

Run: `grep -c 'href=".*/aktuality/2018-06-25-hledame-nove-posily/"' _site/aktuality/index.html`
Expected: `1`.

Run: `grep -c "25. 6. 2018" _site/aktuality/index.html`
Expected: `1`.

- [ ] **Step 6: Commit**

```bash
git add aktuality/index.md _includes/aktuality.njk
git commit -m "feat: add aktuality listing page and template"
```

---

## Task 4: Sekce „Aktuality" na homepage v `index.njk`

Vložíme novou sekci **mezi** „Následující koncert" a „Poslechnout". Sekce se zobrazí jen pokud je nějaká aktivní aktualita.

**Files:**
- Modify: `index.njk`

- [ ] **Step 1: Najdi v `index.njk` konec sekce „Následující koncert"**

Konec sekce končí řádkem `  {% endif %}` na řádku 82 (po `</section>` a před komentářem `{# ── VIDEO ── #}`).

- [ ] **Step 2: Vlož novou sekci `Aktuality` hned za `{% endif %}` „Následujícího koncertu" a před `{# ── VIDEO ── #}`**

Vlož přesně tento blok (s ponechanou prázdnou řádkou před a za):

```njk
  {# ── AKTUALITY ────────────────────────────────────────────────── #}
  {% if collections.aktualityActive.length %}
    <section class="border-b border-foreground/15">
      <div class="max-w-container-2xl mx-auto px-8 lg:px-16 py-16 lg:py-16">
        <div class="lg:grid lg:grid-cols-12 lg:gap-8">
          <div class="lg:col-start-2 lg:col-span-10">

            <p class="u-label mb-8 flex items-center gap-3">
              <span class="u-line"></span>
              Aktuality
            </p>

            <div class="divide-y divide-foreground/10">
              {% for item in collections.aktualityActive | slice(0, 3) %}
                <div class="group py-6 first:pt-0">
                  <a href="{{ baseUrl }}{{ item.url }}"
                     class="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-2 hover:text-accent transition-colors duration-500 -mx-4 px-4">
                    <h2 class="font-heading text-2xl lg:text-3xl group-hover:text-accent transition-colors duration-500">
                      {{ item.data.title }}
                    </h2>
                    {% if item.data.dateFrom %}
                      <time class="text-muted text-micro uppercase tracking-time shrink-0"
                            datetime="{{ item.data.dateFrom }}">
                        {{ item.data.dateFrom | date }}
                      </time>
                    {% endif %}
                  </a>
                </div>
              {% endfor %}
            </div>

            <div class="mt-10">
              <a href="{{ baseUrl }}/aktuality/" class="c-button">Všechny aktuality</a>
            </div>

          </div>
        </div>
      </div>
    </section>
  {% endif %}

```

Pozn.: `{% for item in collections.aktualityActive | slice(0, 3) %}` — `slice` filter v Nunjucks vrací pole (Eleventy doplňuje univerzální `slice`). Pokud by `slice` nefungoval, alternativa je `{% for item in collections.aktualityActive %}{% if loop.index <= 3 %} … {% endif %}{% endfor %}`.

- [ ] **Step 3: Build**

Run: `npx @11ty/eleventy`
Expected: bez chyb.

- [ ] **Step 4: Ověř, že homepage obsahuje sekci Aktuality s ukázkou**

Run: `grep -c '>Aktuality<' _site/index.html`
Expected: alespoň `1` (u-label „Aktuality" — pokud Task 5 ještě neproběhl, menu link tu ještě není; po Tasku 5 to bude `2`).

Run: `grep -c "Hledáme nové posily" _site/index.html`
Expected: `1`.

Run: `grep -c "Všechny aktuality" _site/index.html`
Expected: `1` (CTA button).

Run: `grep -c 'href=".*/aktuality/2018-06-25-hledame-nove-posily/"' _site/index.html`
Expected: `1`.

- [ ] **Step 5: Commit**

```bash
git add index.njk
git commit -m "feat: add aktuality section to homepage"
```

---

## Task 5: Odkaz „Aktuality" do hlavního menu

Přidat statický odkaz mezi „Domů" a „Koncerty", gating přes `{% if collections.aktualityActive.length %}`. Změnu provést **na dvou místech** v `navigation.njk` — desktop ul (řádky ~24–61) a mobile menu (řádky ~77–117).

**Files:**
- Modify: `_includes/navigation.njk`

- [ ] **Step 1: Najdi v `navigation.njk` desktop blok s odkazem „Domů"**

Hledej `<a href="{{ baseUrl }}/"` první výskyt — je to první `<li>` v `<ul class="hidden lg:flex …">`. Končí `</li>` po `Domů`. Hned za tímto `</li>` vlož:

```njk
        {% if collections.aktualityActive.length %}
          <li>
            <a href="{{ baseUrl }}/aktuality/"
               class="text-sm uppercase tracking-label font-medium text-navigation hover:text-accent transition-colors duration-500
                      {% if page.url == '/aktuality/' %}text-accent{% endif %}">
              Aktuality
            </a>
          </li>
        {% endif %}
```

Výsledné pořadí v desktop menu: Domů → **Aktuality** → Koncerty → Interpreti → (pages).

- [ ] **Step 2: Najdi v `navigation.njk` mobile blok s odkazem „Domů"**

Druhý výskyt `<a href="{{ baseUrl }}/"` je v mobile menu `<ul class="max-w-container-2xl mx-auto px-8 py-4 flex flex-col gap-1">`. Hned za `</li>` po `Domů` vlož:

```njk
      {% if collections.aktualityActive.length %}
        <li>
          <a href="{{ baseUrl }}/aktuality/"
             @click="open = false"
             class="block py-2 text-sm uppercase tracking-label font-medium text-navigation hover:text-accent transition-colors duration-500
                    {% if page.url == '/aktuality/' %}text-accent{% endif %}">
            Aktuality
          </a>
        </li>
      {% endif %}
```

Rozdíly oproti desktop variantě: `block py-2` místo žádných display tříd + `@click="open = false"` pro zavření mobile menu.

- [ ] **Step 3: Build**

Run: `npx @11ty/eleventy`
Expected: bez chyb.

- [ ] **Step 4: Ověř, že homepage menu obsahuje odkaz na Aktuality**

Run: `grep -c '/aktuality/' _site/index.html`
Expected: alespoň `2` (menu link 1× desktop + 1× mobile + případně další odkazy ze sekce na homepage). Spíše `4+`: desktop menu link, mobile menu link, sekční odkaz na detail, CTA „Všechny aktuality" tlačítko.

Run: `grep -c '>Aktuality<' _site/index.html`
Expected: alespoň `3` (desktop menu link + mobile menu link + u-label v sekci).

- [ ] **Step 5: Ověř, že na podstránce (např. koncerty) je menu odkaz aktivní**

Run: `grep -c 'href=".*/aktuality/"' _site/koncerty/index.html`
Expected: alespoň `2` (desktop + mobile menu).

- [ ] **Step 6: Ověř, že na stránce `/aktuality/` má menu link `text-accent` (aktivní stav)**

Run: `grep -c 'text-accent">[[:space:]]*Aktuality' _site/aktuality/index.html`
Expected: alespoň `2` (desktop + mobile, oba mají aktivní class kvůli `page.url == '/aktuality/'`).

- [ ] **Step 7: Commit**

```bash
git add _includes/navigation.njk
git commit -m "feat: add Aktuality link to main menu (desktop + mobile)"
```

---

## Task 6: Templater šablona a Obsidian folder mapping

Pro autorský workflow v Obsidianu. Nemá vliv na build webu — jen na DX.

**Files:**
- Create: `_templates/aktualita.md`
- Modify: `.obsidian/plugins/templater-obsidian/data.json`

- [ ] **Step 1: Vytvoř `_templates/aktualita.md`**

```markdown
<%*
const title = await tp.system.prompt("Titulek aktuality", "");
const dateFrom = await tp.system.prompt("Date-from (YYYY-MM-DD)", tp.date.now("YYYY-MM-DD"));
const dateTo = await tp.system.prompt("Date-to (YYYY-MM-DD nebo prázdné)", "");

const slugify = s => s.normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const slug = slugify(title);
const filename = `${dateFrom}-${slug}`;
await tp.file.rename(filename);
-%>
---
title: "<% title %>"
date-from: "<% dateFrom %>"
date-to: "<% dateTo %>"
tags: "aktuality"
layout: "aktualita.njk"
templateEngineOverride: njk,md
---

```

- [ ] **Step 2: Otevři `.obsidian/plugins/templater-obsidian/data.json` a přidej folder mapping**

Současný obsah `folder_templates`:
```json
"folder_templates": [
  { "folder": "koncerty", "template": "_templates/koncert.md" },
  { "folder": "interpreti", "template": "_templates/interpret.md" }
],
```

Nahraď za:
```json
"folder_templates": [
  { "folder": "koncerty", "template": "_templates/koncert.md" },
  { "folder": "interpreti", "template": "_templates/interpret.md" },
  { "folder": "aktuality", "template": "_templates/aktualita.md" }
],
```

- [ ] **Step 3: Ověř, že JSON je validní**

Run: `node -e "JSON.parse(require('fs').readFileSync('.obsidian/plugins/templater-obsidian/data.json','utf8'))"`
Expected: žádný výstup, žádná chyba (validní JSON).

- [ ] **Step 4: Ověř, že `aktualita.md` je v `.eleventyignore`-kompatibilním stavu**

Soubor `.eleventyignore` v repu by měl pokrývat `_templates/`, aby Eleventy ignoroval Templater scaffold (jinak by se snažil renderovat `<% … %>` jako Nunjucks).

Run: `cat .eleventyignore`
Expected: obsahuje `_templates/` nebo `_templates`. Pokud ne, přidat to do `.eleventyignore`:
```
_templates/
```

- [ ] **Step 5: Build neselže kvůli Templater syntaxi**

Run: `npx @11ty/eleventy`
Expected: bez chyb. `_templates/aktualita.md` se v `_site/` neobjeví.

Run: `ls _site/_templates 2>/dev/null && echo PROBLEM || echo OK`
Expected: `OK`.

- [ ] **Step 6: Commit**

```bash
git add _templates/aktualita.md .obsidian/plugins/templater-obsidian/data.json .eleventyignore
git commit -m "chore: add Templater template and folder mapping for aktuality"
```

(Pokud `.eleventyignore` nebyl měněn, vynech ho z `git add`.)

---

## Task 7: Edge-case verifikace okna viditelnosti

Ověříme, že filtr v `aktualityActive` opravdu skrývá budoucí a prošlé aktuality, a že prázdná aktivní kolekce skryje i menu link i homepage sekci.

**Files:**
- Create (dočasně): `aktuality/2026-12-01-budouci.md`
- Create (dočasně): `aktuality/2024-01-01-prosla.md`
- (a později delete obojí)

- [ ] **Step 1: Vytvoř budoucí aktualitu `aktuality/2026-12-01-budouci.md`**

```markdown
---
title: "Budoucí aktualita (test)"
date-from: "2026-12-01"
date-to: ""
tags: "aktuality"
layout: "aktualita.njk"
templateEngineOverride: njk,md
---

Tato aktualita má date-from v budoucnu, neměla by být vidět.
```

- [ ] **Step 2: Vytvoř prošlou aktualitu `aktuality/2024-01-01-prosla.md`**

```markdown
---
title: "Prošlá aktualita (test)"
date-from: "2024-01-01"
date-to: "2024-12-31"
tags: "aktuality"
layout: "aktualita.njk"
templateEngineOverride: njk,md
---

Tato aktualita má date-to v minulosti, neměla by být vidět.
```

- [ ] **Step 3: Build**

Run: `npx @11ty/eleventy`
Expected: bez chyb. Detail-stránky vzniknou pro **všechny** tři aktuality (kolekce `aktuality` obsahuje vše), ale listing/homepage/menu reagují jen na `aktualityActive`.

- [ ] **Step 4: Ověř, že budoucí a prošlá aktualita NEjsou v listingu**

Run: `grep -c "Budoucí aktualita" _site/aktuality/index.html`
Expected: `0`.

Run: `grep -c "Prošlá aktualita" _site/aktuality/index.html`
Expected: `0`.

Run: `grep -c "Hledáme nové posily" _site/aktuality/index.html`
Expected: alespoň `1` (původní aktivní aktualita zůstává).

- [ ] **Step 5: Ověř, že budoucí a prošlá aktualita NEjsou na homepage**

Run: `grep -c "Budoucí aktualita" _site/index.html`
Expected: `0`.

Run: `grep -c "Prošlá aktualita" _site/index.html`
Expected: `0`.

- [ ] **Step 6: Ověř, že detail-stránky budoucí i prošlé aktuality vznikly (akceptovaný stav)**

Run: `ls _site/aktuality/2026-12-01-budouci/index.html _site/aktuality/2024-01-01-prosla/index.html`
Expected: oba soubory existují. (Spec si to vědomě nechává — viz Risks v `2026-05-18-aktuality-design.md`.)

- [ ] **Step 7: Test prázdné aktivní kolekce — dočasně přejmenuj jedinou aktivní aktualitu**

Run: `mv aktuality/2018-06-25-hledame-nove-posily.md aktuality/2018-06-25-hledame-nove-posily.md.bak`

Run: `npx @11ty/eleventy`
Expected: bez chyb.

- [ ] **Step 8: Ověř, že menu link Aktuality zmizel z homepage**

Run: `grep -c 'href=".*/aktuality/"[^>]*>[[:space:]]*Aktuality' _site/index.html`
Expected: `0` (ani desktop, ani mobile menu nemá link, protože `collections.aktualityActive.length` je 0).

- [ ] **Step 9: Ověř, že homepage sekce Aktuality zmizela**

Run: `grep -c "Všechny aktuality" _site/index.html`
Expected: `0` (CTA tlačítko se nerenderuje).

Run: `grep -c '>Aktuality<' _site/index.html`
Expected: `0`.

- [ ] **Step 10: Obnov původní aktualitu**

Run: `mv aktuality/2018-06-25-hledame-nove-posily.md.bak aktuality/2018-06-25-hledame-nove-posily.md`

- [ ] **Step 11: Smaž testovací budoucí a prošlou aktualitu**

Run: `rm aktuality/2026-12-01-budouci.md aktuality/2024-01-01-prosla.md`

- [ ] **Step 12: Rebuild a final sanity check**

Run: `npx @11ty/eleventy`
Expected: bez chyb.

Run: `grep -c "Hledáme nové posily" _site/index.html`
Expected: `1`.

Run: `grep -c "Hledáme nové posily" _site/aktuality/index.html`
Expected: alespoň `1`.

- [ ] **Step 13: Žádný commit z tohoto tasku**

Run: `git status`
Expected: working tree clean (vše bylo vytvořeno a smazáno; aktuality/index.md, _includes/aktuality.njk, eleventy.config.js atd. už jsou commitnuté z předchozích tasků).

Pokud `git status` ukazuje cokoli netrackovaného nebo modifikovaného: vrátit zpět (zkontroluj, že kroky 10–11 proběhly).

---

## Task 8: Vizuální verifikace v prohlížeči

**Files:**
- (žádné — jen `npm start` a manuální kontrola)

- [ ] **Step 1: Spusť dev server**

Run: `npm start`

Server běží typicky na `http://localhost:8080/`.

- [ ] **Step 2: Kontrola na homepage (`/`)**

V prohlížeči ověř:
- V menu jsou položky: Domů → **Aktuality** → Koncerty → Interpreti.
- Pod sekcí „Následující koncert" (případně pokud žádný nadcházející koncert není, hned pod hero) je sekce „Aktuality" se třemi nejnovějšími položkami (zde 1 — „Hledáme nové posily").
- Pod seznamem je tlačítko „Všechny aktuality".
- Klik na položku → vede na detail.
- Klik na „Všechny aktuality" → vede na `/aktuality/`.

- [ ] **Step 3: Kontrola listingu (`/aktuality/`)**

V prohlížeči ověř:
- Stránka má nadpis „Aktuality" v hero.
- Pod ním u-label „Přehled aktualit".
- Seznam aktualit s titulkem + datem 25. 6. 2018.
- Hover na řádek → barva se mění na accent (smooth transition).
- V menu je „Aktuality" zvýrazněná (active state — text-accent).

- [ ] **Step 4: Kontrola detailu (`/aktuality/2018-06-25-hledame-nove-posily/`)**

V prohlížeči ověř:
- u-label „Aktualita" v hero.
- Datum „25. 6. 2018" malými písmeny pod u-label.
- h1 „Hledáme nové posily".
- Body „Hledáme posily do houslové sekce…".
- Footer i navigace zobrazené.

- [ ] **Step 5: Mobile responsive (zúžit okno na ~375px)**

V prohlížeči ověř:
- Hamburger menu se rozbalí po kliknutí, obsahuje „Aktuality" mezi Domů a Koncerty.
- Klik na „Aktuality" v mobile menu zavře menu a naviguje na listing.
- Homepage sekce Aktuality — titulek a datum se stackují pod sebe (flex-col).

- [ ] **Step 6: Zastav dev server (`Ctrl+C`)**

- [ ] **Step 7: Final build pro produkci**

Run: `npm run build`
Expected: bez chyb. `_site/style.css` se přegeneruje s minifikací.

- [ ] **Step 8: `git status` — finální čistý stav**

Run: `git status`
Expected: working tree clean (vše commitnuté z Tasků 1–6, dočasné soubory z Tasku 7 odstraněny).

---

## Self-Review

**Spec coverage:**
- ✅ Nová kolekce `aktuality` (přes `tags: "aktuality"`) — Task 2 (sample) + Task 3 (listing)
- ✅ Custom kolekce `aktualityActive` v `eleventy.config.js` s filtrem podle dnešního data — Task 1
- ✅ Šablona detailu `aktualita.njk` — Task 2
- ✅ Šablona listingu `aktuality.njk` — Task 3
- ✅ Sekce na homepage mezi „Následující koncert" a „Poslechnout", 3 položky, CTA „Všechny aktuality" — Task 4
- ✅ Skrytí homepage sekce při prázdné aktivní kolekci — Task 4 (`{% if collections.aktualityActive.length %}`) + Task 7 (edge case test)
- ✅ Odkaz v hlavním menu (desktop + mobile) mezi Domů a Koncerty — Task 5
- ✅ Skrytí menu odkazu při prázdné aktivní kolekci — Task 5 + Task 7 (edge case test)
- ✅ Frontmatter `date-from` + `date-to` (bez `date`) — Task 2 sample
- ✅ Filename pattern `YYYY-MM-DD-slug.md` — Task 2 sample
- ✅ Templater šablona `_templates/aktualita.md` — Task 6
- ✅ Obsidian folder mapping — Task 6
- ✅ Edge case: future a expired aktualita se neukáží — Task 7

**Placeholder scan:** Žádné TBD / TODO / „handle edge cases bez kódu". Všechny markup / JSON / JS bloky jsou kompletní.

**Type/identifier consistency:**
- `aktualityActive` (kolekce) — konzistentně použito v Task 1, 3, 4, 5, 7.
- `date-from` / `date-to` (kebab-case) — konzistentně v MD frontmatteru. V JS (eleventy.config.js, .11tydata.js) přes `item.data["date-from"]` / `data["date-from"]`. V Nunjucks šablonách přes camelCase aliasy `dateFrom` / `dateTo` (zdroj: `aktuality.11tydata.js` eleventyComputed).
- `tags: "aktuality"` na obsahu (Tasks 2, 7), `tags: "nav"` na listingu (Task 3) — záměrně rozdílné.
- `layout: "aktualita.njk"` (detail) vs `layout: "aktuality.njk"` (listing) — důsledně rozlišené.
