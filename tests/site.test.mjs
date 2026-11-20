import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";

const project = resolve(import.meta.dirname, "..");
const output = resolve(project, "dist");
const config = JSON.parse(
  await readFile(resolve(project, "src/data/site.json"), "utf8"),
);
const content = JSON.parse(
  await readFile(resolve(project, "src/data/content.json"), "utf8"),
);
const origin = new URL(process.env.SITE_URL || config.url);
const base = origin.pathname.replace(/\/$/, "") + "/";
origin.pathname = base;
const read = (file) => readFile(resolve(output, file), "utf8");
const decode = (text) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
const attribute = (tag, name) =>
  decode(tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] || "");
const tags = (html, tag) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "g"))].map((m) => m[0]);

async function filesUnder(path) {
  const entries = await readdir(path, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? filesUnder(resolve(path, entry.name))
          : [resolve(path, entry.name)],
      ),
    )
  ).flat();
}
const htmlFiles = (await filesUnder(output)).filter((f) => f.endsWith(".html"));
const pages = new Map(
  await Promise.all(
    htmlFiles.map(async (file) => [
      relative(output, file).split(sep).join("/"),
      await readFile(file, "utf8"),
    ]),
  ),
);
const ids = new Map(
  [...pages].map(([path, html]) => [
    path,
    new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => decode(m[1]))),
  ]),
);
const articleURL = (a) => `${base}${a.category}/${a.slug}/`;

test("the content registry has populated categories, distinct articles, sources, and useful related links", () => {
  const categories = new Set(content.categories.map((c) => c.id));
  const articles = new Set(content.articles.map((a) => a.slug));
  assert.equal(
    categories.size,
    content.categories.length,
    "category IDs are unique",
  );
  assert.equal(
    articles.size,
    content.articles.length,
    "article slugs are unique",
  );
  for (const category of categories)
    assert.ok(
      content.articles.some((a) => a.category === category),
      `empty category: ${category}`,
    );
  for (const article of content.articles) {
    assert.ok(
      categories.has(article.category),
      `unknown category: ${article.slug}`,
    );
    assert.ok(article.sources.length > 0, `sources missing: ${article.slug}`);
    assert.ok(
      article.sources.some((s) =>
        [
          "store.steampowered.com",
          "steamcommunity.com",
          "api.steampowered.com",
        ].includes(new URL(s.url).hostname),
      ),
      `no primary source: ${article.slug}`,
    );
    for (const source of article.sources)
      assert.equal(
        new URL(source.url).protocol,
        "https:",
        `insecure source: ${source.url}`,
      );
    assert.ok(
      article.related.length > 0,
      `related articles missing: ${article.slug}`,
    );
    for (const related of article.related) {
      assert.ok(articles.has(related), `missing related article: ${related}`);
      assert.notEqual(
        related,
        article.slug,
        `self-related article: ${related}`,
      );
    }
    assert.ok(
      article.sections.length >= 2,
      `article needs meaningful sections: ${article.slug}`,
    );
  }
});

test("all generated links, scripts, images, and fragment targets resolve inside the project path", async () => {
  let checked = 0;
  for (const [path, html] of pages) {
    const pageURL = new URL(
      base + (path === "index.html" ? "" : path.replace(/index\.html$/, "")),
      origin.origin,
    );
    for (const tag of [
      ...tags(html, "a"),
      ...tags(html, "link"),
      ...tags(html, "script"),
      ...tags(html, "img"),
    ]) {
      const raw = attribute(
        tag,
        tag.startsWith("<a") || tag.startsWith("<link") ? "href" : "src",
      );
      if (!raw || /^(?:mailto:|tel:|data:)/.test(raw)) continue;
      const url = new URL(raw, pageURL);
      if (url.origin !== origin.origin) continue;
      assert.ok(
        url.pathname.startsWith(base),
        `${path}: ${raw} escapes the GitHub Pages project path`,
      );
      let target = decodeURIComponent(url.pathname.slice(base.length));
      if (!target || target.endsWith("/")) target += "index.html";
      const absolute = resolve(output, target);
      assert.ok(
        absolute.startsWith(output + sep),
        `${path}: ${raw} escapes the output directory`,
      );
      assert.ok(
        (await stat(absolute)).isFile(),
        `${path}: missing target ${raw}`,
      );
      if (url.hash && target.endsWith(".html"))
        assert.ok(
          ids.get(target)?.has(decodeURIComponent(url.hash.slice(1))),
          `${path}: missing fragment target ${raw}`,
        );
      checked++;
    }
    const allIds = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(
      new Set(allIds).size,
      allIds.length,
      `${path}: duplicate HTML IDs`,
    );
    assert.equal(
      tags(html, "h1").length,
      1,
      `${path}: each page needs exactly one H1`,
    );
  }
  assert.ok(checked > 500, `link audit unexpectedly small: ${checked}`);
});

