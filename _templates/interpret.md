<%*
const name = await tp.system.prompt("Jméno (Křestní Příjmení)", "");
const instrument = await tp.system.prompt("Nástroj/role (klavír, housle, dirigent, …)", "");

const slugify = s => s.normalize("NFD")
  .replace(/[̀-ͯ]/g, "")              // U+0300–U+036F: combining diacritical marks
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const slug = slugify(name);
await tp.file.rename(slug);
-%>
---
name: "<% name %>"
instrument: "<% instrument %>"
slug: "<% slug %>"
photo: "<% slug %>"
tags: "interpreti"
layout: "interpret.njk"
templateEngineOverride: njk,md
---

