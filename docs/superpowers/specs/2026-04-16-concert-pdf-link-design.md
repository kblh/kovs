# Koncerty: odkaz na PDF pozvánku

## Shrnutí

Rozšíření koncertních stránek o volitelný odkaz na PDF soubor (pozvánku na koncert). PDF soubory budou uloženy v repozitáři ve složce `koncerty/pdf/`. Na stránce koncertu se zobrazí textový odkaz "Stáhnout pozvánku (PDF)" pod popisem.

## Rozhodnutí

- PDF soubory uloženy v repozitáři (ne externě)
- Samostatná složka `koncerty/pdf/` (ne vedle .md souborů)
- Pole `pdf` ve frontmatter je volitelné
- Zobrazení jako textový odkaz (ne embed/náhled)

## Změny

### 1. Frontmatter koncertu

Nové volitelné pole `pdf` — hodnota je název souboru (bez cesty):

```yaml
---
title: "Salvátor 25"
desc: "Dvořák - Stabat Mater"
date: "2025-11-01"
tags: "koncerty"
layout: "concert.njk"
templateEngineOverride: njk,md
pdf: "2025-11-01-salvator.pdf"
---
```

Pokud pole chybí nebo je prázdné, odkaz se nezobrazí.

### 2. Složka pro PDF soubory

```
koncerty/
  pdf/
    2025-11-01-salvator.pdf
  index.md
  2025-11-01-salvator.md
```

### 3. Eleventy konfigurace (`eleventy.config.js`)

Přidat passthrough copy pro PDF soubory:

```js
eleventyConfig.addPassthroughCopy("koncerty/pdf");
```

PDF budou dostupné na URL `{baseUrl}/koncerty/pdf/{název}.pdf`.

### 4. Šablona `_includes/concert.njk`

Pod blok s `desc` v header sekci přidat podmíněný odkaz:

```njk
{% if pdf %}
  <a href="{{ baseUrl }}/koncerty/pdf/{{ pdf }}"
     target="_blank"
     class="inline-flex items-center gap-2 text-accent hover:underline mt-4">
    Stáhnout pozvánku (PDF)
  </a>
{% endif %}
```

Odkaz se otevře v novém tabu (`target="_blank"`), stylovaný konzistentně s designem webu (barva `accent`, hover underline).

## Dotčené soubory

| Soubor | Typ změny |
|--------|-----------|
| `eleventy.config.js` | Přidání passthrough copy |
| `_includes/concert.njk` | Přidání podmíněného PDF odkazu |
| `koncerty/pdf/` | Nová složka (vytvořit) |
| `koncerty/*.md` | Volitelné přidání pole `pdf` do frontmatter |

## Co se nemění

- Listing koncertů (`koncerty/index.md`) — PDF odkaz se zobrazuje jen na detailu koncertu
- Homepage — zobrazuje jen název a datum dalšího koncertu
- Žádné nové závislosti v `package.json`
