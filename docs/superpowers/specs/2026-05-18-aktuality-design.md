# Aktuality — design spec

## Účel

Přidat na web kolekci **Aktuality** (krátké novinky) s detailními stránkami, listingem, sekcí na homepage (poslední 3 aktuality) a odkazem v hlavním menu. U každé aktuality je definováno okno viditelnosti (`date-from` → `date-to`), takže novinky se automaticky objevují a mizí podle data.

## Architektura

### Struktura souborů

```
aktuality/
  index.md                        # listing (layout: aktuality.njk, tags: nav)
  2018-06-25-hledame-nove-posily.md   # detail (layout: aktualita.njk, tags: aktuality)
  ...
_includes/
  aktualita.njk                   # template detailu (standalone HTML, jako concert.njk)
  aktuality.njk                   # template listingu (standalone HTML, jako interpreti.njk)
_templates/
  aktualita.md                    # Templater scaffold pro novou aktualitu
```

Filename pattern: `YYYY-MM-DD-<slug>.md`, kde `YYYY-MM-DD` = `date-from` a `<slug>` je kebab-case z titulku bez diakritiky (stejný pattern jako u koncertů).

### Kolekce

Dvě úrovně:

1. **Auto-collection `aktuality`** — vzniká přes `tags: "aktuality"` v MD souborech. Obsahuje *všechny* aktuality bez ohledu na okno viditelnosti. Slouží jako zdroj pro generování detail-stránek.
2. **Custom collection `aktualityActive`** — definovaná v `eleventy.config.js`, filtruje `aktuality` podle dnešního data:
   - `date-from` musí být `<= dnes`
   - `date-to` je prázdný **nebo** `>= dnes`
   - Řazeno sestupně podle `date-from` (nejnovější první).

Tato `aktualityActive` je **jediný zdroj** pro listing, homepage sekci i podmínku zobrazení menu. Tím je splněn požadavek „filtrovat všude stejně".

Pseudokód v `eleventy.config.js`:

```js
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
    .sort((a, b) => (b.data["date-from"] || "").localeCompare(a.data["date-from"] || ""));
});
```

Pole `date-from` / `date-to` jsou v YAML kebab-case (per zadání); v JS (eleventy.config.js) k nim přistupujeme přes `item.data["date-from"]`. V Nunjucks šablonách ale nelze přistupovat k hyphenated klíčům jako identifiers (`date-from` parsuje jako odčítání). Řeším to **adresářovým data souborem** `aktuality/aktuality.11tydata.js`, který přes `eleventyComputed` exponuje camelCase aliasy `dateFrom` / `dateTo`. V šablonách se pak používá `{{ dateFrom }}` (čitelnější než brackety) a YAML zůstává v kebab-case dle zadání.

```js
// aktuality/aktuality.11tydata.js
module.exports = {
  eleventyComputed: {
    dateFrom: (data) => data["date-from"],
    dateTo: (data) => data["date-to"],
  },
};
```

### Detail-stránky a okno viditelnosti

Detailní stránka (`/aktuality/<slug>/`) se buildí pro každý MD soubor s `tags: "aktuality"` *bez ohledu* na okno viditelnosti. Pokud někdo zná přímou URL, dostane se na stránku i u prošlé/budoucí aktuality. To je akceptovatelné — primární cesta (z menu a homepage) odkazy nezobrazí. Tvrdé skrytí (`permalink: false` na základě data) by přidalo komplexitu bez reálné hodnoty pro malou komunitní stránku.

Viz "Risks" — možnost doplnit explicitně v budoucnu.

## Datový model

### Aktualita (`aktuality/YYYY-MM-DD-slug.md`)

```yaml
---
title: "Hledáme nové posily"
date-from: "2018-06-25"
date-to: ""
tags: "aktuality"
layout: "aktualita.njk"
templateEngineOverride: njk,md
---

Hledáme posily do houslové sekce …
```

Pole:

- **title** (povinné) — nadpis aktuality
- **date-from** (povinné) — datum, od kterého se aktualita zobrazuje. Slouží zároveň jako datum vypsané u titulku v listingu a na detailu.
- **date-to** (nepovinné, lze nechat prázdný řetězec `""`) — datum, do kterého se zobrazuje. Prázdné = bez horního omezení.
- **tags: "aktuality"** — zajišťuje zařazení do auto-kolekce.
- **layout: "aktualita.njk"** — detailní šablona.
- **templateEngineOverride: njk,md** — povolit Nunjucks výrazy uvnitř markdownu (konzistentní s ostatními kolekcemi).

