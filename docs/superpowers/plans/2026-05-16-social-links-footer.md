# Odkazy na sociální sítě v patičce — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přidat odkaz na Facebook do patičky a sjednotit patičku napříč všemi stránkami webu KOVS.

**Architecture:** Vytáhnout stávající inline footer z `index.njk` do nového Nunjucks partialu `_includes/footer.njk`, který zahrne i nový spodní pruh se sociálními odkazy iterujícími přes `_data/social.json`. Partial se zapojí do `_includes/default.njk`, aby ho zdědily všechny stránky.

**Tech Stack:** Eleventy 3.x (Nunjucks templates), Tailwind CSS 4.x (utility-only), Alpine.js (nedotčeno).

**Spec:** `docs/superpowers/specs/2026-05-16-social-links-footer-design.md`

**Poznámka k „TDD":** Projekt nemá unit test framework pro šablony — „test" pro každý krok je úspěšný `eleventy` build + vizuální kontrola vyrenderovaného HTML v `_site/`. Verifikační kroky používají `grep` na výstupním HTML, aby se ověřilo, že očekávaný markup vznikl.

---

## File Structure

| Soubor | Akce | Odpovědnost |
|---|---|---|
| `_data/social.json` | **Create** | Pole sociálních sítí (zatím jen FB) — Eleventy global data |
| `_includes/footer.njk` | **Create** | Markup patičky — původní CTA blok + nový spodní pruh se sociky |
| `_includes/default.njk` | **Modify** | Includovat `footer.njk` na konci `<body>` |
| `index.njk` | **Modify** | Odstranit inline `<footer>` (řádky 159–184) — footer teď dědí z `default.njk` |

---

## Task 1: Datová vrstva — `_data/social.json`

**Files:**
- Create: `_data/social.json`

- [ ] **Step 1: Ověř, že adresář `_data/` existuje**

Run: `ls _data 2>/dev/null && echo EXISTS || echo MISSING`

Pokud `MISSING`: `mkdir _data`

- [ ] **Step 2: Vytvoř `_data/social.json`**

```json
[
  {
    "name": "Facebook",
    "url": "https://www.facebook.com/profile.php?id=100063702495058",
    "icon": "facebook"
  }
]
```

- [ ] **Step 3: Ověř, že Eleventy data jsou validní JSON**

Run: `node -e "console.log(JSON.parse(require('fs').readFileSync('_data/social.json','utf8')))"`
Expected: vypíše parsed pole s jedním objektem (Facebook).

- [ ] **Step 4: Commit**

```bash
git add _data/social.json
git commit -m "feat: add social media data file"
```

---

## Task 2: Vytvoř partial `_includes/footer.njk`

Tento partial obsahuje **původní** footer markup z `index.njk` **a navíc** nový spodní pruh se sociky. Zatím není nikde includován — homepage stále drží svůj inline footer (smazání proběhne v Task 4 spolu se zapojením do default.njk, aby nedošlo k duplikaci).

**Files:**
- Create: `_includes/footer.njk`

- [ ] **Step 1: Vytvoř `_includes/footer.njk` s tímto obsahem**

