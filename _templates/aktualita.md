<%*
const title = await tp.system.prompt("Titulek aktuality", "");
const dateFrom = await tp.system.prompt("Date-from (YYYY-MM-DD)", tp.date.now("YYYY-MM-DD"));
const dateTo = await tp.system.prompt("Date-to (YYYY-MM-DD nebo prázdné)", "");

const slugify = s => s.normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const slug = slugify(title);
const filename = `${dateFrom}-${slug}`;
await tp.file.rename(filename);
-%>
---
title: "<% title %>"
date-from: "<% dateFrom %>"
date-to: "<% dateTo %>"
tags: "aktuality"
layout: "aktualita.njk"
templateEngineOverride: njk,md
---