Pozn.: pole `date` (eleventy-native) v původním zadání bylo redundantní s `date-from` a vypouští se. Stejně tak v původním zadání bylo `layout: "news.njk"` — sjednocujeme s českou konvencí (`aktualita.njk`).

## Šablony

### `_includes/aktualita.njk` (detail)

Standalone HTML, struktura odpovídá `concert.njk`:

- **HEADER** — `u-label` „Aktualita", datum (`date-from` přes filtr `date`), titulek (h1).
- **CONTENT** — `{{ content | safe }}` v `prose` divu.

Žádná postranní sloupcová grafika, žádné PDF — aktualita je textová.

### `_includes/aktuality.njk` (listing)

Standalone HTML, struktura odpovídá `interpreti.njk`:

- HEADER s titulkem stránky ("Aktuality").
- LIST sekce iteruje `collections.aktualityActive` (už seřazená sestupně), vykresluje řádky stejným patternem jako `koncerty/index.md` — flex layout s titulkem vlevo a datem vpravo, `hover:text-accent transition-colors duration-500`.

Layout řádku:

```
Titulek aktuality                              D. M. YYYY
(font-heading, text-2xl/3xl, hover→accent)     (text-muted, uppercase, tracking-time)
```

Bez perexu (jen titulek + datum). Body se zobrazuje až na detailu — stejný princip jako u koncertů.

### `aktuality/index.md`

```yaml
---
title: "Aktuality"
layout: "aktuality.njk"
tags: "nav"
templateEngineOverride: njk
---
```

Jako u `interpreti/index.md` — listing je v dedikované šabloně, `index.md` jen nastaví layout. `tags: "nav"` je sémantický marker, *ne* součást auto-kolekce stránek v menu (statický odkaz, viz Navigace).

## Homepage sekce

V `index.njk` se přidá nová sekce **mezi** „Následující koncert" a „Poslechnout" (video).

Podmínka zobrazení: `{% if collections.aktualityActive.length %}` — sekce se neukáže, pokud nejsou žádné aktivní aktuality.

Obsah:

- `u-label` „Aktuality" (konzistentní s ostatními sekcemi)
- Top 3 položky z `collections.aktualityActive` (slice `[0:3]`)
- Layout řádku stejný jako v listingu (titulek + datum + hover→accent)
- Pod seznamem odkaz „Všechny aktuality" → `/aktuality/` (vždy, pokud je sekce vidět — usnadňuje navigaci na listing)

Vizuální vzor:

```
─ AKTUALITY ────────────────────────────────────
Hledáme nové posily                  25. 6. 2018
Novoroční koncert přesunut           14. 1. 2024
Pozvánka na zkoušku                  10. 3. 2026

[ Všechny aktuality → ]
```

## Navigace

Menu pozice: **mezi Domů a Koncerty** (aktuality jsou vstupní informace, dává smysl je mít vlevo).

Implementace v `_includes/navigation.njk` (desktop i mobile menu):

```njk
{% if collections.aktualityActive.length %}
  <li>
    <a href="{{ baseUrl }}/aktuality/"
       class="...
              {% if page.url == '/aktuality/' %}text-accent{% endif %}">
      Aktuality
    </a>
  </li>
{% endif %}
```

Gating přes `collections.aktualityActive` (ne `collections.aktuality`) zajišťuje, že menu se schová i v případě, kdy MD soubory existují, ale žádná aktualita aktuálně neprobíhá. Toto je v souladu s rozhodnutím „filtrovat všude stejně".

## Templater (Obsidian)

Nový soubor `_templates/aktualita.md`:

