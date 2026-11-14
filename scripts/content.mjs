#!/usr/bin/env node
/**
 * Content tool: the local content/ folder <-> Cloudflare R2.
 *
 *   npm run content:check                     validate content/ (no network)
 *   npm run content:push [-- --dry-run]       upload what changed, then refresh the site
 *   npm run content:push -- --prune           …and delete R2 files that no longer exist locally
 *   npm run content:pull [-- --force]         download R2 into content/ (--force overwrites edits)
 *   npm run content:new -- <slug> <folder>    start a new review from the template
 *
 * Reads R2_* and REVALIDATE_* variables from .env.local (see CONTENT.md).
 * Everything lives under R2_PREFIX (default "film-files") inside the bucket.
 */
import { AwsClient } from "aws4fetch";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("content");
const env = process.env;
const PREFIX = (env.R2_PREFIX || "film-files").replace(/^\/+|\/+$/g, "");
const [cmd, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith("--")));
const args = rest.filter((a) => !a.startsWith("--"));

const TYPES = {
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};
const MAX_IMAGE = 5 * 1024 * 1024;

const c = { red: (s) => `\x1b[31m${s}\x1b[0m`, green: (s) => `\x1b[32m${s}\x1b[0m`, dim: (s) => `\x1b[2m${s}\x1b[0m` };
const die = (msg) => {
  console.error(c.red(msg));
  process.exit(1);
};

// ---- R2 -----------------------------------------------------------------
function r2() {
  for (const k of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"])
    if (!env[k]) die(`Missing ${k} (put it in .env.local)`);
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
  const base = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}`;
  const url = (key) => `${base}/${`${PREFIX}/${key}`.split("/").map(encodeURIComponent).join("/")}`;
  return {
    async list() {
      const keys = [];
      let token = "";
      do {
        const q = new URLSearchParams({ "list-type": "2", prefix: `${PREFIX}/` });
        if (token) q.set("continuation-token", token);
        const res = await client.fetch(`${base}?${q}`);
        if (!res.ok) die(`R2 list failed: ${res.status} ${await res.text()}`);
        const xml = await res.text();
        for (const m of xml.matchAll(/<Contents>[\s\S]*?<Key>([^<]+)<\/Key>[\s\S]*?<ETag>([^<]+)<\/ETag>[\s\S]*?<\/Contents>/g))
          keys.push({ key: m[1].replace(/&amp;/g, "&").slice(PREFIX.length + 1), etag: m[2].replace(/&quot;|"/g, "") });
        token = xml.match(/<NextContinuationToken>([^<]+)</)?.[1] ?? "";
      } while (token);
      return keys;
    },
    async put(key, body, type) {
      const res = await client.fetch(url(key), {
        method: "PUT",
        body,
        headers: {
          "content-type": type,
          // JSON changes in place; images rarely do (rename them to replace).
          "cache-control": type.startsWith("application/json") ? "no-cache" : "public, max-age=604800",
        },
      });
      if (!res.ok) die(`R2 PUT ${key} failed: ${res.status} ${await res.text()}`);
    },
    async get(key) {
      const res = await client.fetch(url(key));
      if (!res.ok) die(`R2 GET ${key} failed: ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },
    async del(key) {
      const res = await client.fetch(url(key), { method: "DELETE" });
      if (!res.ok && res.status !== 404) die(`R2 DELETE ${key} failed: ${res.status}`);
    },
  };
}

// ---- Local files ----------------------------------------------------------
async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}
const keyOf = (file) => path.relative(ROOT, file).split(path.sep).join("/");
const md5 = (buf) => createHash("md5").update(buf).digest("hex");

