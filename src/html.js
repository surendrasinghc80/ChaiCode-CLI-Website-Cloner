// =============================================
// File: src/html.js
// =============================================
import { URL } from "node:url";

export function extractLinksFromHtml($, pageUrl) {
  const assetSelectors = [
    ["img", "src"],
    ["img", "srcset"],
    ["source", "src"],
    ["source", "srcset"],
    ["link", "href"],
    ["script", "src"],
    ["video", "poster"],
    ["audio", "src"],
    ["iframe", "src"],
    ["track", "src"],
    ["embed", "src"],
    ["object", "data"],
    ['meta[property="og:image"]', "content"],
    ['meta[name="twitter:image"]', "content"],
  ];
  const pageSelectors = [["a", "href"]];

  const assetHrefs = new Set();
  const pageHrefs = new Set();

  for (const [sel, attr] of assetSelectors) {
    $(sel).each((_, el) => {
      const v = $(el).attr(attr);
      if (!v) return;
      if (attr.includes("srcset")) {
        v.split(",").forEach((part) => {
          const url = part.trim().split(" ")[0];
          if (url) assetHrefs.add(new URL(url, pageUrl).href);
        });
      } else {
        assetHrefs.add(new URL(v, pageUrl).href);
      }
    });
  }

  for (const [sel, attr] of pageSelectors) {
    $(sel).each((_, el) => {
      const v = $(el).attr(attr);
      if (!v) return;
      try {
        const abs = new URL(v, pageUrl).href;
        pageHrefs.add(abs);
      } catch {}
    });
  }
  return {
    assetHrefs: Array.from(assetHrefs),
    pageHrefs: Array.from(pageHrefs),
  };
}

export function rewriteHtmlLinks($, pageUrl, siteBase, assetMap) {
  const rewriteAttr = (sel, attr, mapper) => {
    $(sel).each((_, el) => {
      const oldVal = $(el).attr(attr);
      if (!oldVal) return;
      const newVal = mapper(oldVal);
      if (newVal) $(el).attr(attr, newVal);
    });
  };

  const makeLocal = (val) => {
    try {
      const abs = new URL(val, pageUrl);
      if (assetMap.has(abs.href)) {
        return "./" + assetMap.get(abs.href);
      }
      if (abs.origin === siteBase.origin) {
        // turn into a local html path
        let p = abs.pathname;
        if (p.endsWith("/")) p += "index.html";
        else if (!p.split("/").pop().includes(".")) p += ".html";
        if (abs.search)
          p += "_" + Buffer.from(abs.search).toString("base64url") + ".html";
        if (p.startsWith("/")) p = p.slice(1);
        return "./" + p;
      }
      return val; // external link untouched
    } catch {
      return val;
    }
  };

  // Inject SW registration for offline serving (idempotent)
  const head = $("head");
  if (head.length && $("script#siteclone-sw").length === 0) {
    head.append(
      `<script id="siteclone-sw">if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js');}</script>`
    );
  }

  rewriteAttr("link[href]", "href", makeLocal);
  rewriteAttr("script[src]", "src", makeLocal);
  rewriteAttr("img[src]", "src", makeLocal);
  rewriteAttr("img[srcset]", "srcset", (v) =>
    v
      .split(",")
      .map((part) => {
        const [u, d] = part.trim().split(" ");
        return makeLocal(u) + (d ? " " + d : "");
      })
      .join(", ")
  );
  rewriteAttr("source[src]", "src", makeLocal);
  rewriteAttr("source[srcset]", "srcset", (v) =>
    v
      .split(",")
      .map((part) => {
        const [u, d] = part.trim().split(" ");
        return makeLocal(u) + (d ? " " + d : "");
      })
      .join(", ")
  );
  rewriteAttr("a[href]", "href", makeLocal);
  rewriteAttr("video[poster]", "poster", makeLocal);
  rewriteAttr("audio[src]", "src", makeLocal);
  rewriteAttr("iframe[src]", "src", makeLocal);
  rewriteAttr("track[src]", "src", makeLocal);
  rewriteAttr("embed[src]", "src", makeLocal);
  rewriteAttr("object[data]", "data", makeLocal);
  rewriteAttr('meta[property="og:image"]', "content", makeLocal);
  rewriteAttr('meta[name="twitter:image"]', "content", makeLocal);
}
