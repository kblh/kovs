# Interpreti — design spec

## Účel

Přidat na web kolekci **Interpreti** (sólisté, dirigenti) s detailními stránkami, listingem, propojením do koncertů a odkazem v hlavním menu. Cíl: představit profesionální spolupracovníky orchestru a umožnit u konkrétního koncertu zobrazit, kdo na něm vystoupí.

## Architektura

### Struktura souborů

```
interpreti/
  index.md                        # listing (layout: interpreti.njk, tags: nav)
  michael-housa.md                # detail (layout: interpret.njk, tags: interpreti)
  bronislava-smrzova.md
  img/
    michael-housa.jpg             # nepovinné, optional photo per slug
    bronislava-smrzova.jpg
_includes/
  interpret.njk                   # template detailu (standalone HTML, jako concert.njk)
  interpreti.njk                  # template listingu (standalone HTML, jako concert.njk)
```

Slug interpreta = kebab-case jména bez diakritiky (např. `michael-housa`, `bronislava-smrzova`). Stejný slug se používá pro filename MD i pro filename JPG v `img/`.

### Kolekce

Nová kolekce **`interpreti`** vzniká automaticky díky `tags: "interpreti"` v jednotlivých MD souborech (Eleventy auto-collections). Žádná konfigurace v `eleventy.config.js` není potřeba.

`interpreti/index.md` má `tags: "nav"` — slouží pro listing, není sám interpretem, takže nepatří do kolekce `interpreti`. Toto napodobuje vzor z `koncerty/index.md`.

### Passthrough copy

`interpreti/img/` musí být v `_site/`. Vzhledem k tomu, že `.md` soubory už Eleventy zpracuje a `img/` je sourozenec, je nejjednodušší přidat:

```js
eleventyConfig.addPassthroughCopy("interpreti/img");
```

do `eleventy.config.js`.

## Datový model

### Interpret (např. `michael-housa.md`)

```yaml
---
name: "Michael Housa"
instrument: "dirigent"
slug: "michael-housa"           # explicit, není odvozen z permalinku
tags: "interpreti"
layout: "interpret.njk"
templateEngineOverride: njk,md
---

## Vzdělání
...
```

Pole `slug` slouží jako primární klíč pro propojení z koncertů a pro nalezení fotky. Explicitní `slug` ve frontmatteru (místo derivování z permalinku) je čitelnější a jednodušší v šabloně.

### Koncert (rozšíření `concert.njk` modelu)

Frontmatter koncertu dostane nepovinné pole:

```yaml
interpreti: ["michael-housa", "bronislava-smrzova"]
```

V `concert.njk` se z `collections.interpreti` vyhledají interpreti se shodným slugem a zobrazí se pod hlavní informací o koncertu, ve stejné vizuální podobě jako v listingu interpretů.

Existující koncerty bez tohoto pole se chovají beze změny (sekce s interprety se neukáže).

## Šablony

### `_includes/interpret.njk` (detail)

Struktura napodobí `concert.njk`:

- HEADER sekce s `Interpret` labelem, jménem (h1), nástrojem (subtitle).
- Pokud existuje fotka na `interpreti/img/<slug>.jpg`, zobrazí se v HEADERu (například po pravé straně grid, nebo nad jménem na mobilu).
- CONTENT sekce s `{{ content | safe }}` (markdown body).

Detekce existence fotky: ve šabloně použijeme `fs.existsSync` přes vlastní Eleventy filtr `hasInterpretPhoto(slug)` přidaný do `eleventy.config.js`, nebo jednodušší cestou — pole `photo: true` ve frontmatteru, které autor nastaví ručně. **Volíme druhou cestu** (jednodušší, žádný JS filtr): autor přidá `photo: true` do frontmatteru, pokud existuje `img/<slug>.jpg`. Pro nové autory je to lehce odhalitelné z příkladů.

Druhá varianta: zavést filter `hasInterpretPhoto`. Diskutováno níže v sekci "Alternatives".

### `_includes/interpreti.njk` (listing)

Standalone HTML strukturou kopíruje `concert.njk` (HEADER + LIST sekce). LIST iteruje `collections.interpreti`, řadí podle pole `name`. Každý řádek (anchor) ukazuje:

- malou fotku vlevo (pokud `photo: true`) — kruh/čtverec ~ 64–80px
- jméno (font-heading)
- nástroj (text-muted, menší)

Layout řádku napodobí pattern z `koncerty/index.md`: `flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-2 hover:text-accent transition-colors duration-500`. Žádné PDF/datum sloupec, místo toho fotka + name + instrument.

### `concert.njk` (rozšíření)

