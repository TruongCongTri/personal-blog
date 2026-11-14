import fs from "node:fs/promises";
import path from "node:path";
import { contentSource } from "@/lib/content";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const ROOT = path.join(process.cwd(), "content");

/**
 * Serves images from the local content/ folder, for previewing a review
 * before it is pushed to R2. Only active while the site reads local content;
 * with R2 as the source, images come from the bucket's public URL instead.
 */
export async function GET(_req: Request, { params }: RouteContext<"/media/[...path]">) {
  if ((await contentSource()) !== "local") return new Response("Not found", { status: 404 });
  const { path: parts } = await params;
  const file = path.join(ROOT, ...parts);
  const type = TYPES[path.extname(file).toLowerCase()];
  // Images only, and never outside content/.
  if (!type || !file.startsWith(ROOT + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const body = await fs.readFile(file);
    return new Response(body, { headers: { "content-type": type, "cache-control": "public, max-age=60" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