```njk
{# ── FOOTER ────────────────────────────────────────────────────── #}
<footer class="bg-dark">
  <div class="max-w-container-2xl mx-auto px-8 lg:px-16 py-16 lg:py-24">
    <div class="lg:grid lg:grid-cols-12 lg:gap-8 items-end">
      <div class="lg:col-start-2 lg:col-span-8">
        <p class="text-micro uppercase tracking-label text-dark-fg/50 mb-6 flex items-center gap-3">
          <span class="block w-8 h-px bg-gold"></span>
          Kontakt
        </p>
        <h2 class="font-heading text-3xl lg:text-5xl text-dark-fg leading-tight mb-4">
          Přijďte nás poslouchat
        </h2>
        <p class="text-dark-fg/60 leading-relaxed mb-10 max-w-md">
          Sledujte naše koncerty a buďte u každého vystoupení.
        </p>
        {% if collections.koncerty %}
          <a href="{{ baseUrl }}/koncerty/" class="c-button">Nadcházející koncerty</a>
        {% endif %}
      </div>
      <div class="hidden lg:block lg:col-start-12 lg:col-span-1 text-right">
        <p class="text-micro text-dark-fg/25 uppercase tracking-button">
          © {{ "" | date("yyyy") }}
        </p>
      </div>
    </div>
  </div>

  {% if social and social.length %}
    <div class="border-t border-dark-fg/10">
      <div class="max-w-container-2xl mx-auto px-8 lg:px-16 py-8 lg:py-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p class="text-micro uppercase tracking-label text-dark-fg/50 flex items-center gap-3">
          <span class="block w-8 h-px bg-gold"></span>
          Sledujte nás
        </p>
        <ul class="flex items-center gap-6">
          {% for s in social %}
            <li>
              <a href="{{ s.url }}"
                 target="_blank"
                 rel="noopener noreferrer"
                 aria-label="{{ s.name }}"
                 class="inline-flex items-center gap-2 text-sm text-dark-fg/60 hover:text-gold transition-colors duration-500">
                {% if s.icon == "facebook" %}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
                  </svg>
                {% endif %}
                <span>{{ s.name }}</span>
              </a>
            </li>
          {% endfor %}
        </ul>
      </div>
    </div>
  {% endif %}
</footer>
```

- [ ] **Step 2: Sanity check — soubor existuje a má správné `<footer>` tagy**

Run: `grep -c '<footer class="bg-dark">' _includes/footer.njk && grep -c '</footer>' _includes/footer.njk`
Expected: `1` a `1` (přesně jeden otvírací a jeden uzavírací tag).

- [ ] **Step 3: Sanity check — sociální blok je uvnitř footeru**

Run: `awk '/<footer/,/<\/footer>/' _includes/footer.njk | grep -c "Sledujte nás"`
Expected: `1`.

- [ ] **Step 4: Commit**

```bash
git add _includes/footer.njk
git commit -m "feat: add footer partial with social links bar"
```

---

## Task 3: Migrace — zapoj footer do default.njk a odstraň inline footer z index.njk

**Tyto dvě změny musí proběhnout ve stejném commitu**, jinak by homepage mezikrokem buď neměla žádný footer, nebo měla dva.

**Files:**
- Modify: `_includes/default.njk`
- Modify: `index.njk:159-184`

- [ ] **Step 1: Zapoj footer do `_includes/default.njk`**

Současný obsah:
```njk
<!DOCTYPE html>
<html lang="cs">
  <head>
    <title>
      {% if title %}{{ title }} | {% endif %}
      Komorní orchestr Vlasty Škampové
    </title>
    {% include "_head.njk" %}
    {% block head %}{% endblock %}
    <script defer src="{{ baseUrl }}/js/alpine.js?v={{ version or '1' }}"></script>
  </head>
  <body>
    {% include "navigation.njk" %}

    {% block content %}
      {{ content | safe }}
    {% endblock %}
  </body>
</html>
```

Nahraď řádek `</body>` (jediný v souboru) za:
```njk
    {% include "footer.njk" %}
  </body>
```

Tedy přidat `{% include "footer.njk" %}` jako poslední věc před `</body>`.

- [ ] **Step 2: Odstraň inline footer z `index.njk`**

Smaž řádky 158–184 (komentář `{# ── FOOTER CTA ── #}` a celý blok `<footer class="bg-dark">…</footer>` včetně předcházejícího prázdného řádku 157, který byl jen separátor).

Po smazání musí `index.njk` končit tímto:
```njk
        ...
      </div>
    </div>
  </section>

{% endblock %}
```

Bez `</footer>` kdekoliv v souboru.

- [ ] **Step 3: Ověř, že v `index.njk` už není `<footer>`**

Run: `grep -c "<footer" index.njk`
Expected: `0`.

- [ ] **Step 4: Ověř, že `default.njk` includuje footer**

Run: `grep -c 'include "footer.njk"' _includes/default.njk`
Expected: `1`.

- [ ] **Step 5: Commit**

```bash
git add _includes/default.njk index.njk
git commit -m "refactor: move footer to default.njk include"
```

---

## Task 4: Build & vizuální verifikace

**Files:**
- (žádné — jen build a kontrola výstupu)

- [ ] **Step 1: Spusť produkční build**

