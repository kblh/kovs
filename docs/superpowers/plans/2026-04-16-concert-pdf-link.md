# Concert PDF Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional PDF invitation link to concert pages.

**Architecture:** New `pdf` field in concert frontmatter points to a filename in `koncerty/pdf/`. Eleventy copies that folder to the build output via passthrough copy. The `concert.njk` template conditionally renders a download link when the field is present.

**Tech Stack:** Eleventy (11ty), Nunjucks templates, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-16-concert-pdf-link-design.md`

---

### Task 1: Create PDF folder and add passthrough copy

**Files:**
- Create: `koncerty/pdf/.gitkeep`
- Modify: `eleventy.config.js:31` (after existing passthrough copies)

- [ ] **Step 1: Create the `koncerty/pdf/` directory with a .gitkeep**

```bash
mkdir -p koncerty/pdf
touch koncerty/pdf/.gitkeep
```

The `.gitkeep` ensures the empty folder is tracked by Git.

- [ ] **Step 2: Add passthrough copy to `eleventy.config.js`**

In `eleventy.config.js`, add this line after the existing `addPassthroughCopy` calls (after line 33):

```js
eleventyConfig.addPassthroughCopy("koncerty/pdf");
```

The full passthrough section should look like:

```js
eleventyConfig.addPassthroughCopy("fotogalerie");
eleventyConfig.addPassthroughCopy({
  "node_modules/alpinejs/dist/cdn.min.js": "js/alpine.js",
});
eleventyConfig.addPassthroughCopy("koncerty/pdf");
```

- [ ] **Step 3: Verify the build still works**

Run: `npx @11ty/eleventy`
Expected: Build succeeds with no errors. The `_site/koncerty/pdf/` directory should exist in the output (it will contain only `.gitkeep`).

- [ ] **Step 4: Commit**

```bash
git add koncerty/pdf/.gitkeep eleventy.config.js
git commit -m "feat: add koncerty/pdf folder and passthrough copy"
```

---

### Task 2: Add PDF link to concert template

**Files:**
- Modify: `_includes/concert.njk:41-43` (after the `desc` block)

- [ ] **Step 1: Add conditional PDF link to `_includes/concert.njk`**

After the `{% if desc %}` block (after line 43), add:

```njk
{% if pdf %}
  <a href="{{ baseUrl }}/koncerty/pdf/{{ pdf }}"
     target="_blank"
     class="inline-flex items-center gap-2 text-accent hover:underline mt-4">
    Stáhnout pozvánku (PDF)
  </a>
{% endif %}
```

The full header `<div>` (lines 27-44) should now look like:

```njk
<div class="lg:col-start-2 lg:col-span-9">
  <p class="u-label mb-6 flex items-center gap-3">
    <span class="u-line"></span>
    Koncert
  </p>
  {% if date %}
    <time class="text-muted text-micro uppercase tracking-time block mb-4"
          datetime="{{ date }}">
      {{ date | date }}
    </time>
  {% endif %}
  <h1 class="font-heading text-h1 leading-heading tracking-tight mb-6">
    {{ title }}
  </h1>
  {% if desc %}
    <p class="text-muted text-lg leading-relaxed max-w-xl">{{ desc }}</p>
  {% endif %}
  {% if pdf %}
    <a href="{{ baseUrl }}/koncerty/pdf/{{ pdf }}"
       target="_blank"
       class="inline-flex items-center gap-2 text-accent hover:underline mt-4">
      Stáhnout pozvánku (PDF)
    </a>
  {% endif %}
</div>
```

- [ ] **Step 2: Verify the build still works**

Run: `npx @11ty/eleventy`
Expected: Build succeeds. Concert pages without `pdf` field render as before (no link visible).

- [ ] **Step 3: Commit**

```bash
git add _includes/concert.njk
git commit -m "feat: add conditional PDF link to concert template"
```

---

### Task 3: Add test PDF to a concert and verify

**Files:**
- Modify: `koncerty/2025-11-01-salvator.md:1-8` (frontmatter)
- Create: `koncerty/pdf/2025-11-01-salvator.pdf` (test PDF)

- [ ] **Step 1: Create a dummy test PDF**

```bash
echo "%PDF-1.0 test" > koncerty/pdf/2025-11-01-salvator.pdf
```

This creates a minimal file to test the link. Replace with a real PDF later.

- [ ] **Step 2: Add `pdf` field to Salvátor concert frontmatter**

In `koncerty/2025-11-01-salvator.md`, add `pdf` field to the frontmatter:

```yaml
---
title: "Salvátor 25"
desc: "Dvořák - Stabat MAter"
date: "2025-11-01"
tags: "koncerty"
layout: "concert.njk"
templateEngineOverride: njk,md
pdf: "2025-11-01-salvator.pdf"
---
```

- [ ] **Step 3: Build and verify the link appears**

Run: `npx @11ty/eleventy --serve`

1. Open `http://localhost:8080/koncerty/2025-11-01-salvator/` in a browser
2. Verify the "Stáhnout pozvánku (PDF)" link appears below the description
3. Verify clicking the link opens/downloads the PDF file
4. Open another concert page (e.g., `http://localhost:8080/koncerty/2026-03-30-salvator/`) and verify NO PDF link is shown (since it has no `pdf` field)

- [ ] **Step 4: Commit**

```bash
git add koncerty/pdf/2025-11-01-salvator.pdf koncerty/2025-11-01-salvator.md
git commit -m "feat: add test PDF to Salvátor concert"
```

- [ ] **Step 5: Remove dummy PDF (cleanup)**

After verifying everything works, remove the dummy test PDF and the `pdf` field from frontmatter — these were just for verification. When a real pozvánka PDF exists, add it the same way.

```bash
rm koncerty/pdf/2025-11-01-salvator.pdf
```

Revert `koncerty/2025-11-01-salvator.md` frontmatter back to original (remove the `pdf` line).

```bash
git add koncerty/pdf/2025-11-01-salvator.pdf koncerty/2025-11-01-salvator.md
git commit -m "chore: remove test PDF after verification"
```
