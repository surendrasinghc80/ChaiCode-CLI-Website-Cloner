// =============================================
// File: src/crawler.js
// =============================================
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { URL } from "node:url";
import got from "got";
import * as cheerio from "cheerio";
import ora from "ora";
import pLimit from "p-limit";
import {
  ensureDir,
  safeJoin,
  writeFileAtomic,
  normalizePathForFs,
  hashName,
  loadRobots,
  isAllowedByRobots,
} from "./fsutils.js";
import { rewriteHtmlLinks, extractLinksFromHtml } from "./html.js";
import { rewriteCssUrls, extractUrlsFromCss } from "./css.js";

export async function crawlAndClone(opts) {
  const {
    startUrl,
    outDir,
    maxPages,
    sameOriginOnly,
    concurrency,
    timeout,
    respectRobots,
  } = opts;
  const base = new URL(startUrl);
  await ensureDir(outDir);
  const spinner = ora(`Cloning ${startUrl}`).start();

  const visited = new Set();
  const assetMap = new Map(); // remote URL -> local relative path
  const pageQueue = [startUrl];
  const limit = pLimit(concurrency);

  let robotsRules = null;
  if (respectRobots) {
    try {
      robotsRules = await loadRobots(new URL("/robots.txt", base));
    } catch {}
  }

  async function downloadAsset(remoteUrl) {
    if (assetMap.has(remoteUrl)) return assetMap.get(remoteUrl);
    const u = new URL(remoteUrl, base);
    if (sameOriginOnly && u.origin !== base.origin) return null;
    if (respectRobots && robotsRules && !isAllowedByRobots(u, robotsRules))
      return null;

    const extGuess = path.extname(u.pathname) || "";
    const hashedName = hashName(u.href, extGuess || ".bin");
    const relPath = path.join("assets", hashedName);
    const outPath = path.join(outDir, relPath);
    await ensureDir(path.dirname(outPath));
    try {
      const res = await got(u.href, {
        timeout: { request: timeout },
        retry: { limit: 1 },
      }).buffer();
      await writeFileAtomic(outPath, res);
      assetMap.set(remoteUrl, relPath.replaceAll("\\", "/"));
      return relPath;
    } catch (e) {
      return null;
    }
  }

  async function processHtml(pageUrl, html) {
    const $ = cheerio.load(html, { decodeEntities: false });

    // collect assets and linked pages
    const { assetHrefs, pageHrefs } = extractLinksFromHtml($, pageUrl);

    // Download assets first (CSS/JS/images/fonts)
    await Promise.all(
      assetHrefs.map((href) =>
        limit(() => downloadAsset(new URL(href, pageUrl).href))
      )
    );

    // Rewrite HTML to point to local assets and local pages
    rewriteHtmlLinks($, pageUrl, base, assetMap);

    // Also handle inline <style> blocks: rewrite url(...) inside
    const styleTags = $("style");
    for (const el of styleTags.toArray()) {
      const cssText = $(el).html() || "";
      const { rewritten, foundUrls } = await rewriteCssUrls(
        cssText,
        async (remote) => {
          const rel = await downloadAsset(new URL(remote, pageUrl).href);
          return rel ? "./" + rel : remote;
        }
      );
      $(el).text(rewritten);
    }

    // Save page to a deterministic local path
    const pageRel = urlToLocalPath(pageUrl, base);
    const pageOut = path.join(outDir, pageRel);
    await ensureDir(path.dirname(pageOut));
    await writeFileAtomic(pageOut, $.html());

    // Enqueue internal links for crawling
    for (const href of pageHrefs) {
      try {
        const u = new URL(href, pageUrl);
        if (u.origin !== base.origin) continue;
        const norm = u.href.split("#")[0];
        if (!visited.has(norm) && visited.size < maxPages) {
          pageQueue.push(norm);
        }
      } catch {}
    }
  }

  while (pageQueue.length && visited.size < maxPages) {
    const current = pageQueue.shift();
    if (!current || visited.has(current)) continue;
    if (
      respectRobots &&
      robotsRules &&
      !isAllowedByRobots(new URL(current), robotsRules)
    ) {
      continue;
    }

    visited.add(current);
    try {
      const res = await got(current, {
        timeout: { request: timeout },
        retry: { limit: 1 },
      });
      let contentType = res.headers["content-type"] || "";
      if (!contentType.includes("text/html")) {
        // Not HTML—treat as asset and skip
        await downloadAsset(current);
        continue;
      }
      await processHtml(current, res.body);
      spinner.text = `Cloned ${visited.size} page(s), assets: ${assetMap.size}`;
    } catch (e) {
      // ignore and continue
    }
  }

  // Generate a cache manifest (sw.js) and inject registration into all pages for robust offline serving
  await generateServiceWorker(outDir);

  spinner.succeed(
    `Done. Pages: ${visited.size}, assets: ${assetMap.size}. Output: ${outDir}`
  );
}

function urlToLocalPath(pageUrl, base) {
  const u = new URL(pageUrl);
  const rel = u.pathname.endsWith("/")
    ? path.join(u.pathname, "index.html")
    : path.extname(u.pathname)
    ? u.pathname
    : u.pathname + ".html";
  let clean = rel.startsWith("/") ? rel.slice(1) : rel;
  if (!clean) clean = "index.html";
  return normalizePathForFs(clean);
}

async function generateServiceWorker(root) {
  // list all files to precache
  const { glob } = await import("glob");
  const files = await glob("**/*.*", { cwd: root, nodir: true });
  const manifest = files.map((f) => "/" + f.replace(/\\/g, "/"));
  const sw = `self.addEventListener('install', event => {\n  event.waitUntil((async () => {\n    const cache = await caches.open('siteclone-precache-v1');\n    await cache.addAll(${JSON.stringify(
    manifest
  )});\n    self.skipWaiting();\n  })());\n});\nself.addEventListener('activate', e => e.waitUntil(self.clients.claim()));\nself.addEventListener('fetch', event => {\n  const url = new URL(event.request.url);\n  event.respondWith((async () => {\n    const cache = await caches.open('siteclone-precache-v1');\n    const match = await cache.match(url.pathname);\n    if (match) return match;\n    const fallback = await cache.match('/index.html');\n    return fallback || Response.error();\n  })());\n});`;
  await fs.writeFile(path.join(root, "sw.js"), sw, "utf8");
}
