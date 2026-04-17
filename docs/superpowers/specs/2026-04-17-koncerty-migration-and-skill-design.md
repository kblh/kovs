# Koncerty — migrace frontmatter a skill pro nový koncert

**Datum:** 2026-04-17
**Status:** Schváleno uživatelem, čeká na implementační plán

## Cíl

Dvě související změny:

1. **Migrace frontmatter** existujících koncertů (`koncerty/*.md`): prohodit `title` ↔ `desc`, přejmenovat `desc` → `place`, upravit šablony, které tato pole konzumují.
2. **Skill `new-concert`** pro poloautomatické vytváření nových koncertů z PDF pozvánky nebo volného textu s interaktivním doplněním chybějících polí.

## Kontext

Web komorního orchestru postavený v Eleventy. Koncerty jsou markdown soubory v `koncerty/` s frontmatter polí `title`, `desc`, `date`, `pdf`, atd. Aktuálně:

- `title` drží krátký název místa (např. `"Muzeum hudby"`, `"Salvátor"`).
- `desc` drží zkrácený seznam skladatelů (např. `"Grieg, Britten, Sarasate, Wirén"`).
- V těle souboru je `## nadpis` s plným názvem místa — někdy i s adresou, někdy jen krátký název.

Sémantika je obrácená: to, co nejlépe identifikuje koncert (program), patří do `title`; místo je kontext (`place`). Tato migrace tuto inverzi opravuje a sjednocuje model dat pro další skill, který bude koncerty přidávat.

## Rozhodnutí

### Struktura po migraci

Frontmatter:

```yaml
---
title: "<skladatelé / zkrácený program>"   # dříve desc
place: "<krátký název místa>"              # nové pole
date: "YYYY-MM-DD"
tags: "koncerty"
layout: "concert.njk"
pdf: "YYYY-MM-DD-<slug>.pdf"               # volitelné
templateEngineOverride: njk,md
---
```

Tělo:

```md
## <Plný název místa + adresa>

**Program:** <skladby>

**Sólisté:** <seznam>         # volitelné (varianty: Host, Hosté)
<volný popis souboru>          # volitelné, např. "Naši pěvci"
**Sbormistr:** <jméno>         # volitelné
**Diriguje:** <jméno>
```

### Mapování pro migraci

- `new title = old desc` (přenos hodnoty).
- `new place = ## nadpis, část před první čárkou`. Pokud nadpis neobsahuje čárku, vzít celý.
  - Příklad: `## Kostel ČCE U Salvátora, Salvátorská 1, Praha 1, Staré Město` → `place: "Kostel ČCE U Salvátora"`.
  - Příklad: `## České muzeum hudby` → `place: "České muzeum hudby"`.
- `old title` se zahazuje (jeho hodnota byla zkrácenou verzí `place`, nová `place` je přesnější).
- Klíč `desc` se odstraní.
- `## nadpis` v těle zůstává beze změny (doplnění adres u krátkých nadpisů řeší uživatel ručně mimo tuto migraci).
- Pořadí klíčů frontmatteru: `title`, `place`, `date`, `tags`, `layout`, `pdf`, `templateEngineOverride`.

### Dotčené šablony

- `_includes/concert.njk` — řádek `{% if desc %}` + `{{ desc }}` nahradit `{% if place %}` + `{{ place }}`. Pozice vykreslení (pod titulkem jako subtitle) zůstává.
- `koncerty/index.md` — `{% if item.data.desc %}` + `{{ item.data.desc }}` nahradit `item.data.place`. Pozice zůstává.

### Scope migrace

- Mechanická jen — nepřepisuje adresy v `## nadpisu`, nezasahuje do textu těla.
- Skript se spouští jednou nad všemi `koncerty/*.md` kromě `index.md`.
- Výstup: seznam upravených souborů pro kontrolu.

### Skill `new-concert`

**Umístění:** `.claude/skills/new-concert/SKILL.md` — projektový skill, verzovaný s repem.

**Aktivace:** přirozený jazyk („přidej koncert", „nový koncert z PDF") nebo `/new-concert`.

