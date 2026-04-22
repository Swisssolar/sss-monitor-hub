import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { enphaseExchangeCode, enphaseIsConfigured } from "@/lib/providers/enphase";
import { encryptSecret } from "@/lib/crypto";
import { audit } from "@/lib/services/audit";

/**
 * Enphase OAuth callback.
 *
 * Expected flow:
 *   1. Admin clicks "Connecter Enphase" on a ProviderConnection row; we
 *      redirect to `/api/providers/enphase/callback?connectionId=…` via the
 *      Enphase authorize URL with `state=<connectionId>`.
 *   2. Enphase redirects back here with `?code=…&state=<connectionId>`.
 *   3. We exchange the code, encrypt tokens, persist on the connection, and
 *      redirect back to the admin UI.
 */
export async function GET(req: NextRequest) {
  const session = await requireAdmin();

  if (!enphaseIsConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/connexions?error=enphase_not_configured", req.url),
      { status: 303 }
    );
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state"); // connectionId

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/admin/connexions?error=missing_params", req.url),
      { status: 303 }
    );
  }

  try {
    const tokens = await enphaseExchangeCode(code);
    await prisma.providerConnection.update({
      where: { id: state },
      data: {
        accessTokenEncrypted: encryptSecret(tokens.accessToken),
        refreshTokenEncrypted: encryptSecret(tokens.refreshToken),
        tokenExpiresAt: tokens.expiresAt,
        status: "CONNECTED",
        lastError: null,
      },
    });
    await audit({
      actorUserId: session.userId,
      action: "connection.enphase_oauth_success",
      entityType: "ProviderConnection",
      entityId: state,
    });
    return NextResponse.redirect(
      new URL(`/admin/connexions?ok=1`, req.url),
      { status: 303 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "oauth_error";
    await prisma.providerConnection.update({
      where: { id: state },
      data: { status: "ERROR", lastError: msg.slice(0, 500) },
    });
    return NextResponse.redirect(
      new URL(`/admin/connexions?error=${encodeURIComponent(msg)}`, req.url),
      { status: 303 }
    );
  }
}
