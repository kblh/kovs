export function extractPlace(headingLine) {
  const withoutMarker = headingLine.replace(/^##\s*/, "");
  const firstComma = withoutMarker.indexOf(",");
  const raw = firstComma === -1 ? withoutMarker : withoutMarker.slice(0, firstComma);
  return raw.trim();
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
const KEY_ORDER = ["title", "place", "date", "tags", "layout", "pdf", "templateEngineOverride"];

function parseFrontmatter(block) {
  const entries = [];
  for (const line of block.split("\n")) {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!match) continue;
    entries.push([match[1], match[2]]);
  }
  return Object.fromEntries(entries);
}

function serializeFrontmatter(obj) {
  const lines = [];
  for (const key of KEY_ORDER) {
    if (obj[key] === undefined) continue;
    lines.push(`${key}: ${obj[key]}`);
  }
  return lines.join("\n");
}

export function rewriteFrontmatter(fileText) {
  const m = fileText.match(FRONTMATTER_RE);
  if (!m) throw new Error("No frontmatter delimited by --- found");
  const [, block, body] = m;
  const data = parseFrontmatter(block);

  const headingMatch = body.match(/^##\s+(.+)$/m);
  if (!headingMatch) throw new Error("No ## heading found in body");
  const placeValue = extractPlace(headingMatch[0]);

  const newData = {
    title: data.desc,
    place: `"${placeValue}"`,
    date: data.date,
    tags: data.tags,
    layout: data.layout,
    pdf: data.pdf,
    templateEngineOverride: data.templateEngineOverride,
  };

  const newBlock = serializeFrontmatter(newData);
  return `---\n${newBlock}\n---\n${body}`;
}