**Vstupy:**

- PDF (cesta nebo `@soubor.pdf`) — skill přečte přes tool Read.
- Volný text s informacemi.
- Interaktivní režim — skill doptá chybějící pole.

**Průběh (7 kroků):**

1. **Sběr dat** — z PDF/textu extrahovat: `date`, plný název místa s adresou, `program`, sólisté/hosté, název souboru (sbor/orchestr), `sbormistr`, `diriguje`.

2. **Potvrzení polí** — zobrazit extrahovaná pole, doptat chybějící.
   - Povinná: `date`, `place` (krátký), `## heading` (plný + adresa), `program`, `diriguje`.
   - Volitelná: sólisté/hosté, volný popis souboru, sbormistr, pdf.

3. **Návrh `title`** — auto-návrh jako zkrácený seznam skladatelů z programu (např. program obsahující Mozart + Strauss → `"Mozart, Strauss"`). Uživatel potvrdí/upraví.

4. **Návrh slug** — auto z `place`: odstranit diakritiku, lowercase, mezery → pomlčky, vzít „jádrové" slovo(-a). Heuristika:
   - `Kostel ČCE U Salvátora` → `salvator` (vzít poslední významné slovo, filtrovat „kostel", „u", zkratky jako „ČCE").
   - `České muzeum hudby` → `muzeum-hudby`.
   - `Zpěvácký spolek Hlahol` → `hlahol`.
   - Konzistence se zachovává s existujícími slugy (`salvator`, `muzeum-hudby`, `cernosice`, `refektar`, `hlahol`, `korunni`, `arcibiskupske-gymnazium`, `dejvice`).
   - Uživatel může slug přepsat před zápisem.

5. **Kontrola kolize** — pokud `koncerty/YYYY-MM-DD-<slug>.md` již existuje, skill se zeptá: přepsat / změnit slug / přerušit.

6. **Zápis souboru + PDF** — vytvořit `koncerty/YYYY-MM-DD-<slug>.md` ze šablony. Pokud byl vstupem PDF, zkopírovat ho do `koncerty/pdf/YYYY-MM-DD-<slug>.pdf`.

7. **Preview + git** — ukázat diff, zeptat se zda commitnout. Pokud ano: `git add` + `git commit -m "koncert: <place> <YYYY-MM-DD>"`. Skill sám nespouští `git push`. Otevření v editoru neřeší (uživatel si otevře pokud chce).

### Šablona pro zápis souboru

```md
---
title: "{{ title }}"
place: "{{ place }}"
date: "{{ date }}"
tags: "koncerty"
layout: "concert.njk"
{% if pdf %}pdf: "{{ pdfFilename }}"
{% endif %}templateEngineOverride: njk,md
---

## {{ fullPlaceHeading }}

**Program:** {{ program }}
{% if solists %}
**Sólisté:** {{ solists }}
{% endif %}{% if ensembleNote %}
{{ ensembleNote }}
{% endif %}{% if choirmaster %}
**Sbormistr:** {{ choirmaster }}
{% endif %}
**Diriguje:** {{ conductor }}
```

## Co NENÍ v scope

- Automatické doplňování adres do `## nadpisu` u starých koncertů (uživatel doplní ručně).
- Validace schématu (např. že `date` je platné datum) nad rámec základní kontroly formátu `YYYY-MM-DD`.
- Automatický `git push`.
- Otevření souboru v editoru po vytvoření.
- UI/web změny nad rámec přejmenování `desc` → `place` v šablonách.

## Soubory k úpravě/vytvoření

**Migrace:**

- Všech 22 souborů `koncerty/*.md` kromě `index.md` (úprava frontmatter).
- `_includes/concert.njk` (šablona detailu).
- `koncerty/index.md` (přehled).
- Jednorázový migrační skript (umístění a jazyk se rozhodne v plánu — lze Node.js v kořeni nebo bash, po použití smazat).

**Skill:**

- `.claude/skills/new-concert/SKILL.md` (hlavní definice).
- Případně pomocné soubory v tom adresáři (vzor šablony, příklady) — rozhodne se v plánu.
