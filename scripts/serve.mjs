import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import config from "../src/data/site.json" with { type: "json" };

const root = resolve("dist");
const base =
  new URL(process.env.SITE_URL || config.url).pathname.replace(/\/$/, "") + "/";
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/" && base !== "/") {
      res.writeHead(302, { Location: base });
      res.end();
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    if (!pathname.startsWith(base)) throw new Error("Not found");
    let file = resolve(root, "." + pathname.slice(base.length - 1));
    if (!file.startsWith(root + sep) && file !== root)
      throw new Error("Not found");
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(await readFile(resolve(root, "404.html")));
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Preview: http://localhost:${port}${base}`),
);
