# Bug: na produkčním prostředí se špatně resolvují url

Vypublikoval jsem web na Github Pages - https://komorni-orchestr.cz

- nezobrazuje se css
- jsou špatně odkazy, např. v hlavní menu 
```html
<a href="/kovs/koncerty/" class="text-sm uppercase tracking-label font-medium text-navigation hover:text-accent transition-colors duration-500">
  Koncerty
</a>
```
- na lokále se web zobrazuje dobře
- zkontroluj to potom přes Chrome MCP


