// =============================================
// File: src/fsutils.js
// =============================================
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import got from "got";

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeFileAtomic(filePath, data) {
  const tmp = filePath + ".tmp";
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, filePath);
}

export function normalizePathForFs(p) {
  return p.replace(/^\/+/, "").replace(/\\/g, "/");
}

export function safeJoin(...parts) {
  return path.join(...parts).replace(/\\/g, "/");
}

export function hashName(input, ext = "") {
  const h = crypto.createHash("sha1").update(input).digest("hex").slice(0, 10);
  if (ext && !ext.startsWith(".")) ext = "." + ext;
  return `${h}${ext}`;
}

export async function loadRobots(robotsUrl) {
  try {
    const res = await got(robotsUrl.href).text();
    return parseRobots(res);
  } catch {
    return null;
  }
}

export function parseRobots(text) {
  const lines = text.split(/\r?\n/);
  const rules = [];
  let current = { ua: "*", disallow: [], allow: [] };
  for (const line of lines) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const [kRaw, vRaw] = s.split(":", 2);
    if (!kRaw || !vRaw) continue;
    const k = kRaw.trim().toLowerCase();
    const v = vRaw.trim();
    if (k === "user-agent") {
      current = { ua: v, disallow: [], allow: [] };
      rules.push(current);
    } else if (k === "disallow") current.disallow.push(v);
    else if (k === "allow") current.allow.push(v);
  }
  return rules;
}

export function isAllowedByRobots(url, rules) {
  // minimal: if any rule for * disallows a path prefix, block
  const pathn = url.pathname;
  const star = rules.find((r) => r.ua === "*") || { disallow: [], allow: [] };
  const blocked = star.disallow.some(
    (prefix) => prefix && pathn.startsWith(prefix)
  );
  const allowed = star.allow.some(
    (prefix) => prefix && pathn.startsWith(prefix)
  );
  return allowed || !blocked;
}
