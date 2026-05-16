# Obsidian místo web administrace

Chci používat Obsidian (markdown editor) pro administraci tohoto webu.
Budu používat pluginy Templater pro vytváření nových koncertů a interpretů a Git pro commit do Github.
Musí to fungovat ta, že když vytvořím nový soubor ve složce kocerty, použije se šablona koncertů a podobně pro interprety.

- vytvoř šablony pro Templater do složky _temptales pro koncert a interpreta 

---

**Implementováno 2026-05-16:**
- Šablony v `_templates/koncert.md` a `_templates/interpret.md`.
- Templater nakonfigurován v `.obsidian/plugins/templater-obsidian/data.json`.
- Spec: `docs/superpowers/specs/2026-05-16-obsidian-admin-design.md`.
- Plan: `docs/superpowers/plans/2026-05-16-obsidian-admin.md`.

(Pozn.: zadání obsahuje typo `_temptales` — implementace používá `_templates` jako standardní pojmenování. Schválené v brainstormingu.)
