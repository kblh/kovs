---
name: new-concert
description: Vytvoř nový koncert (markdown + volitelně PDF) do `koncerty/`. Použij, když uživatel řekne „přidej koncert", „nový koncert z PDF", „vytvoř koncert" apod. Přijímá PDF pozvánku (cesta nebo `@soubor.pdf`) nebo volný text. Interaktivně doptá chybějící pole, navrhne title a slug, zkopíruje PDF, nabídne git commit.
---

# Skill: new-concert

Slouží k vytvoření nového koncertu v tomto repozitáři. Pracuješ v adresáři projektu (nebo aktuálním worktree). Struktura koncertu je definována v `docs/superpowers/specs/2026-04-17-koncerty-migration-and-skill-design.md`.

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
- Pokud `place` obsahuje uvozovky (např. v úvozovkách název typu „Profesní dům"), ve YAML použij single-quoted formu: `place: 'Konferenční a společenské centrum „Profesní dům" (refektář)'`.