Run: `npm run build`
Expected: build skončí bez chyb, vznikne/aktualizuje se `_site/`.

Pokud build selže s chybou v Nunjucks: vrátit se a opravit syntaxi v `footer.njk` nebo `default.njk`.

- [ ] **Step 2: Ověř, že homepage má footer s FB odkazem**

Run: `grep -c 'aria-label="Facebook"' _site/index.html`
Expected: `1`.

Run: `grep -c "Sledujte nás" _site/index.html`
Expected: `1`.

Run: `grep -c "Přijďte nás poslouchat" _site/index.html`
Expected: `1` (původní CTA blok stále funguje).

- [ ] **Step 3: Ověř, že podstránka (koncerty) má footer**

Run: `grep -c 'aria-label="Facebook"' _site/koncerty/index.html`
Expected: `1`.

Run: `grep -c "Sledujte nás" _site/koncerty/index.html`
Expected: `1`.

- [ ] **Step 4: Ověř, že homepage nemá duplicitní footer**

Run: `grep -c "<footer" _site/index.html`
Expected: `1` (přesně jeden, ne dva).

- [ ] **Step 5: Ověř FB URL ve výstupu**

Run: `grep -c "facebook.com/profile.php?id=100063702495058" _site/index.html`
Expected: `1`.

- [ ] **Step 6: Spusť dev server a vizuálně zkontroluj v prohlížeči**

Run: `npm start`

Zkontroluj v prohlížeči (typicky `http://localhost:8080/`):
- **Homepage** (`/`): patička vypadá stejně jako dřív (CTA „Přijďte nás poslouchat" + tlačítko + copyright vpravo), pod ní nový pruh „Sledujte nás" vlevo a FB odkaz vpravo.
- **Koncerty** (`/koncerty/`): patička se zobrazuje (dříve tam nebyla).
- **Interpreti** (`/interpreti/`): patička se zobrazuje.
- **Kontakt** (`/kontakt/`): patička se zobrazuje.
- **Hover** na FB odkaz: barva ikony i textu se změní na gold (smooth transition).
- **Klik** na FB odkaz: otevře `https://www.facebook.com/profile.php?id=100063702495058` v nové záložce.
- **Mobile** (zúžit okno na ~375 px): nadpis „Sledujte nás" a sociky se stackují pod sebe (column layout).
- Žádná regrese v navigaci ani v existujícím CTA bloku.

Zastav dev server (`Ctrl+C`) po ověření.

- [ ] **Step 7: Pokud build artefakty nejsou gitignored, nech to být**

Nepřidávat `_site/` do commitu (mělo by být v `.gitignore`).

Run: `git status`
Expected: working tree clean (kromě případných nezapočítaných `_site/` souborů, které jsou v gitignore).

---

## Self-Review

**Spec coverage:**
- ✅ Extrakce footeru do partialu — Task 2 + 3
- ✅ Footer v `default.njk` napříč stránkami — Task 3 step 1
- ✅ Odstranění inline footeru z `index.njk` — Task 3 step 2
- ✅ Data file `_data/social.json` se strukturou name/url/icon — Task 1
- ✅ Spodní pruh v patičce s hairline oddělovačem a layoutem — Task 2 markup
- ✅ Mikronadpis „Sledujte nás" s gold pomlčkou — Task 2 markup
- ✅ Iterace přes `social` — Task 2 markup
- ✅ Inline SVG FB ikona, 18×18, currentColor — Task 2 markup
- ✅ `target="_blank"`, `rel="noopener noreferrer"`, `aria-label` — Task 2 markup
- ✅ Hover na gold, transition — Task 2 markup (`hover:text-gold transition-colors duration-500`)
- ✅ Responzivní stack na mobilu — Task 2 markup (`flex-col … lg:flex-row`)
- ✅ Build + vizuální verifikace — Task 4

**Placeholder scan:** Žádné TBD/TODO. Kompletní markup ve všech krocích. Žádné „handle edge cases" bez konkrétního kódu.

**Type/identifier consistency:** Pole `social` → vlastnosti `name`, `url`, `icon` — používány konzistentně v JSON i šabloně. `s.icon == "facebook"` odpovídá hodnotě v JSONu.
