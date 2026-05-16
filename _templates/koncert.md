<%*
const title = await tp.system.prompt("Název koncertu (program)", "");
const place = await tp.system.prompt("Místo (Profesní dům, Salvátor, …)", "");
const date = await tp.system.prompt("Datum (YYYY-MM-DD)", tp.date.now("YYYY-MM-DD"));
const hasPdf = await tp.system.suggester(["ne","ano"], [false,true], false, "PDF pozvánka?");

const slugify = s => s.normalize("NFD")
  .replace(/[̀-ͯ]/g, "")              // U+0300–U+036F: combining diacritical marks
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const slug = slugify(place);
const filename = `${date}-${slug}`;
await tp.file.rename(filename);
-%>
---
title: "<% title %>"
place: "<% place %>"
date: "<% date %>"
tags: "koncerty"
layout: "concert.njk"
<% hasPdf ? `pdf: "${filename}.pdf"` : `# pdf: "${filename}.pdf"` %>
interpreti: []
templateEngineOverride: njk,md
---

## <% place %>, <adresa>

**Program:**


**Sólisté:**


**Diriguje:** Michael Housa