/** Content checks that would otherwise only show up as a broken page. */
async function check() {
  const problems = [];
  const readJson = async (rel) => {
    try {
      return JSON.parse(await fs.readFile(path.join(ROOT, rel), "utf8"));
    } catch (e) {
      problems.push(`${rel}: ${e.code === "ENOENT" ? "missing" : `invalid JSON — ${e.message}`}`);
      return null;
    }
  };
  const isText = (v) => typeof v === "string" || (v && typeof v.en === "string" && typeof v.vi === "string");

  const index = await readJson("folders.json");
  if (!index) return problems;
  const seen = new Set();
  for (const f of index.folders ?? []) {
    if (!f.slug || !isText(f.title)) problems.push(`folders.json: a folder needs "slug" and "title"`);
    for (const slug of f.posts ?? []) {
      if (seen.has(slug)) problems.push(`folders.json: "${slug}" is listed twice`);
      seen.add(slug);
      const rel = `reviews/${slug}/review.json`;
      const r = await readJson(rel);
      if (!r) continue;
      if (r.slug !== slug) problems.push(`${rel}: "slug" is "${r.slug}", expected "${slug}"`);
      if (r.folder !== f.slug) problems.push(`${rel}: "folder" is "${r.folder}", but folders.json files it under "${f.slug}"`);
      if (!isText(r.title)) problems.push(`${rel}: "title" must be text or {"en","vi"}`);
      // The analysis fields are optional (an unwritten review shows "coming soon"), but must be text when present.
      for (const k of ["quote", "quoteBy", "excerpt", "genre", "topic"])
        if (r[k] !== undefined && !isText(r[k])) problems.push(`${rel}: "${k}" must be text or {"en","vi"}`);
      if (!/^#[0-9a-f]{6}$/i.test(r.color ?? "")) problems.push(`${rel}: "color" must be like "#D71E1E"`);
      if (r.verdict !== undefined && !["agrees", "against", "between"].includes(r.verdict))
        problems.push(`${rel}: "verdict" must be agrees | against | between (or left out until it's written)`);
      if (Number.isNaN(Date.parse(r.date))) problems.push(`${rel}: "date" must be like "2026-09-14"`);
      if (r.body !== undefined && !Array.isArray(r.body)) problems.push(`${rel}: "body" must be a list of blocks ([] = coming soon)`);
      // Every relative image the review mentions must exist next to it.
      const images = [];
      const collect = (v, key) => {
        if (Array.isArray(v)) v.forEach((x) => collect(x, key === "frames" ? "src" : undefined));
        else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => collect(x, k));
        else if (typeof v === "string" && (key === "src" || key === "still") && !/^(https?:)?\/\//.test(v)) images.push(v);
      };
      collect(r);
      for (const img of images) {
        const p = path.join(ROOT, "reviews", slug, img);
        const stat = await fs.stat(p).catch(() => null);
        if (!stat) problems.push(`${rel}: image "${img}" not found in content/reviews/${slug}/`);
        else if (stat.size > MAX_IMAGE) problems.push(`${rel}: image "${img}" is ${(stat.size / 1e6).toFixed(1)}MB — keep images under 5MB (2000px wide is plenty)`);
      }
    }
  }
  for (const d of await fs.readdir(path.join(ROOT, "reviews")).catch(() => []))
    if (!seen.has(d)) problems.push(`reviews/${d}/ is not listed in folders.json (it won't appear on the site)`);
  return problems;
}

async function revalidate() {
  const site = (env.REVALIDATE_URL || env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  if (!env.REVALIDATE_SECRET || !site) {
    console.log(c.dim("Skipped refreshing the site (set REVALIDATE_SECRET and NEXT_PUBLIC_SITE_URL). New content shows within the hour."));
    return;
  }
  const res = await fetch(`${site}/api/revalidate`, { method: "POST", headers: { authorization: `Bearer ${env.REVALIDATE_SECRET}` } }).catch((e) => ({ ok: false, status: e.message }));
  console.log(res.ok ? c.green(`Site refreshed: ${site}`) : c.red(`Could not refresh ${site} (${res.status}) — content shows within the hour.`));
}

// ---- Commands -------------------------------------------------------------
async function push() {
  const problems = await check();
  if (problems.length) die(`Not pushing — fix these first:\n  ${problems.join("\n  ")}`);
  const bucket = r2();
  const remote = new Map((await bucket.list()).map((o) => [o.key, o.etag]));
  const files = (await walk(ROOT)).filter((f) => TYPES[path.extname(f).toLowerCase()]);
  let sent = 0;
  for (const file of files) {
    const key = keyOf(file);
    const body = await fs.readFile(file);
    if (remote.get(key) === md5(body)) continue; // unchanged
    console.log(`${flags.has("--dry-run") ? "would upload" : "upload"}  ${key}`);
    if (!flags.has("--dry-run")) await bucket.put(key, body, TYPES[path.extname(file).toLowerCase()]);
    sent++;
  }
  const local = new Set(files.map(keyOf));
  const stale = [...remote.keys()].filter((k) => !local.has(k));
  if (stale.length && flags.has("--prune")) {
    for (const key of stale) {
      console.log(`${flags.has("--dry-run") ? "would delete" : "delete"}  ${key}`);
      if (!flags.has("--dry-run")) await bucket.del(key);
    }
  } else if (stale.length) {
    console.log(c.dim(`${stale.length} file(s) in R2 no longer exist locally (add --prune to delete them).`));
  }
  console.log(c.green(`${sent ? `${sent} file(s) ${flags.has("--dry-run") ? "to upload" : "uploaded"}` : "R2 is already up to date"} → ${env.R2_BUCKET}/${PREFIX}/`));
  if (sent && !flags.has("--dry-run")) await revalidate();
}

async function pull() {
  const bucket = r2();
  const objects = await bucket.list();
  if (!objects.length) die(`Nothing in ${env.R2_BUCKET}/${PREFIX}/ yet.`);
  let wrote = 0;
  for (const { key, etag } of objects) {
    const file = path.join(ROOT, ...key.split("/"));
    const existing = await fs.readFile(file).catch(() => null);
    if (existing && md5(existing) === etag) continue;
    if (existing && !flags.has("--force")) {
      console.log(c.dim(`keep   ${key} (differs locally — --force to overwrite)`));
      continue;
    }
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, await bucket.get(key));
    console.log(`write  ${key}`);
    wrote++;
  }
  console.log(c.green(`${wrote} file(s) written to content/`));
}

async function scaffold() {
  const [slug, folder] = args;
  if (!slug || !folder) die("Usage: npm run content:new -- <slug> <folder-slug>   e.g. dune-2021 denis-villeneuve");
  if (!/^[a-z0-9-]+$/.test(slug)) die("The slug may only use a-z, 0-9 and -");
  const dir = path.join(ROOT, "reviews", slug);
  if (await fs.stat(dir).catch(() => null)) die(`content/reviews/${slug}/ already exists`);
  const indexFile = path.join(ROOT, "folders.json");
  const index = JSON.parse(await fs.readFile(indexFile, "utf8"));
  let f = index.folders.find((x) => x.slug === folder);
  if (!f) {
    f = { slug: folder, title: folder.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "), description: { en: "", vi: "" }, posts: [] };
    index.folders.push(f);
    console.log(c.dim(`New folder "${folder}" added to folders.json — fill in its title and description.`));
  }
  f.posts.push(slug);
  const template = JSON.parse(await fs.readFile(path.resolve("scripts/review.template.json"), "utf8"));
  Object.assign(template, { slug, folder });
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "review.json"), JSON.stringify(template, null, 2) + "\n");
  await fs.writeFile(indexFile, JSON.stringify(index, null, 2) + "\n");
  console.log(c.green(`Created content/reviews/${slug}/review.json — put its images in the same folder.`));
}

const commands = {
  check: async () => {
    const problems = await check();
    if (problems.length) die(`${problems.length} problem(s):\n  ${problems.join("\n  ")}`);
    console.log(c.green("content/ looks good"));
  },
  push,
  pull,
  new: scaffold,
};
if (!commands[cmd]) die(`Unknown command "${cmd ?? ""}". Use: check | push | pull | new`);
await commands[cmd]();
