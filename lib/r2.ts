import "server-only";
import { AwsClient } from "aws4fetch";

/**
 * Cloudflare R2 over its S3 API. Configured entirely by environment
 * variables (see .env.local / CONTENT.md):
 *
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *   R2_PREFIX                   folder inside the bucket (default "film-files")
 *   NEXT_PUBLIC_R2_PUBLIC_URL   public address of the bucket, for images
 */
const env = process.env;

export const R2_PREFIX = (env.R2_PREFIX || "film-files").replace(/^\/+|\/+$/g, "");

export const r2Configured = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET,
);

let client: AwsClient | null = null;
const r2 = () =>
  (client ??= new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    service: "s3",
    region: "auto",
  }));

const objectUrl = (key: string) =>
  `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${R2_PREFIX}/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

/** Reads a JSON object from the bucket. null when it doesn't exist. */
export async function r2GetJson<T>(key: string): Promise<T | null> {
  const res = await r2().fetch(objectUrl(key));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 GET ${key} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

/** Public URL of a file in the bucket (images). */
export function r2PublicUrl(key: string) {
  const base = (env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/+$/, "");
  return `${base}/${R2_PREFIX}/${key}`;
}
