import { revalidateTag } from "next/cache";

/**
 * Called by `npm run content:push` after uploading, so the site picks up new
 * or edited reviews without a redeploy. Needs REVALIDATE_SECRET.
 *
 *   POST /api/revalidate   Authorization: Bearer <REVALIDATE_SECRET>
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidateTag("content", "max");
  return Response.json({ ok: true });
}
