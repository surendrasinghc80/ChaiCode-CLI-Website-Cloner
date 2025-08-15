// =============================================
// File: src/css.js
// =============================================
import postcss from "postcss";
import postcssUrl from "postcss-url";

export async function rewriteCssUrls(cssText, mapFn) {
  const foundUrls = [];
  const result = await postcss([
    postcssUrl({
      url: (asset) => {
        foundUrls.push(asset.url);
        return mapFn(asset.url);
      },
    }),
  ]).process(cssText, { from: undefined });
  return { rewritten: result.css, foundUrls };
}

export function extractUrlsFromCss(cssText) {
  const urls = [];
  cssText.replace(/url\(([^)]+)\)/g, (_, m) => {
    const u = m.trim().replace(/^['\"]|['\"]$/g, "");
    urls.push(u);
    return _;
  });
  return urls;
}