```
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

Folder mapping v `.obsidian/plugins/templater-obsidian/data.json` (přidat řádek):

```json
{ "folder": "aktuality", "template": "_templates/aktualita.md" }
```

## Konzistence s existujícím kódem

- Styling: 100% z `concert.njk` / `koncerty/index.md` / `interpreti.njk` patternů (`max-w-container-2xl`, `lg:grid-cols-12`, `divide-y`, `hover:text-accent` atd.).
- Markdown rendering: `templateEngineOverride: njk,md` jako u koncertů.
- Žádné nové JS závislosti.
- Žádné změny build pipeline kromě jedné `addCollection` definice v `eleventy.config.js`.
- Datový filtr `date` z `eleventy.config.js` se používá beze změny.

## Alternatives (zvažováno a zamítnuto)

**A) Filtrovat až ve šablonách (bez custom kolekce)** — používat `collections.aktuality` s inline filtry v každé šabloně (`{% for a in collections.aktuality if a.data["date-from"] <= today %}`). Plus: žádná konfigurace v eleventy.config. Minus: duplikace filtru na 3 místech (homepage, listing, navigace), riziko desync. **Zamítnuto** — custom kolekce je čistší (single source of truth).

**B) Ponechat `date` i `date-from`** — flexibilita pro budoucí divergenci. Minus: redundance, autoři budou plnit oba stejně. **Zamítnuto** (potvrzeno uživatelem).

**C) Listing zobrazuje vše, homepage jen aktivní** — odlišné filtry. Minus: nekonzistentní s rozhodnutím „filtrovat všude stejně". **Zamítnuto** (potvrzeno uživatelem).

**D) Hard-hide detail page pro neaktivní aktuality (`permalink: false`)** — generovat detail jen v okně viditelnosti. Plus: žádné „leaknuté" URL. Minus: komplexnější logika, dynamický permalink, nutnost workaroundu při testování. **Zamítnuto** — pro tento web má malou hodnotu, viz Risks.

**E) Perex/excerpt v listingu** — krátká anotace u titulku. Minus: nekonzistentní s koncerty (které také jen titulek + datum), zvyšuje pole frontmatteru. **Zamítnuto** — držet jednotný vzor s ostatními listingy.

## Open ends (záměrně mimo scope)

- Žádné RSS / atom feed pro aktuality.
- Žádné kategorie / tagy pod hlavním tagem `aktuality`.
- Žádný obrázek / cover u aktuality.
- Žádný „archiv" sekce pro prošlé aktuality (mimo přímou URL).

## Risks / pasti

- **Datum-závislý build**: kolekce `aktualityActive` se vyhodnocuje při buildu. Aktualita s `date-from` v budoucnu se objeví na webu, **až proběhne další build**. Pokud je deploy ruční (GitHub Pages přes commit), autor musí nový build vyvolat po datu zveřejnění. Mitigace: doporučit autorům commitovat ráno v den `date-from`, nebo zavést scheduled GitHub Actions rebuild (mimo scope).
- **Neaktivní URL přístupné přímým odkazem** — detail aktuality s prošlým `date-to` lze stále otevřít přes přímou URL. Pro tento web (komunitní, ne marketing) přijatelné. Lze doplnit `permalink: false` v budoucnu pokud bude třeba.
- **Špatný formát data** — pokud autor zadá nevalidní datum (např. „25.6.2018" místo „2018-06-25"), filtr `>=` na řetězci neudělá to, co autor čeká. Mitigace: Templater template vždy vyžaduje YYYY-MM-DD. Volitelně: build-time validace pomocí filtru (mimo scope).
- **Kebab-case keys v Nunjucks**: `item.data["date-from"]` se používá místo `.dateFrom`. V šablonách to vypadá hůř, ale je to čitelné a konzistentní s YAML zápisem v zadání.

## Implementační kroky (vstup pro plán)

1. Vytvořit složku `aktuality/` s `index.md` (listing) a 1 ukázkovou aktualitou pro test.
2. Vytvořit `_includes/aktualita.njk` (detail šablona).
3. Vytvořit `_includes/aktuality.njk` (listing šablona).
4. Přidat `addCollection("aktualityActive", …)` do `eleventy.config.js`.
5. Přidat sekci „Aktuality" do `index.njk` (mezi „Následující koncert" a „Poslechnout"), s podmínkou `{% if collections.aktualityActive.length %}`.
6. Přidat statický odkaz „Aktuality" do `_includes/navigation.njk` (desktop i mobile menu), gating přes `collections.aktualityActive`.
7. Vytvořit Templater šablonu `_templates/aktualita.md`.
8. Doplnit folder mapping do `.obsidian/plugins/templater-obsidian/data.json`.
9. Otestovat lokálně (`npm start`):
   - aktivní aktualita se zobrazí v menu, na homepage a v listingu
   - aktualita s `date-from` v budoucnu se neukáže
   - aktualita s `date-to` v minulosti se neukáže
   - pokud nejsou žádné aktivní, menu i homepage sekce zmizí
