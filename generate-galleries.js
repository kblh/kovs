const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = __dirname;
const SOURCE_DIR = path.join(ROOT, "docs/materialy");
const TARGET_DIR = path.join(ROOT, "fotogalerie");

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

const galleries = [
  {
    src: "Historie",
    dest: "historie",
    title: "Historie",
    desc: "Dobové materiály a historické snímky orchestru.",
  },
  {
    src: "Muzeum hudby",
    dest: "muzeum-hudby",
    title: "Muzeum hudby",
    desc: "Fotografie z koncertů v Českém muzeu hudby.",
  },
  {
    src: "Salvátor",
    dest: "salvator",
    title: "Salvátor",
    desc: "Fotografie z kostela Nejsvětějšího Salvátora.",
  },
  {
    src: "Salvátor B&W",
    dest: "salvator-cb",
    title: "Salvátor černobíle",
    desc: "Černobílé snímky ze Salvátora.",
  },
  {
    src: "Různé",
    dest: "ruzne",
    title: "Různé",
    desc: "Ostatní fotografie orchestru.",
  },
];

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

async function processGallery(g) {
  const srcPath = path.join(SOURCE_DIR, g.src);
  const destPath = path.join(TARGET_DIR, g.dest);
  const origPath = path.join(destPath, "orig");
  const thumbsPath = path.join(destPath, "thumbs");

  fs.mkdirSync(origPath, { recursive: true });
  fs.mkdirSync(thumbsPath, { recursive: true });

  const files = fs
    .readdirSync(srcPath)
    .filter((f) => IMAGE_EXT.test(f))
    .sort(naturalSort);

  console.log(`\n=== ${g.title} (${files.length} foto) ===`);

  for (let i = 0; i < files.length; i++) {
    const src = path.join(srcPath, files[i]);
    const name = `image-${String(i + 1).padStart(2, "0")}.jpg`;

    await sharp(src)
      .rotate()
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(path.join(origPath, name));

    await sharp(src)
      .rotate()
      .resize(500, 625, { fit: "cover", position: "attention" })
      .jpeg({ quality: 80 })
      .toFile(path.join(thumbsPath, name));

    process.stdout.write(`  ${files[i]} → ${name}\n`);
  }

  const indexContent = `---
title: "${g.title}"
desc: "${g.desc}"
folder: "fotogalerie/${g.dest}"
tags: "galerie"
layout: "gallery.njk"
templateEngineOverride: njk,md
---
`;
  fs.writeFileSync(path.join(destPath, "index.md"), indexContent);
}

(async () => {
  for (const g of galleries) {
    await processGallery(g);
  }
  console.log("\nHotovo.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
