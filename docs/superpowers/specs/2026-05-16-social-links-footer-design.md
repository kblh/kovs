# Odkazy na sociální sítě v patičce

**Datum:** 2026-05-16
**Status:** Schválen návrh, čeká se na review spec dokumentu
**Zadání:** `docs/zadani/social.md`

## Cíl

Přidat do patičky webu KOVS odkaz na profil orchestru na Facebooku, a to konzistentně napříč všemi stránkami webu (ne jen na homepage). Datová struktura musí umožňovat budoucí přidání dalších sociálních sítí (Instagram, YouTube apod.) bez zásahu do šablon.

## Kontext / současný stav

- Patička (`<footer>`) dnes existuje **pouze v `index.njk`** (řádky 159–184). Ostatní stránky používající `_includes/default.njk` (koncerty, interpreti, kontakt, pages…) žádnou patičku nemají.
- Současný footer obsahuje: nadpis „Přijďte nás poslouchat", podtitulek, tlačítko na nadcházející koncerty a v pravém sloupci copyright.
- Web používá Tailwind, Eleventy (Nunjucks), Alpine.js. Konvence: `bg-dark`, `text-dark-fg`, accent `text-gold`, `text-accent`, tracking-label uppercase mikro­nadpisy s gold pomlčkou.

## Architektura

### 1. Extrakce footeru do partialu

Vytvořit `_includes/footer.njk`, který obsahuje:
- původní obsah `<footer>` z `index.njk` (CTA blok + copyright),
- nový spodní pruh se sociálními odkazy (viz níže).

Footer se vloží do `_includes/default.njk` na konec `<body>` (za `{% block content %}`), aby ho zdědily všechny stránky:

```njk
{% block content %}
  {{ content | safe }}
{% endblock %}
{% include "footer.njk" %}
```

Z `index.njk` se odstraní inline `<footer>…</footer>` (řádky 159–184).

### 2. Datová vrstva

Vytvořit `_data/social.json` — Eleventy global data file dostupný v šablonách jako `social`:

```json
[
  {
    "name": "Facebook",
    "url": "https://www.facebook.com/profile.php?id=100063702495058",
    "icon": "facebook"
  }
]
```

Pole objektů (ne objekt), aby šlo zachovat pořadí. Pro každou síť tři pole:
- `name` — viditelný label (a aria-label),
- `url` — cílový odkaz,
- `icon` — identifikátor ikony (klíč do switche v šabloně).

Přidání další sítě = doplnění objektu do JSONu + (pokud nová ikona) přidání SVG větve do switche v `footer.njk`.

### 3. Vizuální podoba spodního pruhu

Uvnitř `<footer class="bg-dark">`, **pod** existujícím `<div class="max-w-container-2xl …py-16 lg:py-24">` blokem, ale stále uvnitř `<footer>`:

- Nový kontejner se stejným `max-w-container-2xl mx-auto px-8 lg:px-16` paddingem.
- Horní hairline oddělovač: `border-t border-dark-fg/10`.
- Vertikální padding: `py-8 lg:py-10` (subtilnější než hlavní blok).
- Layout uvnitř: flex, na mobilu sloupec, na desktopu řádek s `justify-between`:
  - **Vlevo:** mikronadpis „Sledujte nás" se stejným stylem jako „Kontakt" výše (`text-micro uppercase tracking-label text-dark-fg/50` + gold pomlčka `<span class="block w-8 h-px bg-gold"></span>`).
  - **Vpravo:** `<ul>` se sociky, `flex items-center gap-6`.

### 4. Položka sociálního odkazu

Každý odkaz v iteraci `{% for s in social %}`:

```njk
<a href="{{ s.url }}"
   target="_blank"
   rel="noopener noreferrer"
   aria-label="{{ s.name }}"
   class="inline-flex items-center gap-2 text-sm text-dark-fg/60 hover:text-gold transition-colors duration-500">
  {# inline SVG podle s.icon #}
  <span>{{ s.name }}</span>
</a>
```

### 5. Ikona Facebooku

Inline SVG, 18×18, `fill="currentColor"`, oficiální Facebook „f" silueta. Umístěné přímo v `footer.njk` v jednoduchém `{% if s.icon == "facebook" %} … {% endif %}` bloku. Pro jednu ikonu není potřeba separátní partial; až přibude druhá síť, refaktorovat na `_includes/social-icon.njk` se switchem.

## Co se NEdělá (YAGNI)

- Žádný icon font (Font Awesome apod.) ani externí icon lib.
- Žádný separátní CSS soubor — pouze Tailwind utility v souladu s existujícími patterny.
- Žádné automatické generování ikon nebo build step.
- Žádné placeholder položky pro IG/YT v JSONu — přidají se, až budou reálné účty.
- Žádný refaktor pravého sloupce s copyrightem (zůstává beze změny).

## Dotčené soubory

| Soubor | Akce |
|---|---|
| `_includes/footer.njk` | **Nový** — obsahuje původní footer markup + spodní pruh se sociky |
| `_includes/default.njk` | **Upravit** — přidat `{% include "footer.njk" %}` |
| `index.njk` | **Upravit** — odstranit inline `<footer>…</footer>` (řádky 159–184) |
| `_data/social.json` | **Nový** — pole sociálních sítí |

## Testování / verifikace

- `npm run build` (nebo ekvivalent) musí projít bez chyb.
- Spustit dev server a vizuálně ověřit:
  - homepage: footer vypadá stejně jako dnes + nový spodní pruh s FB odkazem,
  - libovolná podstránka (např. `/koncerty/`, `/interpreti/`, `/kontakt/`): footer se zobrazuje (dnes tam není),
  - hover na FB odkaz mění barvu na gold,
  - klik otevírá FB v nové záložce,
  - responzivně: na mobilu se nadpis a sociky stack­ují pod sebe.
- Žádná regrese v navigaci ani v existujícím CTA bloku patičky.

## Otevřené otázky

Žádné. Vizuální detaily a rozsah byly potvrzeny v brainstormingu.
