# Úkoly

## Dokončené

- **14. 2. 2025** – Vytvořit GitHub Action pro nasazování na GitHub Pages – IMPLEMENTED: Přidán workflow `.github/workflows/deploy.yml`, který při push na `main` sestaví Eleventy web a nasadí ho na GitHub Pages pomocí `actions/upload-pages-artifact` a `actions/deploy-pages`.
- **13. 2. 2025** – Přidat stránky "O orchestru", "Historie" a "Kontakt" – IMPLEMENTED: Vytvořeny stránky `o-orchestru/index.md`, `historie/index.md`, `kontakt/index.md` s tagem `pages` pro zobrazení v navigaci. Přidána vlastní kolekce `pages` v `.eleventy.js` s řazením podle `navOrder` v front matter. Fotogalerie doplněna o `navOrder: 3` pro konzistentní pořadí v menu.
