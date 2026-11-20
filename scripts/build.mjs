import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist");
const site = JSON.parse(
  await readFile(resolve(root, "src/data/site.json"), "utf8"),
);
const { categories, articles } = JSON.parse(
  await readFile(resolve(root, "src/data/content.json"), "utf8"),
);
const siteURL = new URL(process.env.SITE_URL || site.url);
if (!["http:", "https:"].includes(siteURL.protocol))
  throw new Error("SITE_URL must use http or https");
const base = siteURL.pathname.replace(/\/$/, "") + "/";
siteURL.pathname = base;
const href = (path = "") => base + path.replace(/^\//, "");
const absolute = (path = "") => new URL(href(path), siteURL.origin).href;
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const articlePath = (a) => `${a.category}/${a.slug}/`;
const bySlug = (slug) => articles.find((a) => a.slug === slug);
const categoryOf = (id) => categories.find((c) => c.id === id);
const date = (value) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"));
const readingTime = (a) =>
  typeof a.readTime === "number"
    ? `${a.readTime} min read`
    : a.readTime || "4 min read";
const icons = {
  mushroom:
    '<path d="M3 13a9 9 0 0 1 18 0H3Z"/><path d="m9 13-1 8h8l-1-8"/><path d="M8 9h.01M14 7h.01M16 10h.01"/>',
  mushrooms:
    '<path d="M3 13a9 9 0 0 1 18 0H3Z"/><path d="m9 13-1 8h8l-1-8"/><path d="M8 9h.01M14 7h.01M16 10h.01"/>',
  guides:
    '<path d="M4 3h6a3 3 0 0 1 3 3v15a4 4 0 0 0-4-3H4V3ZM20 3h-4a3 3 0 0 0-3 3v15a4 4 0 0 1 4-3h3V3Z"/>',
  mechanics:
    '<path d="M12 3v5m0 8v5M3 12h5m8 0h5"/><circle cx="12" cy="12" r="4"/><path d="m5 5 3 3m8 8 3 3M5 19l3-3M16 8l3-3"/>',
  updates: '<path d="M4 7h13l-4-4M20 17H7l4 4M20 7v5M4 17v-5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  external: '<path d="M14 3h7v7m0-7L10 14"/><path d="M10 3H4v17h17v-6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  leaf: '<path d="M20 3C5 2 1 12 6 17s15 1 14-14ZM6 18l9-9"/>',
};
const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.leaf}</svg>`;
const external = (url, label, cls = "") =>
  `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}${icon("external")}</a>`;

// Reject invalid content at build time rather than shipping broken category or related links.
const seen = new Set();
for (const a of articles) {
  if (!categoryOf(a.category))
    throw new Error(`Unknown category for ${a.slug}`);
  if (!/^[a-z0-9-]+$/.test(a.slug) || seen.has(a.slug))
    throw new Error(`Invalid or duplicate slug: ${a.slug}`);
  seen.add(a.slug);
  const ids = new Set([
    "main",
    "article-sources",
    "search-dialog",
    "search-title",
    "search-input",
    "search-status",
    "search-results",
  ]);
  for (const s of a.sections) {
    if (!/^[a-z0-9-]+$/.test(s.id) || ids.has(s.id))
      throw new Error(`Invalid section: ${a.slug}/${s.id}`);
    ids.add(s.id);
  }
  for (const slug of a.related || [])
    if (!bySlug(slug)) throw new Error(`Missing related article: ${slug}`);
}

const logo = `<span class="logo-mark">${icon("mushroom")}</span><span class="wordmark">Mycelarium<span>WIKI & FIELD GUIDE</span></span>`;
const navLinks = (active) =>
  `<a href="${href()}" ${active === "" ? 'aria-current="page"' : ""}>${site.ui.home}</a>${categories.map((c) => `<a href="${href(c.id + "/")}" ${active === c.id ? 'aria-current="page"' : ""}>${esc(c.title)}</a>`).join("")}<a href="${href("about/")}" ${active === "about" ? 'aria-current="page"' : ""}>${site.ui.about}</a>`;
const header = (active) =>
  `<a href="#main" class="skip-link">${site.ui.skip}</a><header class="site-header"><div class="container header-inner"><a class="logo" href="${href()}" aria-label="Mycelarium Wiki home">${logo}</a><nav class="desktop-nav" aria-label="Main navigation">${navLinks(active)}</nav><div class="header-tools"><button class="search-trigger icon-button" data-open-search aria-label="${site.ui.search}">${icon("search")}<span>Search</span><kbd>/</kbd></button><button class="icon-button theme-toggle" aria-label="${site.ui.theme}" title="${site.ui.theme}">${icon("sun")}</button><details class="mobile-menu"><summary aria-label="Open navigation">${site.ui.menu}</summary><nav aria-label="Mobile navigation">${navLinks(active)}</nav></details></div></div></header>`;
const footer = `<footer class="site-footer"><div class="container footer-grid"><div><a class="logo" href="${href()}">${logo}</a><p>A field guide to the world<br>beneath your feet.</p></div><div><h2>Explore the wiki</h2>${categories.map((c) => `<a href="${href(c.id + "/")}">${esc(c.title)}</a>`).join("")}</div><div><h2>Out in the wild</h2>${external(site.steam, "Mycelarium on Steam")}${external(site.repository, "Source on GitHub")}<a href="${href("about/")}">About this project</a></div><div class="footer-related"><h2>More Mycelarium</h2><p>Visit our companion wiki for more guides and references.</p>${external(site.relatedSite, "mycelarium.top", "text-link")}</div></div><div class="container footer-bottom"><p>${site.ui.footerNotice}</p><span>© ${new Date(site.reviewed).getUTCFullYear()} Juary · Code: MIT</span></div></footer>`;
const dialog = `<dialog id="search-dialog" class="search-dialog" aria-labelledby="search-title"><div class="search-heading"><h2 id="search-title">${site.ui.search}</h2><button class="icon-button" data-close-search aria-label="${site.ui.close}">${icon("close")}</button></div><label class="search-field">${icon("search")}<span class="sr-only">${site.ui.search}</span><input id="search-input" type="search" autocomplete="off" placeholder="${esc(site.ui.searchPlaceholder)}"></label><p id="search-status" aria-live="polite">${site.ui.searchHint}</p><div id="search-results"></div></dialog>`;
const themeInit = `try{const t=localStorage.getItem('mycelarium-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}`;

function page({
  title,
  description = site.description,
  path = "",
  active = "",
  body,
  type = "WebPage",
  article,
  noindex = false,
}) {
  const jsonld = {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url: absolute(path),
    inLanguage: "en",
    ...(article
      ? {
          headline: title,
          dateModified: article.updated,
          author: { "@type": "Person", name: "Juary" },
        }
      : {}),
  };
  return `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}${path ? " | Mycelarium Wiki" : ""}</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#101c19"><meta name="color-scheme" content="dark light">${noindex ? '<meta name="robots" content="noindex, follow">' : ""}<link rel="canonical" href="${absolute(path)}"><link rel="icon" type="image/svg+xml" href="${href("assets/favicon.svg")}"><meta property="og:type" content="${article ? "article" : "website"}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${absolute(path)}"><meta property="og:site_name" content="Mycelarium Wiki"><meta property="og:image" content="${absolute("assets/forest.webp")}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="960"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${absolute("assets/forest.webp")}"><script>${themeInit}</script><link rel="stylesheet" href="${href("assets/style.css")}"><script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script><script type="module" src="${href("assets/app.js")}"></script></head><body data-base="${base}">${header(active)}${body}${footer}${dialog}</body></html>`;
}
const breadcrumb = (title, category) =>
  `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${href()}">Home</a>${icon("chevron")}${category ? `<a href="${href(category.id + "/")}">${esc(category.title)}</a>${icon("chevron")}` : ""}<span aria-current="page">${esc(title)}</span></nav>`;
function card(a, index = 0) {
  return `<a class="article-card" href="${href(articlePath(a))}"><div class="card-top"><span class="eyebrow">${esc(categoryOf(a.category).title)}</span><span class="card-index">${String(index + 1).padStart(2, "0")}</span></div><h3>${esc(a.title)}</h3><p>${esc(a.description)}</p><span class="card-bottom">${esc(readingTime(a))}${icon("arrow")}</span></a>`;
}
const imageByCategory = {
  guides: "gameplay-0.webp",
  mushrooms: "forest.webp",
  mechanics: "gameplay-1.webp",
  updates: "gameplay-4.webp",
};
const sectionTitle = (small, title, url, label = "Explore all") =>
  `<div class="section-heading"><div><span class="eyebrow">${small}</span><h2>${title}</h2></div>${url ? `<a class="text-link" href="${url}">${label}${icon("arrow")}</a>` : ""}</div>`;

function home() {
  const beginner = bySlug("beginner-guide") || articles[0];
  const starters = ["resources", "mushroom-types", "game-modes"]
    .map(bySlug)
    .filter(Boolean);
  const body = `<main id="main"><section class="hero"><div class="hero-art"><img src="${href("assets/forest.webp")}" alt="Luminous mushrooms in a forest, official Mycelarium promotional artwork" width="1200" height="960" fetchpriority="high"></div><div class="container hero-inner"><div class="hero-copy"><span class="eyebrow hero-eyebrow"><span class="live-dot"></span> THE MYCELARIUM FIELD GUIDE</span><h1>A small spore.<br>A whole <em>living world.</em></h1><p>Find your footing beneath the forest floor. A thoughtfully curated wiki for Mycelarium’s mushrooms, underground networks, and delicate ecosystems.</p><div class="hero-actions"><a class="button primary" href="${href(articlePath(beginner))}">Start growing${icon("arrow")}</a><a class="button secondary" href="#explore">Explore the wiki</a></div><div class="hero-note">${icon("leaf")}Independent fan wiki · PLAN KAPKAN’s Mycelarium</div></div><div class="art-caption"><span>FIELD NOTE / 001</span>Everything is connected.</div></div></section><div class="facts-strip"><div class="container"><span>${icon("check")} Source-led guides</span><span>${icon("mushroom")} ${articles.length} pages to explore</span><span>${icon("guides")} English edition</span>${external(site.steam, "Find the game on Steam")}</div></div><div class="container home-layout"><div class="home-main"><section class="getting-started">${sectionTitle("YOUR FIRST STEPS", "Every ecosystem starts somewhere.", href("guides/"), "All guides")}<div class="start-grid"><a class="featured-guide" href="${href(articlePath(beginner))}"><img src="${href("assets/gameplay-0.webp")}" alt="Mycelarium gameplay showing a growing underground network" width="1920" height="1080" loading="lazy"><div class="featured-copy"><span class="eyebrow">START HERE</span><h3>The beginner’s<br>field guide</h3><p>From your first network to understanding what keeps it alive.</p><span class="text-link">Read the guide${icon("arrow")}</span></div></a><div class="starter-list">${starters.map((a) => `<a href="${href(articlePath(a))}"><span class="mini-icon">${icon(a.category)}</span><div><span class="eyebrow">${esc(categoryOf(a.category).title)}</span><h3>${esc(a.title)}</h3><p>${esc(a.description)}</p></div>${icon("arrow")}</a>`).join("")}</div></div></section><section id="explore" class="explore-section">${sectionTitle("FOLLOW YOUR CURIOSITY", "Explore the ecosystem.")}<div class="category-grid">${categories.map((c, i) => `<a class="category-card" href="${href(c.id + "/")}"><span class="category-icon">${icon(c.id)}</span><span class="category-number">0${i + 1}</span><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><span class="text-link">${articles.filter((a) => a.category === c.id).length} field notes${icon("arrow")}</span></a>`).join("")}</div></section><section class="latest-section">${sectionTitle("FROM THE DEVELOPER", "Notes from a changing world.", href("updates/"), "All updates")}<div class="article-grid two">${articles
    .filter((a) => a.category === "updates")
    .map(card)
    .join(
      "",
    )}</div></section></div><aside class="home-aside"><section class="dossier"><div class="dossier-title">${icon("mushroom")}<span>THE GAME AT A GLANCE</span></div><h2>Mycelarium</h2><p>Grow a fungal network. Discover what lies below. Keep a small world in balance.</p><dl><div><dt>Developer</dt><dd>PLAN KAPKAN</dd></div><div><dt>Genre</dt><dd>Ecosystem simulation</dd></div><div><dt>Platform</dt><dd>Windows / Steam</dd></div><div><dt>Released</dt><dd>Nov 3, 2026</dd></div><div><dt>Play style</dt><dd>Single-player</dd></div></dl>${external(site.steam, "View on Steam", "button secondary full")}${external(site.demo, "Try the free demo", "subtle-link")}</section><section class="quick-links"><h2>A few good places to start</h2>${[
    "light-mushroom",
    "mycelium-upgrades",
    "achievements",
    "update-1-03",
  ]
    .map(bySlug)
    .filter(Boolean)
    .map(
      (a) =>
        `<a href="${href(articlePath(a))}">${esc(a.title)}${icon("chevron")}</a>`,
    )
    .join(
      "",
    )}</section><section class="companion"><span class="eyebrow">GROW YOUR KNOWLEDGE</span><h2>More to discover.</h2><p>Visit our companion Mycelarium Wiki for more guides and references.</p>${external(site.relatedSite, "mycelarium.top", "text-link")}</section><p class="editorial-note">Our notes draw on official store pages, published achievements, and developer announcements. Source review: ${date(site.reviewed)}.</p></aside></div><section class="bottom-banner"><div class="container"><div><span class="eyebrow">A WIKI THAT KEEPS GROWING</span><h2>Good knowledge takes root.</h2><p>Have a correction or a discovery to share? Help make this field guide better.</p></div>${external(site.repository + "/issues", "Contribute on GitHub", "button secondary")}</div></section></main>`;
  return page({
    title: "Mycelarium Wiki — A Field Guide to a Living World",
    body,
  });
}
function categoryPage(c) {
  const entries = articles.filter((a) => a.category === c.id);
  return page({
    title: `${c.title} — Mycelarium Field Guide`,
    description: c.description,
    path: c.id + "/",
    active: c.id,
    body: `<main id="main" class="container page-main">${breadcrumb(c.title)}<header class="page-heading"><span class="eyebrow">${icon(c.id)} THE FIELD GUIDE / ${entries.length} PAGES</span><h1>${esc(c.title)}</h1><p>${esc(c.description)}</p></header><div class="article-grid">${entries.map(card).join("")}</div><div class="category-bottom"><p>New to the forest floor?</p><a class="text-link" href="${href("guides/beginner-guide/")}">Begin with the beginner’s guide${icon("arrow")}</a></div></main>`,
  });
}
function articlePage(a) {
  const category = categoryOf(a.category);
  const toc = a.sections
    .map((s) => `<a href="#${esc(s.id)}">${esc(s.title)}</a>`)
    .join("");
  const body = `<main id="main" class="container page-main article-page">${breadcrumb(a.title, category)}<div class="article-layout"><article><header class="article-heading"><a class="eyebrow" href="${href(category.id + "/")}">${esc(category.title)} / FIELD NOTES</a><h1>${esc(a.title)}</h1><p class="article-intro">${esc(a.description)}</p><div class="article-meta"><span>By Juary</span><span>Reviewed ${date(a.updated)}</span><span>${esc(readingTime(a))}</span></div></header><figure class="article-visual"><img src="${href("assets/" + imageByCategory[a.category])}" alt="${a.category === "mushrooms" ? "Official Mycelarium forest and mushroom promotional artwork" : "Official Mycelarium gameplay screenshot from the Steam store"}" width="${a.category === "mushrooms" ? 1200 : 1920}" height="${a.category === "mushrooms" ? 960 : 1080}"><figcaption>Official ${a.category === "mushrooms" ? "promotional artwork" : "game screenshot"} · Mycelarium / PLAN KAPKAN</figcaption></figure><details class="mobile-toc"><summary>${site.ui.onThisPage}</summary><nav aria-label="Article sections">${toc}</nav></details><div class="prose">${a.sections.map((s) => `<section id="${esc(s.id)}"><h2>${esc(s.title)}</h2>${(s.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("")}${s.bullets ? `<ul>${s.bullets.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}${s.table ? `<div class="table-scroll"><table><thead><tr>${s.table.headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${s.table.rows.map((row) => `<tr>${row.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}</section>`).join("")}<section id="article-sources" class="source-section"><span class="eyebrow">CHECK THE ROOTS</span><h2>${site.ui.sources}</h2><ul>${a.sources.map((s) => `<li>${external(s.url, esc(s.title))}</li>`).join("")}</ul><p class="source-disclaimer">This independent reference summarizes published sources. Source review does not imply hands-on gameplay testing. Updates may change behavior.</p></section></div><section class="related-section">${sectionTitle("NEXT IN THE FIELD GUIDE", site.ui.related)}<div class="article-grid two">${(a.related || []).slice(0, 2).map(bySlug).filter(Boolean).map(card).join("")}</div></section></article><aside class="article-aside"><div class="toc"><span class="eyebrow">${site.ui.onThisPage}</span><nav aria-label="Table of contents">${toc}<a href="#article-sources">Sources & further reading</a></nav><a class="back-top" href="#main">↑ ${site.ui.backToTop}</a></div><section class="companion"><span class="eyebrow">THE COMPANION WIKI</span><h2>Keep digging.</h2><p>Find more Mycelarium guides and references.</p>${external(site.relatedSite, "mycelarium.top", "text-link")}</section></aside></div></main>`;
  return page({
    title: a.title,
    description: a.description,
    path: articlePath(a),
    active: a.category,
    body,
    type: "Article",
    article: a,
  });
}
function aboutPage() {
  return page({
    title: "About this project",
    description:
      "Meet mycelariumwiki, an independent English Mycelarium fan wiki by Juary, hosted on GitHub Pages with a companion site at mycelarium.top.",
    path: "about/",
    active: "about",
    body: `<main id="main" class="container page-main">${breadcrumb("About")}<header class="page-heading"><span class="eyebrow">A LITTLE ABOUT OUR ROOTS</span><h1>A field guide,<br>grown in the open.</h1><p>Mycelarium Wiki is an independent fan project by Juary, made to help curious players understand the world beneath the forest floor.</p></header><div class="about-layout"><div class="prose"><section><h2>What is mycelariumwiki?</h2><p>This project is an English-language wiki for Mycelarium, the incremental ecosystem simulation developed and published by PLAN KAPKAN. It covers the full Windows game on Steam (app 5181520), alongside clearly identified notes about the separate free demo (app 5371480).</p><p>Our field guide brings beginner advice, mushroom references, ecosystem mechanics, published achievement conditions, and developer update summaries into one quiet place to read. It is a static website, published openly through GitHub Pages.</p></section><section><h2>Two places to explore Mycelarium</h2><p>This GitHub Pages project and the companion website below are maintained as separate websites. Both are independent of the game developer.</p><div class="about-link-card"><span class="eyebrow">YOU ARE HERE / GITHUB PAGES</span>${external(site.url, "juary.github.io/mycelariumwiki/", "text-link")}<p>The open-source field guide and the public website for this repository.</p></div><div class="about-link-card accent"><span class="eyebrow">THE COMPANION MYCELARIUM WIKI</span>${external(site.relatedSite, "https://mycelarium.top/", "text-link")}<p>Visit Mycelarium Wiki for additional game guides and references.</p></div></section><section><h2>How we put the guide together</h2><p>We prioritize official Steam store information, developer announcements, and published achievement descriptions. Each article lists its sources and review date. Suggestions are distinguished from confirmed mechanics, and source checking is never presented as hands-on testing.</p><p>Mycelarium shares its name with other projects. Our scope is specifically PLAN KAPKAN’s game. Patch summaries name their version so historical behavior is not mistaken for a current guarantee.</p></section><section><h2>Artwork & credits</h2><p>Mycelarium promotional artwork and Steam screenshots are credited to PLAN KAPKAN and their respective owners. They are used to identify and discuss the game and are not covered by this project’s MIT code license. This website is not affiliated with or endorsed by PLAN KAPKAN or Valve.</p></section><section><h2>Help the guide grow</h2><p>Found an unclear explanation or a detail that changed after a patch? Open an issue with the page URL, game version, and a reliable source. Contributions that make the guide more accurate and useful are welcome.</p>${external(site.repository, "Browse the project on GitHub", "button secondary")}</section></div><aside class="about-aside"><section class="dossier"><div class="dossier-title">${icon("leaf")}<span>PROJECT DETAILS</span></div><dl><div><dt>Project</dt><dd>mycelariumwiki</dd></div><div><dt>Maintainer</dt><dd>Juary</dd></div><div><dt>Language</dt><dd>English</dd></div><div><dt>Hosting</dt><dd>GitHub Pages</dd></div><div><dt>Code license</dt><dd>MIT</dd></div></dl>${external(site.repository, "Source on GitHub", "text-link")}</section></aside></div></main>`,
  });
}

// A clean build cannot retain pages removed from the content registry.
if (output !== resolve(root, "dist") || dirname(output) !== root)
  throw new Error("Unexpected output directory");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, "public"), output, { recursive: true });
await cp(
  resolve(root, "src/styles/style.css"),
  resolve(output, "assets/style.css"),
);
await cp(resolve(root, "src/scripts/app.js"), resolve(output, "assets/app.js"));
const writePage = async (path, html) => {
  const file = resolve(output, path, "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
};
await writePage("", home());
for (const c of categories) await writePage(c.id, categoryPage(c));
for (const a of articles) await writePage(articlePath(a), articlePage(a));
await writePage("about", aboutPage());
await writeFile(
  resolve(output, "404.html"),
  page({
    title: "Page not found",
    path: "404.html",
    noindex: true,
    body: `<main id="main" class="container not-found"><span class="eyebrow">FIELD NOTE / 404</span><h1>A path yet to be found.</h1><p>This page may have moved. There is still plenty to explore in the field guide.</p><a class="button primary" href="${href()}">Back to the wiki${icon("arrow")}</a></main>`,
  }),
);
await writeFile(
  resolve(output, "search-index.json"),
  JSON.stringify({
    ui: site.ui,
    articles: articles.map((a) => ({
      title: a.title,
      description: a.description,
      category: categoryOf(a.category).title,
      url: href(articlePath(a)),
      text: a.sections
        .flatMap((s) => [
          s.title,
          ...(s.paragraphs || []),
          ...(s.bullets || []),
          ...(s.table?.rows.flat() || []),
        ])
        .join(" "),
    })),
  }),
);
const paths = [
  "",
  "about/",
  ...categories.map((c) => c.id + "/"),
  ...articles.map(articlePath),
];
await writeFile(
  resolve(output, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${esc(absolute(p))}</loc></url>`).join("")}</urlset>`,
);
await writeFile(
  resolve(output, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${absolute("sitemap.xml")}\n`,
);
await writeFile(resolve(output, ".nojekyll"), "");
console.log(`Built ${paths.length} pages + 404 at ${siteURL.href}`);
