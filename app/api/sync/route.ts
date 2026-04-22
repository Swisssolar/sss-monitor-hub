import { NextRequest, NextResponse } from "next/server";
import { syncAllConnections } from "@/lib/services/sync";

/**
 * POST /api/sync
 *
 * Designed for Vercel Cron or any external scheduler.
 * Authentication: shared secret in Authorization header, matching SYNC_CRON_SECRET.
 *
 * GET works in dev for easy manual invocation (disabled in production).
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.SYNC_CRON_SECRET ?? ""}`;
  if (!process.env.SYNC_CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await syncAllConnections();
  return NextResponse.json({ success: true, ...result });
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "method not allowed" }, { status: 405 });
  }
  const result = await syncAllConnections();
  return NextResponse.json({ success: true, ...result });
}
