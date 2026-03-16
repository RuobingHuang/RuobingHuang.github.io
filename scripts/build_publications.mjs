import fs from "node:fs";
import path from "node:path";
import bibtexParse from "bibtex-parse-js";

const siteTitle = "Ruobing Huang";
const bibPath = path.join(process.cwd(), "publications.bib");
const outPath = path.join(process.cwd(), "publications.html");

if (!fs.existsSync(bibPath)) {
  console.error(`Missing ${bibPath}`);
  process.exit(1);
}

const bibRaw = fs.readFileSync(bibPath, "utf8");
const entries = bibtexParse.toJSON(bibRaw) || [];

function getField(e, name) {
  const v = e?.entryTags?.[name];
  return (v ?? "").toString().trim();
}

function normalizeAuthors(authorField) {
  if (!authorField) return "";
  return authorField
    .split(/\s+and\s+/i)
    .map((s) => s.trim())
    .join(", ");
}

function escHtml(s) {
  return (s ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function yearOf(e) {
  const y = getField(e, "year");
  const n = parseInt(y, 10);
  return Number.isFinite(n) ? n : 0;
}

function venueOf(e) {
  return (
    getField(e, "journal") ||
    getField(e, "booktitle") ||
    getField(e, "publisher") ||
    ""
  );
}

function pagesOf(e) {
  const p = getField(e, "pages");
  return p ? p.replaceAll("--", "–") : "";
}

function formatMeta(e) {
  const authors = normalizeAuthors(getField(e, "author"));
  const venue = venueOf(e);
  const year = getField(e, "year");
  const pages = pagesOf(e);

  const parts = [];
  if (authors) parts.push(escHtml(authors) + ".");
  if (venue) parts.push(`<em>${escHtml(venue)}</em>`);
  if (year) parts.push(escHtml(year));
  if (pages) parts.push(escHtml(pages));
  return parts.join(", ");
}

function asBibtexBlock(e) {
  const key = e.citationKey || "unknown";
  const type = (e.entryType || "article").toLowerCase();
  const tags = e.entryTags || {};
  const order = [
    "title",
    "author",
    "journal",
    "booktitle",
    "year",
    "pages",
    "publisher",
    "doi",
    "url",
  ];

  const lines = [];
  for (const k of order) {
    if (tags[k]) lines.push(`  ${k}={${tags[k]}}`);
  }
  for (const k of Object.keys(tags)) {
    if (order.includes(k)) continue;
    lines.push(`  ${k}={${tags[k]}}`);
  }
  return `@${type}{${key},\n${lines.join(",\n")}\n}`;
}

function normalizeDoiToUrl(doiField) {
  const doiRaw = (doiField ?? "").toString().trim();
  if (!doiRaw) return "";
  const cleaned = doiRaw.replace(/^https?:\/\/doi\.org\//i, "").trim();
  return cleaned ? `https://doi.org/${cleaned}` : "";
}

function bestLinkForEntry(e) {
  // Prefer DOI, then URL (support both url and URL)
  const doiUrl = normalizeDoiToUrl(getField(e, "doi"));
  if (doiUrl) return doiUrl;

  const url = getField(e, "url") || getField(e, "URL");
  return url ? url.trim() : "";
}

// Sort by year desc, then title
const sorted = [...entries].sort((a, b) => {
  const ya = yearOf(a),
    yb = yearOf(b);
  if (ya !== yb) return yb - ya;
  const ta = (getField(a, "title") || "").toLowerCase();
  const tb = (getField(b, "title") || "").toLowerCase();
  return ta.localeCompare(tb);
});

// Group by year
const byYear = new Map();
for (const e of sorted) {
  const y = yearOf(e) || "Other";
  if (!byYear.has(y)) byYear.set(y, []);
  byYear.get(y).push(e);
}

const years = Array.from(byYear.keys()).sort((a, b) => {
  if (a === "Other") return 1;
  if (b === "Other") return -1;
  return Number(b) - Number(a);
});

const yearSections = years
  .map((y) => {
    const items = byYear
      .get(y)
      .map((e) => {
        const title = getField(e, "title");
        const key = e.citationKey || "unknown";
        const bib = asBibtexBlock(e);

        const link = bestLinkForEntry(e);
        const titleHtml = link
          ? `<a href="${escHtml(link)}" target="_blank" rel="noopener">${escHtml(
              title || "(untitled)"
            )}</a>`
          : escHtml(title || "(untitled)");

        return `
      <div class="pub" id="${escHtml(key)}">
        <div class="pub-title">${titleHtml}</div>
        <div class="pub-meta">${formatMeta(e)}</div>

        <details style="margin-top:10px;">
          <summary class="btn" style="list-style:none; display:inline-block;">Show BibTeX</summary>
          <div style="margin-top:10px;">
            <button class="btn" data-copy-bibtex="bib-${escHtml(
              key
            )}">Copy BibTeX</button>
            <pre class="bibtex" id="bib-${escHtml(key)}">${escHtml(
          bib
        )}</pre>
          </div>
        </details>
      </div>
    `.trim();
      })
      .join("\n");

    return `
    <h2>${escHtml(String(y))}</h2>
    ${items}
  `.trim();
  })
  .join("\n\n");

const yearSectionsHtml =
  yearSections && yearSections.trim().length > 0
    ? yearSections
    : `<p class="small">No publications found in publications.bib</p>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="assets/style.css" />
  <title>Publications - ${siteTitle}</title>
</head>
<body>
<header>
  <nav>
    <ul>
      <li><a href="index.html">Home</a></li>
      <li><a href="publications.html" aria-current="page">Publications</a></li>
      <li><a href="contact.html">Contact</a></li>
    </ul>
  </nav>
</header>

<main>
  <h1>Publications</h1>

  <div class="card">
    ${yearSectionsHtml}
  </div>

  <div class="footer">
    © <span id="y"></span> ${siteTitle}
  </div>
</main>

<script src="assets/site.js"></script>
<script>document.getElementById("y").textContent = new Date().getFullYear();</script>
</body>
</html>
`;

fs.writeFileSync(outPath, html, "utf8");
console.log(`Wrote ${outPath} from ${bibPath} (${entries.length} entries)`);
