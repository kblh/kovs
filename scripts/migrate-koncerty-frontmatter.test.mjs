import { test } from "node:test";
import assert from "node:assert/strict";
import { extractPlace, rewriteFrontmatter } from "./migrate-koncerty-frontmatter.mjs";

test("extractPlace: bere část před první čárkou", () => {
  assert.equal(
    extractPlace("## Kostel ČCE U Salvátora, Salvátorská 1, Praha 1, Staré Město"),
    "Kostel ČCE U Salvátora"
  );
});

test("extractPlace: bez čárky vrací celý nadpis", () => {
  assert.equal(extractPlace("## České muzeum hudby"), "České muzeum hudby");
});

test("extractPlace: trimuje whitespace", () => {
  assert.equal(extractPlace("##   Zpěvácký spolek Hlahol   "), "Zpěvácký spolek Hlahol");
});

test("extractPlace: respektuje uvozovky v nadpisu", () => {
  assert.equal(
    extractPlace("## Konferenční a společenské centrum „Profesní dům\" (refektář)"),
    "Konferenční a společenské centrum „Profesní dům\" (refektář)"
  );
});

const SAMPLE_WITH_PDF = `---
title: "Salvátor"
desc: "Corelli, Mozart, Vivaldi"
date: "2025-12-15"
tags: "koncerty"
layout: "concert.njk"
pdf: "2025-12-15-salvator.pdf"
templateEngineOverride: njk,md
---

## Kostel ČCE U Salvátora, Salvátorská 1, Praha 1, Staré Město

**Program:** A. Corelli: Concerto grosso č. 8
`;

const EXPECTED_WITH_PDF = `---
title: "Corelli, Mozart, Vivaldi"
place: "Kostel ČCE U Salvátora"
date: "2025-12-15"
tags: "koncerty"
layout: "concert.njk"
pdf: "2025-12-15-salvator.pdf"
templateEngineOverride: njk,md
---

## Kostel ČCE U Salvátora, Salvátorská 1, Praha 1, Staré Město

**Program:** A. Corelli: Concerto grosso č. 8
`;

test("rewriteFrontmatter: prohodí title/desc, přejmenuje na place, zachová pdf", () => {
  assert.equal(rewriteFrontmatter(SAMPLE_WITH_PDF), EXPECTED_WITH_PDF);
});

const SAMPLE_NO_PDF = `---
title: "Muzeum hudby"
desc: "Grieg, Britten, Sarasate, Wirén"
date: "2018-06-25"
tags: "koncerty"
layout: "concert.njk"
templateEngineOverride: njk,md
---

## České muzeum hudby

**Program:** E. Grieg - Suita
`;

const EXPECTED_NO_PDF = `---
title: "Grieg, Britten, Sarasate, Wirén"
place: "České muzeum hudby"
date: "2018-06-25"
tags: "koncerty"
layout: "concert.njk"
templateEngineOverride: njk,md
---

## České muzeum hudby

**Program:** E. Grieg - Suita
`;

test("rewriteFrontmatter: funguje bez pdf", () => {
  assert.equal(rewriteFrontmatter(SAMPLE_NO_PDF), EXPECTED_NO_PDF);
});

test("rewriteFrontmatter: vyhodí chybu když není ## heading", () => {
  const bad = `---
title: "X"
desc: "Y"
---

žádný heading tady
`;
  assert.throws(() => rewriteFrontmatter(bad), /heading/i);
});