test("every page has base-aware canonical and social metadata plus valid structured data", () => {
  for (const [path, html] of pages) {
    const pagePath =
      path === "index.html" ? "" : path.replace(/index\.html$/, "");
    const expected = new URL(base + pagePath, origin.origin).href;
    const canonical = tags(html, "link").find(
      (tag) => attribute(tag, "rel") === "canonical",
    );
    assert.equal(
      attribute(canonical, "href"),
      expected,
      `${path}: canonical URL`,
    );
    const meta = new Map(
      tags(html, "meta").map((tag) => [
        attribute(tag, "property") || attribute(tag, "name"),
        attribute(tag, "content"),
      ]),
    );
    assert.equal(meta.get("og:url"), expected, `${path}: Open Graph URL`);
    assert.equal(
      meta.get("og:image"),
      new URL(base + "assets/forest.webp", origin.origin).href,
      `${path}: absolute share image`,
    );
    assert.equal(
      meta.get("twitter:image"),
      meta.get("og:image"),
      `${path}: Twitter image`,
    );
    assert.ok(
      meta.get("description")?.length > 30,
      `${path}: missing description`,
    );
    assert.match(html, /<html lang="en"/, `${path}: English document language`);
    const json = html.match(
      /<script type="application\/ld\+json">(.*?)<\/script>/s,
    )?.[1];
    const data = JSON.parse(json);
    assert.equal(data.url, expected, `${path}: structured URL`);
    assert.equal(data.inLanguage, "en");
    if (path === "404.html")
      assert.equal(meta.get("robots"), "noindex, follow");
    else
      assert.notEqual(
        meta.get("robots"),
        "noindex, follow",
        `${path}: useful page incorrectly noindexed`,
      );
  }
});

test("the sitemap contains exactly the generated public pages and excludes the 404", async () => {
  const sitemap = await read("sitemap.xml");
  const actual = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((m) => decode(m[1]))
    .sort();
  const expected = [...pages.keys()]
    .filter((p) => p !== "404.html")
    .map(
      (p) =>
        new URL(
          base + (p === "index.html" ? "" : p.replace(/index\.html$/, "")),
          origin.origin,
        ).href,
    )
    .sort();
  assert.deepEqual(actual, expected);
  assert.equal(
    actual.length,
    2 + content.categories.length + content.articles.length,
  );
  assert.equal(new Set(actual).size, actual.length, "duplicate sitemap URLs");
  assert.match(
    await read("robots.txt"),
    new RegExp(
      `Sitemap: ${origin.origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    ),
  );
  assert.ok((await stat(resolve(output, ".nojekyll"))).isFile());
});

test("the search index includes every full article once and links to a generated page", async () => {
  const index = JSON.parse(await read("search-index.json"));
  assert.equal(index.articles.length, content.articles.length);
  assert.equal(
    new Set(index.articles.map((a) => a.url)).size,
    index.articles.length,
  );
  for (const article of content.articles) {
    const entry = index.articles.find((a) => a.url === articleURL(article));
    assert.ok(entry, `search entry missing: ${article.slug}`);
    assert.equal(entry.title, article.title);
    assert.equal(entry.description, article.description);
    for (const section of article.sections) {
      assert.ok(
        entry.text.includes(section.title),
        `${article.slug}: section heading not searchable`,
      );
      for (const paragraph of section.paragraphs || [])
        assert.ok(
          entry.text.includes(paragraph),
          `${article.slug}: paragraph not searchable`,
        );
    }
    assert.ok(pages.has(`${article.category}/${article.slug}/index.html`));
  }
});

test("About, README, project metadata, and every footer expose the requested sites", async () => {
  const readme = await readFile(resolve(project, "README.md"), "utf8");
  const about = await read("about/index.html");
  for (const text of [readme, about]) {
    assert.ok(text.includes("https://juary.github.io/mycelariumwiki/"));
    assert.ok(text.includes("https://mycelarium.top/"));
    assert.ok(text.includes("PLAN KAPKAN"));
  }
  for (const [path, html] of pages)
    assert.match(
      html,
      /<footer\b[^>]*>[\s\S]*href="https:\/\/mycelarium\.top\/"/,
      `${path}: companion footer link missing`,
    );
  assert.equal(config.relatedSite, "https://mycelarium.top/");
  assert.equal(config.repository, "https://github.com/juary/mycelariumwiki");
});

test("the preview server serves the project base, assets, 404, and rejects traversal", async (t) => {
  const socket = createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((done) => socket.close(done));
  const child = spawn(process.execPath, ["scripts/serve.mjs"], {
    cwd: project,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => child.kill());
  const errors = [];
  child.stderr.on("data", (data) => errors.push(data.toString()));
  await Promise.race([
    once(child.stdout, "data"),
    once(child, "exit").then(([code]) => {
      throw new Error(`preview exited with ${code}: ${errors.join("")}`);
    }),
    new Promise((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error("preview startup timed out")),
        10000,
      );
      timer.unref();
    }),
  ]);
  const host = `http://127.0.0.1:${port}`;
  const rootResponse = await fetch(host + "/", { redirect: "manual" });
  assert.equal(rootResponse.status, base === "/" ? 200 : 302);
  if (base !== "/") assert.equal(rootResponse.headers.get("location"), base);
  const homepage = await fetch(host + base);
  assert.equal(homepage.status, 200);
  assert.match(await homepage.text(), /<h1>A small spore/);
  const css = await fetch(host + base + "assets/style.css");
  assert.equal(css.status, 200);
  assert.match(css.headers.get("content-type"), /^text\/css/);
  const search = await fetch(host + base + "search-index.json");
  assert.equal(search.status, 200);
  assert.equal((await search.json()).articles.length, content.articles.length);
  const missing = await fetch(host + base + "not-a-page/");
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /A path yet to be found/);
  const traversal = await fetch(host + base + "..%2F..%2FREADME.md");
  assert.equal(traversal.status, 404);
  const assetHead = await fetch(host + base + "assets/app.js", {
    method: "HEAD",
  });
  assert.equal(assetHead.status, 200);
  assert.equal(await assetHead.text(), "");
});