Pod CONTENT sekcí přibude nová sekce **Účinkují**, viditelná pouze pokud `interpreti` ve frontmatteru je neprázdné pole. Iteruje `collections.interpreti`, filtruje podle `data.slug` v `interpreti`, a vykreslí stejné řádky jako v listingu (sdílený vizuální vzor — definice řádku se zopakuje).

Sdílení markupu řádků: vytahnout markup řádku do `_includes/interpret-row.njk` partial, aby se nemuselo opakovat v `interpreti.njk` a `concert.njk`. Partial přijme proměnnou `item` (objekt z kolekce `interpreti`).

## Vizuální vzor — řádek interpreta

```
[ img ]   Jméno Příjmení                            instrument
          (font-heading, text-2xl/3xl)              (text-muted)
```

- Pokud chybí fotka, řádek se posune doleva (žádný placeholder).
- Cílem hover je odkaz na detail s anchor effects jako u koncertu (`hover:text-accent transition-colors duration-500`).

## Navigace

Menu position: mezi **Koncerty** a **Historie**. Implementace:

- `historie/index.md` má `navOrder: 2`, `kontakt/index.md` má `navOrder: 4`. Mezi nimi ale není volné číslo, které by stálo *mezi* `koncerty` (statický odkaz v navigation.njk) a `historie/index.md`.
- Řešení: `interpreti/index.md` dostane `tags: "nav"` a explicitní statický odkaz se přidá do `navigation.njk` **hned po** statickém odkazu na koncerty.
- Důvod: stávající `koncerty/index.md` je řešený stejně — statický odkaz v `navigation.njk` s podmínkou `{% if collections.koncerty %}`. Stejný pattern použijeme pro interprety: `{% if collections.interpreti %}` statický odkaz.

`interpreti/index.md` nepoužijeme jako součást `collections.pages` (žádný `tags: "pages"`), aby se v menu nedoplnil dvakrát.

## Konzistence s existujícím kódem

- Styling: 100% z `concert.njk` / `koncerty/index.md` patternů (max-w-container-2xl, lg:grid-cols-12, divide-y, hover:text-accent atd.).
- Markdown rendering: `templateEngineOverride: njk,md` jako u koncertů.
- Žádné nové JS závislosti.
- Žádné změny build pipeline kromě jednoho `addPassthroughCopy` řádku.

## Alternatives (zvažováno a zamítnuto)

**A) Detekce fotky přes JS filter** — `eleventy.config.js` filter `hasInterpretPhoto(slug)` kontroluje `fs.existsSync`. Plus: autoři nemusí pamatovat na `photo: true`. Minus: build-time závislost na FS, méně transparentní pro autora. **Zamítnuto** — ve prospěch explicitního `photo: true`, který je jednodušší pro autora i pro debug.

**B) Obousměrná relace mezi interpreti ↔ koncerty** — duplikuje informaci, riziko desync. Zamítnuto. Pole `interpreti: [...]` žije pouze na koncertech.

**C) Sdílení šablony detailu s `concert.njk`** — odlišné domény (koncert vs. osoba), nepřímý zisk. Zamítnuto.

## Open ends (zámerně mimo scope)

- Na detailu interpreta není seznam koncertů, kterých se účastnil. Šlo by doplnit jako filtr `collections.koncerty` podle slugu interpreta v poli `interpreti`. Mimo zadání.
- Žádné OG image / structured data per interpret. Mimo zadání.

## Riziko / pasti

- Pokud autor zapomene `photo: true` ale obrázek přidá, fotka se neukáže v listingu. Diagnostika: vizuální nedostatek po nasazení. Mitigace: napsat do README sekce u příkladu MD jasný komentář.
- Pokud autor uvede špatný slug v `interpreti` na koncertu, koncert ho prostě nevypíše. Žádný build error. Mitigace: viz checklist v PR description při zakládání nových koncertů.

## Implementační kroky (vstup pro plán)

1. Vytvořit složku `interpreti/` se třemi MD soubory (`index.md`, `michael-housa.md`, `bronislava-smrzova.md`) a prázdným `img/` adresářem.
2. Vytvořit `_includes/interpret-row.njk` (sdílený markup řádku).
3. Vytvořit `_includes/interpreti.njk` (listing).
4. Vytvořit `_includes/interpret.njk` (detail).
5. Přidat `addPassthroughCopy("interpreti/img")` do `eleventy.config.js`.
6. Přidat statický odkaz do `_includes/navigation.njk` (desktop i mobile menu).
7. Rozšířit `_includes/concert.njk` o sekci Účinkují (pod existujícím CONTENT).
8. Otestovat lokálně (`npm start`), ověřit listing, detail, navigaci a koncert s interpreti.
