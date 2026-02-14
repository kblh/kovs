# Úkoly

## Dokončené

- **14. 2. 2025** – Sjednotit <head> ve všech njk šablonách – IMPLEMENTED: Vytvořen partial `_includes/_head.njk` s jednotným obsahem (meta charset, description, viewport, stylesheet). Layouty `default.njk`, `concert.njk`, `gallery.njk` nyní používají `{% include "_head.njk" %}`. Sjednoceno `lang="cs"` a podpora proměnných `desc` i `description`.
- **14. 2. 2025** – Opravit styly a relativní odkazy na GitHub Pages – IMPLEMENTED: Přidán `pathPrefix` a globální `baseUrl` v `eleventy.config.js`. Lokálně (npm run start) baseUrl="", na GitHub Pages (npm run build) baseUrl="/kovs". Šablony používají `{{ baseUrl }}` pro CSS, JS, odkazy a obrázky. Funguje lokálně i na GitHub Pages.
- **14. 2. 2025** – Vytvořit GitHub Action pro nasazování na GitHub Pages – IMPLEMENTED: Přidán workflow `.github/workflows/deploy.yml`, který při push na `main` sestaví Eleventy web a nasadí ho na GitHub Pages pomocí `actions/upload-pages-artifact` a `actions/deploy-pages`.
- **13. 2. 2025** – Přidat stránky "O orchestru", "Historie" a "Kontakt" – IMPLEMENTED: Vytvořeny stránky `o-orchestru/index.md`, `historie/index.md`, `kontakt/index.md` s tagem `pages` pro zobrazení v navigaci. Přidána vlastní kolekce `pages` v `.eleventy.js` s řazením podle `navOrder` v front matter. Fotogalerie doplněna o `navOrder: 3` pro konzistentní pořadí v menu.
